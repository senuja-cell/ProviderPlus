import os
import googlemaps
from dotenv import load_dotenv
from pymongo import MongoClient, GEOSPHERE

load_dotenv()

# Initialize Google Maps client
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

# Initialize MongoDB
client = MongoClient(os.getenv("MONGO_URL"))
db = client["eventapp"]
sp_collection = db["service_providers"]
pinned_locations_collection = db["pinned_locations"]

# Create 2dsphere indexes at startup — required for $nearSphere queries.
# Both are idempotent; safe to call every time the module loads.
sp_collection.create_index([("location", GEOSPHERE)])
pinned_locations_collection.create_index([("location", GEOSPHERE)])


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


# ─── 3. SAVE SP BASE LOCATION FROM PIN ───────────────────────────────────────
# Called when a provider drops a pin on the map during account setup.
# The frontend sends raw coordinates from the pin; this function reverse-geocodes
# them to get a readable label and saves everything to the SP's document.
def save_sp_base_location(sp_id: str, lat: float, lng: float):
    result = gmaps.reverse_geocode((lat, lng))
    if not result:
        return {"error": "Could not resolve coordinates to an address"}

    formatted_address = result[0].get("formatted_address", "Unknown Location")

    sp_collection.update_one(
        {"sp_id": sp_id},
        {"$set": {
            "location": {
                "type": "Point",
                "coordinates": [lng, lat]   # GeoJSON order: [lng, lat]
            },
            "lat": lat,
            "lng": lng,
            "formatted_address": formatted_address,
        }},
        upsert=True
    )
    return {
        "success": True,
        "sp_id": sp_id,
        "lat": lat,
        "lng": lng,
        "formatted_address": formatted_address,
    }


# ─── 4. FIND NEARBY SPs ────────────────────────────────────────────────────────
def find_nearby_sps(customer_lat: float, customer_lng: float, radius_km: float = 10):
    radius_meters = radius_km * 1000

    # FIX 2: Added projection to only return fields the client needs.
    # Avoids leaking internal MongoDB fields and keeps the payload small.
    projection = {
        "_id": 0,
        "sp_id": 1,
        "formatted_address": 1,
        "location": 1,
        "live_location": 1,
    }

    nearby = sp_collection.find(
        {
            "location": {
                "$nearSphere": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [customer_lng, customer_lat]
                    },
                    "$maxDistance": radius_meters
                }
            }
        },
        projection
    )

    return list(nearby)


# ─── 4. UPDATE LIVE SP LOCATION ───────────────────────────────────────────────
# FIX 3: Standardised live_location to GeoJSON format (was a flat {lat, lng} dict).
# Both location and live_location now use the same {type, coordinates} shape,
# which keeps the data model consistent and ready for future geo-queries.
def update_live_location(sp_id: str, lat: float, lng: float):
    sp_collection.update_one(
        {"sp_id": sp_id},
        {"$set": {
            "live_location": {
                "type": "Point",
                "coordinates": [lng, lat]   # GeoJSON order: [lng, lat]
            }
        }}
    )
    return {"success": True}


# ─── 5. GET SP LIVE LOCATION ──────────────────────────────────────────────────
# Returns GeoJSON Point so the frontend can read coordinates[1] = lat, coordinates[0] = lng
def get_live_location(sp_id: str):
    sp = sp_collection.find_one({"sp_id": sp_id}, {"_id": 0, "live_location": 1})
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
    # FIX 4: `input_text` is the correct keyword argument for places_autocomplete.
    # Passing query as a positional arg was causing a TypeError at runtime.
    result = gmaps.places_autocomplete(
        input_text=query,
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


# ─── 8. SAVE PINNED LOCATION ──────────────────────────────────────────────────
# Called when a customer drops a pin on the map and confirms their pickup location.
# Stores the raw coordinates as GeoJSON plus a human-readable label from reverse
# geocoding. Overwrites any previously saved pin for that user (upsert).
def save_pinned_location(user_id: str, lat: float, lng: float, label: str | None = None):
    # Reverse-geocode to get a readable address if the caller didn't supply a label.
    # This is the address the customer already sees on screen before confirming,
    # so passing it in avoids a redundant Google Maps API call.
    resolved_label = label
    if not resolved_label:
        result = gmaps.reverse_geocode((lat, lng))
        if result:
            resolved_label = result[0].get("formatted_address", "Pinned Location")
        else:
            resolved_label = "Pinned Location"

    pinned_locations_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "location": {
                "type": "Point",
                "coordinates": [lng, lat]   # GeoJSON order: [lng, lat]
            },
            "lat": lat,
            "lng": lng,
            "label": resolved_label,
        }},
        upsert=True
    )
    return {
        "success": True,
        "user_id": user_id,
        "lat": lat,
        "lng": lng,
        "label": resolved_label,
    }


# ─── 9. GET PINNED LOCATION ───────────────────────────────────────────────────
# Returns the last pin the customer saved, including plain lat/lng fields
# so the frontend doesn't have to unpack GeoJSON coordinates.
def get_pinned_location(user_id: str):
    projection = {"_id": 0, "user_id": 1, "lat": 1, "lng": 1, "label": 1}
    doc = pinned_locations_collection.find_one({"user_id": user_id}, projection)
    if not doc:
        return {"error": "No pinned location found"}
    return doc


# ─── 10. GET PLACE DETAILS ────────────────────────────────────────────────────
def get_place_details(place_id: str):
    result = gmaps.place(place_id, fields=["geometry"])
    if not result or "result" not in result:
        return {"error": "Place not found"}
    location = result["result"]["geometry"]["location"]
    return {
        "lat": location["lat"],
        "lng": location["lng"]
    }
