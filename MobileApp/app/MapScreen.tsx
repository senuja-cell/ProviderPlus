import React, { useEffect, useState, useRef } from 'react';
import {
    View, StyleSheet, Alert, ActivityIndicator, TextInput,
    TouchableOpacity, Text, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
    findNearbySps,
    getSpLiveLocation,
    searchPlaces,
    getPlaceDetails,
    coordsFromGeoJson,
    PlaceSuggestion,
} from './services/geolocationService';

// How often to refresh the SP marker while tracking
const LIVE_LOCATION_POLL_MS = 10_000;

// ─── TYPES ────────────────────────────────────────────────────────────────────
// UserLocation is a local concern (react-native-maps shape).
// ServiceProvider, GeoJsonPoint, PlaceSuggestion all come from geolocationService.
interface UserLocation { latitude: number; longitude: number; }

export default function MapScreen() {
    const mapRef = useRef<MapView>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState(true);

    // Search & Address States
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState<PlaceSuggestion[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [address, setAddress] = useState<string>("Locating...");

    // Tracking & Routing States
    const [pinnedLocation, setPinnedLocation] = useState<UserLocation | null>(null);
    const [providerLocation, setProviderLocation] = useState<UserLocation | null>(null);
    const [routeCoords, setRouteCoords] = useState<UserLocation[]>([]);
    const [selectedSpId, setSelectedSpId] = useState<string | null>(null);

    // UI Modes
    const [isTracking, setIsTracking] = useState(false);
    const [eta, setEta] = useState<string>("");
    const [distance, setDistance] = useState<string>("");

    // Debounce ref — prevents reverse-geocoding on every pixel of map pan
    const fetchAddressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        getUserLocation();
    }, []);

    // Poll live SP location while tracking. Interval clears when tracking stops.
    useEffect(() => {
        if (!isTracking || !selectedSpId || !pinnedLocation) return;

        const poll = async () => {
            try {
                const point = await getSpLiveLocation(selectedSpId);
                const { latitude, longitude } = coordsFromGeoJson(point);
                setProviderLocation({ latitude, longitude });
                getDrivingRoute(latitude, longitude, pinnedLocation.latitude, pinnedLocation.longitude);
            } catch (e) {
                console.warn('Live location poll failed:', e);
            }
        };

        poll();
        const interval = setInterval(poll, LIVE_LOCATION_POLL_MS);
        return () => clearInterval(interval);
    }, [isTracking, selectedSpId]);

    // ─── DEVICE LOCATION ──────────────────────────────────────────────────────
    const getUserLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Allow location access');
            setLoading(false);
            return;
        }

        try {
            let location: Location.LocationObject;
            try {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Low,
                    mayShowUserSettingsDialog: false,
                });
            } catch {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Lowest,
                    mayShowUserSettingsDialog: false,
                });
            }

            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });
            setPinnedLocation({ latitude, longitude });
            fetchAddress(latitude, longitude);
        } catch (error) {
            console.warn("⚠️ Could not get location:", error);
            setUserLocation({ latitude: 6.9271, longitude: 79.8612 });
            setPinnedLocation({ latitude: 6.9271, longitude: 79.8612 });
            setAddress("Location unavailable");
        } finally {
            setLoading(false);
        }
    };

    // ─── REVERSE GEOCODE (Nominatim) ──────────────────────────────────────────
    // Not in geolocationService — the backend doesn't expose a reverse-geocode
    // endpoint, so this stays as a direct Nominatim call.
    const fetchAddress = async (lat: number, lng: number) => {
        if (isTracking) return;
        setAddress("Fetching address...");
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'User-Agent': 'ProviderPlusApp/1.0' } }
            );
            const text = await response.text();
            if (text.startsWith('<')) { setAddress("Location selected"); return; }
            const data = JSON.parse(text);
            setAddress(data.name || data.address?.road || data.display_name || "Unknown Location");
        } catch {
            setAddress("Location selected");
        }
    };

    // ─── DRIVING ROUTE (OSRM) ─────────────────────────────────────────────────
    // Not in geolocationService — Google Directions (via the backend) returns
    // text steps, not the GeoJSON geometry that Polyline needs. OSRM gives us
    // the polyline coordinates directly, so it stays as a direct call here.
    const getDrivingRoute = async (provLat: number, provLng: number, custLat: number, custLng: number) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${provLng},${provLat};${custLng},${custLat}?overview=full&geometries=geojson`;
            const data = await (await fetch(url)).json();

            if (data.routes?.length > 0) {
                const routeInfo = data.routes[0];

                const formattedCoords = routeInfo.geometry.coordinates.map(
                    (coord: [number, number]) => ({ latitude: coord[1], longitude: coord[0] })
                );
                setRouteCoords(formattedCoords);
                setDistance(`${(routeInfo.distance / 1000).toFixed(1)} km`);
                setEta(`${Math.round(routeInfo.duration / 60)} min`);

                mapRef.current?.fitToCoordinates(formattedCoords, {
                    edgePadding: { top: 150, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    };

    // ─── SEARCH ───────────────────────────────────────────────────────────────
    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 3) { setPredictions([]); return; }
        setSearchLoading(true);
        try {
            const suggestions = await searchPlaces(text);
            setPredictions(suggestions);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Google Places suggestions don't include coordinates — resolve them on selection.
    const handleSelectPlace = async (item: PlaceSuggestion) => {
        setSearchQuery(item.description);
        setPredictions([]);
        try {
            const { lat, lng } = await getPlaceDetails(item.place_id);
            mapRef.current?.animateToRegion(
                { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 },
                1000
            );
        } catch (error) {
            console.error('Place details error:', error);
        }
    };

    // ─── CONFIRM BOOKING ──────────────────────────────────────────────────────
    const handleConfirmLocation = async () => {
        if (!pinnedLocation) return;

        try {
            const sps = await findNearbySps(pinnedLocation.latitude, pinnedLocation.longitude);

            if (sps.length === 0) {
                Alert.alert('No providers available', 'No service providers found near your location.');
                return;
            }

            // Nearest SP is first — $nearSphere sorts by distance ascending
            const nearest = sps[0];

            // Prefer live_location if the SP is already moving, otherwise use registered location
            const { latitude, longitude } = coordsFromGeoJson(nearest.live_location ?? nearest.location);

            setSelectedSpId(nearest.sp_id);
            setProviderLocation({ latitude, longitude });
            setIsTracking(true);
            getDrivingRoute(latitude, longitude, pinnedLocation.latitude, pinnedLocation.longitude);
        } catch (error) {
            console.error('Confirm location error:', error);
            Alert.alert('Error', 'Could not find a service provider. Please try again.');
        }
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0072FF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            {isTracking && (
                <View style={styles.etaBanner}>
                    <Text style={styles.etaTitle}>Provider is on the way!</Text>
                    <View style={styles.etaRow}>
                        <Text style={styles.etaTime}>{eta}</Text>
                        <Text style={styles.etaDistance}>({distance} away)</Text>
                    </View>
                </View>
            )}

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={!isTracking}
                showsMyLocationButton={!isTracking}
                initialRegion={{
                    latitude: userLocation?.latitude ?? 6.9271,
                    longitude: userLocation?.longitude ?? 79.8612,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onRegionChangeComplete={(region: Region) => {
                    if (isTracking) return;
                    if (fetchAddressTimeout.current) clearTimeout(fetchAddressTimeout.current);
                    fetchAddressTimeout.current = setTimeout(() => {
                        setPinnedLocation({ latitude: region.latitude, longitude: region.longitude });
                        fetchAddress(region.latitude, region.longitude);
                    }, 600);
                }}
            >
                {isTracking && pinnedLocation && (
                    <Marker coordinate={pinnedLocation} title="Your Location" pinColor="red" />
                )}
                {isTracking && providerLocation && (
                    <Marker coordinate={providerLocation} title="Service Provider" pinColor="blue" />
                )}
                {isTracking && routeCoords.length > 0 && (
                    <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#0072FF" />
                )}
            </MapView>

            {!isTracking && (
                <View style={styles.centerPinContainer} pointerEvents="none">
                    <Ionicons name="location" size={50} color="#0072FF" />
                    <View style={styles.pinDot} />
                </View>
            )}

            {!isTracking && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search location..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearchQuery(''); setPredictions([]); }}>
                                <Text style={styles.clearBtn}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {searchLoading && <ActivityIndicator size="small" color="#0072FF" style={{ marginTop: 8 }} />}
                    {predictions.length > 0 && (
                        <FlatList
                            style={styles.dropdown}
                            data={predictions}
                            keyExtractor={(item) => item.place_id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.predictionItem}
                                    onPress={() => handleSelectPlace(item)}
                                >
                                    <Text style={styles.predictionIcon}>📍</Text>
                                    <Text style={styles.predictionText} numberOfLines={2}>{item.description}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}

            {!isTracking && (
                <View style={styles.bottomBox}>
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressLabel}>Pickup Location</Text>
                        <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
                    </View>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmLocation}>
                        <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    etaBanner: {
        position: 'absolute', top: 50, left: 20, right: 20, zIndex: 999,
        backgroundColor: 'white', padding: 20, borderRadius: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
        alignItems: 'center'
    },
    etaTitle: { fontSize: 16, color: '#666', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
    etaRow: { flexDirection: 'row', alignItems: 'baseline' },
    etaTime: { fontSize: 32, fontWeight: '900', color: '#0072FF', marginRight: 8 },
    etaDistance: { fontSize: 16, color: '#333', fontWeight: '600' },
    searchContainer: { position: 'absolute', top: 50, left: 15, right: 15, zIndex: 999 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#333' },
    clearBtn: { fontSize: 16, color: '#999', paddingLeft: 8 },
    dropdown: { backgroundColor: 'white', borderRadius: 15, marginTop: 5, maxHeight: 250, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    predictionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    predictionIcon: { fontSize: 16, marginRight: 10 },
    predictionText: { flex: 1, fontSize: 14, color: '#333' },
    centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -25, marginTop: -50, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    pinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'black', marginTop: -5 },
    bottomBox: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'white', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, zIndex: 999 },
    addressContainer: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    addressLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
    addressText: { fontSize: 16, color: '#333', fontWeight: '600' },
    confirmBtn: { backgroundColor: '#0072FF', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    confirmBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
