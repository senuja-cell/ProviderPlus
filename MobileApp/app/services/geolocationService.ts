import apiClient from './apiClient';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface GeoJsonPoint {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat] — GeoJSON order
}

export interface ServiceProvider {
    sp_id: string;
    formatted_address: string;
    location: GeoJsonPoint;
    live_location?: GeoJsonPoint;
}

export interface LocationCoords {
    lat: number;
    lng: number;
    formatted_address?: string;
}

export interface DirectionsResult {
    distance: string;   // e.g. "3.2 km"
    duration: string;   // e.g. "8 mins"
    steps: object[];
}

export interface PlaceSuggestion {
    place_id: string;
    description: string;
}

// ─── INTERNAL HELPERS ─────────────────────────────────────────────────────────

// The X-API-Key header is required by the backend on mutating endpoints.
// It is separate from the user Bearer token — it identifies the app itself,
// not the logged-in user.
const GEO_API_KEY = process.env.EXPO_PUBLIC_INTERNAL_API_KEY ?? '';

const protectedHeaders = {
    'X-API-Key': GEO_API_KEY,
};

// Convenience: extract a plain {latitude, longitude} from a GeoJSON Point
// so callers don't have to remember that GeoJSON is [lng, lat].
export function coordsFromGeoJson(point: GeoJsonPoint) {
    return {
        latitude: point.coordinates[1],
        longitude: point.coordinates[0],
    };
}

// ─── 1. SAVE SP LOCATION (protected) ─────────────────────────────────────────
// Called from the SP side of the app when they register or update their address.
export async function saveSpLocation(spId: string, address: string): Promise<LocationCoords> {
    const { data } = await apiClient.post(
        '/geo/save-location',
        { sp_id: spId, address },
        { headers: protectedHeaders }
    );
    return data.location as LocationCoords;
}

// ─── 2. FIND NEARBY SERVICE PROVIDERS ────────────────────────────────────────
// Called from the customer side after they confirm their pickup location.
export async function findNearbySps(
    lat: number,
    lng: number,
    radiusKm: number = 10
): Promise<ServiceProvider[]> {
    const { data } = await apiClient.post('/geo/nearby-sps', {
        lat,
        lng,
        radius_km: radiusKm,
    });
    return data.service_providers as ServiceProvider[];
}

// ─── 3. UPDATE SP LIVE LOCATION (protected) ──────────────────────────────────
// Called from the SP side periodically (e.g. every 10s) while they are on a job.
export async function updateSpLiveLocation(
    spId: string,
    lat: number,
    lng: number
): Promise<void> {
    await apiClient.post(
        '/geo/update-live-location',
        { sp_id: spId, lat, lng },
        { headers: protectedHeaders }
    );
}

// ─── 4. GET SP LIVE LOCATION ─────────────────────────────────────────────────
// Called from the customer side while tracking. Returns a GeoJSON Point.
// Use coordsFromGeoJson() to get {latitude, longitude} for react-native-maps.
export async function getSpLiveLocation(spId: string): Promise<GeoJsonPoint> {
    const { data } = await apiClient.get(`/geo/live-location/${spId}`);
    return data as GeoJsonPoint;
}

// ─── 5. GET DIRECTIONS ────────────────────────────────────────────────────────
// Returns human-readable distance/duration + step-by-step directions.
// Note: for drawing the polyline on the map the frontend uses OSRM directly
// (see getDrivingRoute in MapScreen.tsx) since Google's directions response
// does not include GeoJSON geometry in the same shape that Polyline expects.
export async function getDirections(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
): Promise<DirectionsResult> {
    const { data } = await apiClient.post('/geo/directions', {
        origin_lat: originLat,
        origin_lng: originLng,
        dest_lat: destLat,
        dest_lng: destLng,
    });
    return data as DirectionsResult;
}

// ─── 6. SEARCH PLACES (autocomplete) ─────────────────────────────────────────
// Calls the backend's Google Places autocomplete, filtered to Sri Lanka.
// Returns a list of suggestions with place_id and human-readable description.
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    const { data } = await apiClient.get('/geo/search-places', {
        params: { query },
    });
    return data.suggestions as PlaceSuggestion[];
}

// ─── 7. GET PLACE DETAILS ─────────────────────────────────────────────────────
// Resolves a Google place_id to {lat, lng}.
// Use after the user selects a suggestion from searchPlaces().
export async function getPlaceDetails(placeId: string): Promise<{ lat: number; lng: number }> {
    const { data } = await apiClient.get('/geo/place-details', {
        params: { place_id: placeId },
    });
    return data as { lat: number; lng: number };
}
