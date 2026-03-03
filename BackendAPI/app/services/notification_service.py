import httpx
from typing import Optional


# Expo's push notification endpoint — this is a free public API
# Your backend sends a request here, Expo handles the rest (iOS/Android delivery)
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notification(
        expo_token: str,
        title: str,
        body: str,
        data: Optional[dict] = None
) -> bool:
    """
    Sends a push notification to a specific device via Expo's Push API.

    How this fits in the flow:
      - messaging_service.py calls this when a message recipient is offline
      - We pass in their expo_push_token (looked up from MongoDB)
      - Expo's servers handle the actual delivery to iOS / Android

    Parameters:
      expo_token — the device token stored in our push_tokens collection
      title      — the bold heading on the notification e.g. "New Message"
      body       — the preview text e.g. the first 100 chars of the message
      data       — optional extra payload the app can read when notification is tapped
                   we use this to pass the conversation_id so the app can open
                   the right chat thread directly
    """

    payload = {
        "to": expo_token,
        "title": title,
        "body": body,
        "sound": "default",   # Plays the default notification sound on the device
        "data": data or {}
    }

    try:
        # httpx is an async HTTP client — like requests but works with async FastAPI
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate"
                }
            )

            result = response.json()

            # Expo returns a "data" array with a status for each notification sent
            # "ok" means it was accepted for delivery, "error" means something went wrong
            if result.get("data", [{}])[0].get("status") == "ok":
                print(f"[PUSH] Notification sent successfully to {expo_token[:20]}...")
                return True
            else:
                print(f"[PUSH] Expo returned an error: {result}")
                return False

    except Exception as e:
        # We never want a failed notification to crash the message flow
        # The message is already saved — notification failure is non-critical
        print(f"[PUSH] Failed to send notification: {e}")
        return False
