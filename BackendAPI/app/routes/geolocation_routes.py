from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.geolocation_service import (
    save_sp_location,
    find_nearby_sps,
    update_live_location,
    get_live_location,
    get_directions,
    search_places,
    get_place_details
)

router = APIRouter(prefix="/geo", tags=["Geolocation"])


# Request models
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


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@router.post("/save-location")
def save_location(request: AddressRequest):
    result = save_sp_location(request.sp_id, request.address)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/nearby-sps")
def nearby_sps(request: NearbyRequest):
    result = find_nearby_sps(request.lat, request.lng, request.radius_km)
    return {"service_providers": result}

@router.post("/update-live-location")
def update_location(request: LiveLocationRequest):
    result = update_live_location(request.sp_id, request.lat, request.lng)
    return result

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
