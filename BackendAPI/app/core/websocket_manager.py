from fastapi import WebSocket
from typing import Dict


class WebSocketManager:
    """
    Keeps track of all currently active WebSocket connections.
    Each user/provider is identified by their user_id (from JWT)
    When a message is sent, we check here if the recipient is online and if so, deliver it directly through their
    open socket.
    """

    def __init__(self):
        """
        Maps user_id -> WebSocket connection
        e.g: user_1: <WebSocket>, provider_1: <WebSocket>
        """
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """
        accept a new Websocket connection  and register it
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"[WS] {user_id} connected. total online {len(self.active_connections)}")


    def disconnect(self, user_id: str):
        """
        remove a user's connection wheen they disconnect or go offline
        """

    def is_online(self, user_id: str) -> bool:
        """
        check if a user currently has an active websocket connection
        """
        return user_id in self.active_connections


    async def send_message(self, recipient_id: str, message: dict):
        """
        send a message directly to a connected user.
        called when the recipient is currently online
        """
        websocket = self.active_connections.get(recipient_id)

        if websocket:
            try:
                await websocket.send_json(message)
                print(f"[WS] message delivered to {recipient_id}")

            except Exception:
                self.disconnect(recipient_id)
                print(f"[WS] {recipient_id} was disconnected mid-send, removed from active connections")


manager = WebSocketManager()














