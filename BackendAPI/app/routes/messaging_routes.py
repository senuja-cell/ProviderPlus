from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import List

from ..core.websocket_manager import manager
from ..models.provider_model import Provider
from ..services.messaging_service import MessagingService, create_booking
from ..schemas.conversation_schemas import ConversationCreate, ConversationResponse
from ..schemas.message_schemas import MessageCreate, MessageReadUpdate, PushTokenRegister
from ..schemas.booking_schemas import BookingResponse, BookingCreate
from ..models.user_model import User
from ..models.conversation_model import Conversation
from ..models.booking_model import Booking, BookingStatus, BookingWithProvider

from ..core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ---------------------------------------------------------------------------
# Router setup
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/messaging", tags=["Messaging"])


# ---------------------------------------------------------------------------
# Service dependency
# ---------------------------------------------------------------------------
# Since we use Beanie, no db needs to be injected — just instantiate directly
def get_messaging_service() -> MessagingService:
    return MessagingService()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Standard HTTP auth dependency — reads JWT from the Authorization header.
    Used by all regular HTTP endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await User.get(user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_current_user_from_token(token: str) -> User:
    """
    WebSocket auth helper — same JWT logic but accepts a raw token string.
    WebSocket clients can't send Authorization headers the same way HTTP
    clients can, so the token is passed as a query param instead.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    user = await User.get(user_id)
    return user


# ---------------------------------------------------------------------------
# PUSH TOKEN
# ---------------------------------------------------------------------------

@router.post("/register-token", status_code=status.HTTP_200_OK)
async def register_push_token(
        data: PushTokenRegister,
        current_user: User = Depends(get_current_user),
        service: MessagingService = Depends(get_messaging_service)
):
    """
    Called by the app on startup to register the device's push token.
    Without this, offline push notifications cannot be delivered.
    The user_id is taken from the JWT — the client never sends it directly.
    """
    await service.register_push_token(str(current_user.id), data)
    return {"message": "Push token registered successfully"}


# ---------------------------------------------------------------------------
# CONVERSATIONS
# ---------------------------------------------------------------------------

@router.post("/conversations", response_model=ConversationResponse)
async def start_or_get_conversation(
        data: ConversationCreate,
        current_user: User = Depends(get_current_user),
        service: MessagingService = Depends(get_messaging_service)
):
    """
    Called when a user taps on a provider to message them.
    Returns an existing conversation if one already exists,
    or creates a new one if this is the first time they're talking.
    """
    conversation = await service.get_or_create_conversation(str(current_user.id), data)
    return conversation


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
        current_user: User = Depends(get_current_user),
        service: MessagingService = Depends(get_messaging_service)
):
    """
    Returns all conversations for the currently logged in user or provider.
    Powers the chat list screen — sorted by most recent message first.
    Works for both users and providers since we query both sides.
    """
    conversations = await service.get_user_conversations(str(current_user.id))
    return conversations


# ---------------------------------------------------------------------------
# MESSAGES
# ---------------------------------------------------------------------------

@router.get("/conversations/{conversation_id}/messages")
async def get_message_history(
        conversation_id: str,
        current_user: User = Depends(get_current_user),
        service: MessagingService = Depends(get_messaging_service)
):
    """
    Returns the full message history for a conversation thread.
    Called when a user opens a chat to load previous messages.
    Sorted oldest to newest so the UI renders naturally top to bottom.
    """
    messages = await service.get_messages(conversation_id)
    # Serialize properly so id comes through as a string
    return [
        {
            "id": str(msg.id),
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "recipient_id": msg.recipient_id,
            "content": msg.content,
            "sent_at": msg.sent_at,
            "delivered": msg.delivered,
            "read_at": msg.read_at,
        }
        for msg in messages
    ]


@router.patch("/messages/read")
async def mark_message_as_read(
        data: MessageReadUpdate,
        current_user: User = Depends(get_current_user),
        service: MessagingService = Depends(get_messaging_service)
):
    """
    Called when the recipient opens and reads a message.
    Fills in the read_at timestamp on that message in MongoDB.
    This is how 'seen' receipts are implemented.
    Only the recipient of a message can mark it as read.
    """
    success = await service.mark_message_read(data.message_id, str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Message not found or you are not the recipient"
        )
    return {"message": "Message marked as read"}



# ---------------------------------------------------------------------------
# WEBSOCKET — Real-time messaging
# ---------------------------------------------------------------------------

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
        websocket: WebSocket,
        conversation_id: str,
        token: str,     # Passed as query param: ws://server/messaging/ws/{id}?token=xxxxx
        service: MessagingService = Depends(get_messaging_service)
):
    """
    The WebSocket endpoint — the core of real-time messaging.

    How it works:
      1. App connects here when the user opens a chat screen
      2. We validate the JWT token to know who is connecting
      3. We register them in the WebSocketManager as 'online'
      4. We enter a loop waiting for messages
      5. Each message is saved and delivered to the recipient
      6. When the user leaves the screen the connection closes and they go 'offline'

    Connection URL from the app:
      ws://your-server/messaging/ws/{conversation_id}?token={jwt_token}
    """

    # Step 1 — Validate the JWT from the query param
    current_user = await get_current_user_from_token(token)
    if not current_user:
        await websocket.close(code=1008)  # 1008 = Policy Violation (bad token)
        return

    # Step 2 — Look up the conversation to find the recipient
    conversation = await Conversation.get(conversation_id)
    if not conversation:
        await websocket.close(code=1008)
        return

    sender_id = str(current_user.id)

    # The recipient is whoever the sender is NOT in this conversation
    recipient_id = (
        conversation.provider_id
        if sender_id == conversation.user_id
        else conversation.user_id
    )

    # Step 3 — Register this user as online
    await manager.connect(sender_id, websocket)

    try:
        # Step 4 — Keep the connection alive and listen for messages
        while True:
            raw_data = await websocket.receive_json()
            message_data = MessageCreate(**raw_data)

            # Step 5 — Save and deliver the message
            await service.save_and_deliver_message(
                conversation_id=conversation_id,
                sender_id=sender_id,
                recipient_id=recipient_id,
                data=message_data
            )

    except WebSocketDisconnect:
        # Step 6 — User left or lost connection — mark them offline
        manager.disconnect(sender_id)
        print(f"[WS] {sender_id} disconnected from conversation {conversation_id}")


@router.post("/booking/")
async def store_booking_details(
        data: BookingCreate,
        current_user: User = Depends(get_current_user)
):
    """
    called when the user taps finalize booking in the chat modal
    saves the booking to mongodb and returns a booking_id
    so the  frontend can navigate to the payment screen
    """

    booking = Booking(
        user_id=str(current_user.id),
        provider_id=data.provider_id,
        conversation_id=data.conversation_id,
        date=data.date,
        time=data.time,
        summary=data.summary,
        status=BookingStatus.pending,
        user_latitude=data.user_latitude,
        user_longitude=data.user_longitude
    )

    await create_booking(booking)

    return BookingResponse(
        booking_id=str(booking.id),
        status=booking.status,
    )


@router.patch("/booking/{booking_id}/confirm")
async def confirm_booking(
        booking_id: str,
        current_user: User = Depends(get_current_user)
):
    booking = await Booking.get(booking_id)

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    booking.status = BookingStatus.confirmed
    await booking.save()

    return BookingResponse(
        booking_id=str(booking.id),
        status=booking.status
    )

@router.get("/booking/my", response_model=List[BookingWithProvider])
async def get_my_bookings(current_user: User = Depends(get_current_user)):
    """
    Returns all bookings for the currently logged-in user,
    split by status so the frontend can show Upcoming vs Finished.
    Provider name and category are populated here so the frontend
    doesn't need to make extra calls.
    """
    bookings = await Booking.find(
        Booking.user_id == str(current_user.id)
    ).sort(-Booking.created_at).to_list()

    result = []

    for booking in bookings:
        # Fetch linked provider to get name and category
        provider = await Provider.get(booking.provider_id)

        if not provider:
            # Provider was deleted — still show the booking with a placeholder
            provider_name  = "Unknown Provider"
            category_name  = "Service"
        else:
            provider_name = provider.name
            # Fetch the category document linked to the provider
            try:
                category     = await provider.category.fetch()
                category_name = category.name
            except Exception:
                category_name = "Service"

        result.append(BookingWithProvider(
            booking_id=str(booking.id),
            provider_id=booking.provider_id,
            provider_name=provider_name,
            category_name=category_name,
            summary=booking.summary,
            date=booking.date,
            time=booking.time,
            status=booking.status,
            created_at=booking.created_at,
        ))

    return result
