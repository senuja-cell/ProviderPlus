from datetime import datetime
from typing import List
from beanie import PydanticObjectId

from ..models.conversation_model import Conversation
from ..models.message_model import Message
from ..models.push_token_model import PushToken
from ..schemas.conversation_schemas import ConversationCreate
from ..schemas.message_schemas import MessageCreate, PushTokenRegister
from ..core.websocket_manager import manager
from ..services.notification_service import send_push_notification


class MessagingService:

    # CONVERSATIONS
    async def get_or_create_conversation(self
                                         , user_id: str, data: ConversationCreate) -> Conversation:
        """
        Checks if a conversation between this user and provider already exists
        if yes, returns it. if no, creates a  new one
        guarantees exactly one thread between any user+provider pair
        """

        existing = await Conversation.find_one(
            Conversation.user_id == user_id,
            Conversation.provider_id == data.provider_id
        )

        if existing:
            return existing

        new_conversation = Conversation(
            user_id=user_id,
            provider_id=data.provider_id,
            service_category=data.service_category
        )

        await new_conversation.insert()
        return new_conversation



    async def get_user_conversations(self, user_id: str) -> List[Conversation]:
        """
        returns all conversations for  a user or provider
        works for both sides - queries  where user_id OR  provider_id matches
        sorted by most recent message first
        """

        conversations = await Conversation.find(
            {
                "$or": [
                    {"user_id": user_id},
                    {"provider_id": user_id}
                ]
            }
        ).sort(-Conversation.last_message_at).to_list()

        return conversations


    # MESSAGES
    async def get_messages(self, conversation_id: str) -> List[Message]:
        """
        fetches the full message history for a conversation
        sorted oldest first so the chat renders ttop to bottom naturally
        """
        messages = await Message.find(
            Message.conversation_id == conversation_id
        ).sort(+Message.sent_at).to_list()

        return messages


    async def save_and_deliver_message(
            self,
            conversation_id: str,
            sender_id: str,
            recipient_id: str,
            data: MessageCreate
    ) -> Message:
        """
        the core function of the entire messenger. does 4 things in order
        1. saves the message to mongodb via beanie
        2. updates  the conversation  preview and timestamp
        3. if recipient is  online,  delivers via websocket instantly
        4. if offline, sends an expo push notification
        """

        new_message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            recipient_id=recipient_id,
            content=data.content
        )
        await new_message.insert()

        conversation = await Conversation.get(PydanticObjectId(conversation_id))

        if conversation:
            conversation.last_message_at = datetime.utcnow()
            conversation.last_message_preview = data.content[:60]
            await conversation.save()


        if manager.is_online(recipient_id):
            await manager.send_message(
                recipient_id,
                {
                    "id": str(new_message.id),
                    "conversation_id": conversation_id,
                    "sender_id": sender_id,
                    "content": data.content
                }
            )
            new_message.delivered = True
            await new_message.save()

        else:
            push_token = await PushToken.find_one(
                PushToken.user_id == recipient_id
            )
            if push_token:
                await send_push_notification(
                    expo_token=push_token.expo_push_token,
                    title="New Message",
                    body=data.content[:100],
                    data={"conversation_id": conversation_id}
                )

        return new_message


    async def mark_message_read(self, message_id: str, reader_id: str) -> bool:
        """
        marks a message as read by filling in the read_at timestamp
        only the recipient of  the message can do this, not the sender
        thiss is how  'seen' receipts are implemented
        """

        message = await Message.get(message_id)

        if not message:
            return False

        if message.recipient_id != reader_id:
            return False

        message.read_at = datetime.utcnow()
        await message.save()
        return True



    # PUSH TOKENS
    async def register_push_token(self, user_id: str, data: PushTokenRegister) -> bool:
        """
        Saves or updates a device's push token.
        Creates the record if it doesn't exist, or updates it if it does.
        """
        existing_token = await PushToken.find_one(PushToken.user_id == user_id)

        if existing_token:
            existing_token.expo_push_token = data.expo_push_token
            existing_token.device_info = data.device_info
            existing_token.registered_at = datetime.utcnow()
            await existing_token.save()
        else:
            new_token = PushToken(
                user_id=user_id,
                expo_push_token=data.expo_push_token,
                device_info=data.device_info
            )
            await new_token.insert()

        return True
