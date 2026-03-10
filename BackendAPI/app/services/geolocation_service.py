import os
import googlemaps
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# Initialize Google Maps client
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

# Initialize MongoDB
client = MongoClient(os.getenv("MONGO_URL"))
db = client["eventapp"]
sp_collection = db["service_providers"]


# ─── 1. GEOCODE AN ADDRESS ─────────────────────────────────────────────────────
def geocode_address(address: str):
    result = gmaps.geocode(address)
    if not result:
        return None
    location = result[0]["geometry"]["location"]
    return {
        "lat": location["lat"],
        "lng": location["lng"],
        "formatted_address": result[0]["formatted_address"]
    }


# ─── 2. SAVE SP LOCATION TO MONGODB ───────────────────────────────────────────
def save_sp_location(sp_id: str, address: str):
    coords = geocode_address(address)
    if not coords:
        return {"error": "Address not found"}

    sp_collection.update_one(
        {"sp_id": sp_id},
        {"$set": {
            "location": {
                "type": "Point",
                "coordinates": [coords["lng"], coords["lat"]]
            },
            "formatted_address": coords["formatted_address"]
        }},
        upsert=True
    )
    return {"success": True, "location": coords}


# ─── 3. FIND NEARBY SPs ────────────────────────────────────────────────────────
def find_nearby_sps(customer_lat: float, customer_lng: float, radius_km: float = 10):
    radius_meters = radius_km * 1000

    nearby = sp_collection.find({
        "location": {
            "$nearSphere": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [customer_lng, customer_lat]
                },
                "$maxDistance": radius_meters
            }
        }
    })

    results = []
    for sp in nearby:
        sp["_id"] = str(sp["_id"])
        results.append(sp)

    return results


# ─── 4. UPDATE LIVE SP LOCATION ───────────────────────────────────────────────
def update_live_location(sp_id: str, lat: float, lng: float):
    sp_collection.update_one(
        {"sp_id": sp_id},
        {"$set": {
            "live_location": {
                "lat": lat,
                "lng": lng
            }
        }}
    )
    return {"success": True}


# ─── 5. GET SP LIVE LOCATION ──────────────────────────────────────────────────
def get_live_location(sp_id: str):
    sp = sp_collection.find_one({"sp_id": sp_id})
    if not sp or "live_location" not in sp:
        return {"error": "Location not available"}
    return sp["live_location"]


# ─── 6. GET DIRECTIONS TO SP ──────────────────────────────────────────────────
def get_directions(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float):
    directions = gmaps.directions(
        origin=(origin_lat, origin_lng),
        destination=(dest_lat, dest_lng),
        mode="driving"
    )
    if not directions:
        return {"error": "No route found"}

    leg = directions[0]["legs"][0]
    return {
        "distance": leg["distance"]["text"],
        "duration": leg["duration"]["text"],
        "steps": leg["steps"]
    }


# ─── 7. SEARCH PLACES ─────────────────────────────────────────────────────────
def search_places(query: str):
    result = gmaps.places_autocomplete(
        query,
        components={"country": "lk"}
    )
    suggestions = [
        {
            "place_id": place["place_id"],
            "description": place["description"]
        }
        for place in result
    ]
    return suggestions


# ─── 8. GET PLACE DETAILS ─────────────────────────────────────────────────────
def get_place_details(place_id: str):
    result = gmaps.place(place_id, fields=["geometry"])
    if not result or "result" not in result:
        return {"error": "Place not found"}
    location = result["result"]["geometry"]["location"]
    return {
        "lat": location["lat"],
        "lng": location["lng"]
    }