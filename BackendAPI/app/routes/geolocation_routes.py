import os
from fastapi import APIRouter, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from ..services.geolocation_service import (
    save_sp_location,
    save_sp_base_location,
    find_nearby_sps,
    update_live_location,
    get_live_location,
    get_directions,
    search_places,
    get_place_details,
    save_pinned_location,
    get_pinned_location,
)

router = APIRouter(prefix="/geo", tags=["Geolocation"])


# ─── AUTH ─────────────────────────────────────────────────────────────────────
# FIX 5: All mutating endpoints now require an X-API-Key header.
# Set INTERNAL_API_KEY in your .env. The frontend must send this header
# on every request that writes or reads sensitive SP data.
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def require_api_key(api_key: str = Security(_api_key_header)):
    expected = os.getenv("INTERNAL_API_KEY")
    if not expected:
        raise HTTPException(status_code=500, detail="Server API key not configured")
    if api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return api_key


# ─── REQUEST MODELS ───────────────────────────────────────────────────────────
class AddressRequest(BaseModel):
    sp_id: str
    address: str

class LiveLocationRequest(BaseModel):
    sp_id: str
    lat: float
    lng: float

class NearbyRequest(BaseModel):
    lat: float
    lng: float
    radius_km: float = 10.0

class DirectionsRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float

class SpBasePinRequest(BaseModel):
    sp_id: str
    lat: float
    lng: float

class PinRequest(BaseModel):
    user_id: str
    lat: float
    lng: float
    label: str | None = None   # The address string already shown on screen.
    # Pass it in to skip a redundant reverse-geocode call.


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@router.post("/save-location", dependencies=[Depends(require_api_key)])
def save_location(request: AddressRequest):
    result = save_sp_location(request.sp_id, request.address)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# Called during SP account setup when they drop a pin on the map.
# Accepts raw coordinates from the pin and resolves the address server-side.
@router.post("/sp-base-location", dependencies=[Depends(require_api_key)])
def sp_base_location(request: SpBasePinRequest):
    result = save_sp_base_location(request.sp_id, request.lat, request.lng)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# Public — customers need to find nearby SPs without logging in
@router.post("/nearby-sps")
def nearby_sps(request: NearbyRequest):
    result = find_nearby_sps(request.lat, request.lng, request.radius_km)
    return {"service_providers": result}


# Only the SP's own app should call this — requires key
@router.post("/update-live-location", dependencies=[Depends(require_api_key)])
def update_location(request: LiveLocationRequest):
    result = update_live_location(request.sp_id, request.lat, request.lng)
    return result


# Public — customers poll this to track their SP
@router.get("/live-location/{sp_id}")
def live_location(sp_id: str):
    result = get_live_location(sp_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/directions")
def directions(request: DirectionsRequest):
    result = get_directions(
        request.origin_lat,
        request.origin_lng,
        request.dest_lat,
        request.dest_lng
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ─── PIN DROP ─────────────────────────────────────────────────────────────────

# Saves the customer's confirmed pickup pin. Called when they tap "Confirm Booking".
# If the frontend passes the label the user already sees on screen, no extra
# reverse-geocode call is made. If omitted, one is made server-side automatically.
@router.post("/save-pin", dependencies=[Depends(require_api_key)])
def save_pin(request: PinRequest):
    result = save_pinned_location(request.user_id, request.lat, request.lng, request.label)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# Returns the last pin saved by a customer — useful for pre-filling the map
# on next app open or showing a "use last location" shortcut.
@router.get("/saved-pin/{user_id}", dependencies=[Depends(require_api_key)])
def saved_pin(user_id: str):
    result = get_pinned_location(user_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/search-places")
def search_places_endpoint(query: str):
    result = search_places(query)
    return {"suggestions": result}


@router.get("/place-details")
def place_details_endpoint(place_id: str):
    result = get_place_details(place_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/config/maps-key")
async def get_maps_key():
    return { "key": os.getenv("GOOGLE_MAPS_API_KEY") }
