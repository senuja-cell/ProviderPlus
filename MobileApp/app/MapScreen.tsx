import React, { useEffect, useState, useRef } from 'react';
import {
    View, StyleSheet, Alert, ActivityIndicator, TextInput,
    TouchableOpacity, Text, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = 'http://192.168.8.168';

interface UserLocation { latitude: number; longitude: number; }
interface Prediction { place_id: string; description: string; }

export default function MapScreen() {
    const mapRef = useRef<MapView>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState(true);

    // Search & Address States
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [address, setAddress] = useState<string>("Locating...");

    // Tracking & Routing States
    const [pinnedLocation, setPinnedLocation] = useState<UserLocation | null>(null);
    const [providerLocation, setProviderLocation] = useState<UserLocation | null>(null);
    const [routeCoords, setRouteCoords] = useState<UserLocation[]>([]);

    // UI Modes
    const [isTracking, setIsTracking] = useState(false); // Switches between Pinning and Tracking
    const [eta, setEta] = useState<string>("");
    const [distance, setDistance] = useState<string>("");

    useEffect(() => {
        getUserLocation();
    }, []);

    const getUserLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Allow location access');
            setLoading(false);
            return;
        }

        try {
            // Try Low accuracy first (fastest — WiFi/cell towers, avoids new arch hang)
            let location: Location.LocationObject;
            try {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Low,
                    mayShowUserSettingsDialog: false,
                });
            } catch {
                // Fallback to Lowest if Low fails
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
            // Fall back to default coordinates (Colombo) if location completely fails
            setUserLocation({ latitude: 6.9271, longitude: 79.8612 });
            setPinnedLocation({ latitude: 6.9271, longitude: 79.8612 });
            setAddress("Location unavailable");
        } finally {
            setLoading(false);
        }
    };

    const fetchAddress = async (lat: number, lng: number) => {
        if (isTracking) return; // Don't fetch address if we are already tracking
        setAddress("Fetching address...");
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'User-Agent': 'ProviderPlusApp/1.0' } }
            );
            const text = await response.text();
            if (text.startsWith('<')) {
                setAddress("Location selected");
                return;
            }
            const data = JSON.parse(text);
            const shortAddress = data.name || data.address?.road || data.display_name || "Unknown Location";
            setAddress(shortAddress);
        } catch (error) {
            setAddress("Location selected");
        }
    };

    // Fetches Route, ETA, and Distance using OSRM (Free)
    const getDrivingRoute = async (provLat: number, provLng: number, custLat: number, custLng: number) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${provLng},${provLat};${custLng},${custLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const routeInfo = data.routes[0];

                // 1. Get Coordinates for the Polyline
                const coords = routeInfo.geometry.coordinates;
                const formattedCoords = coords.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
                setRouteCoords(formattedCoords);

                // 2. Get Distance (convert meters to km)
                const distKm = (routeInfo.distance / 1000).toFixed(1);
                setDistance(`${distKm} km`);

                // 3. Get ETA (convert seconds to minutes)
                const timeMins = Math.round(routeInfo.duration / 60);
                setEta(`${timeMins} min`);

                // 4. Zoom map to fit both provider and customer
                mapRef.current?.fitToCoordinates(formattedCoords, {
                    edgePadding: { top: 150, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 3) { setPredictions([]); return; }
        setSearchLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text + ", Sri Lanka")}&format=json&limit=5&countrycodes=lk`,
                { headers: { 'User-Agent': 'ProviderPlusApp/1.0' } }
            );
            const data = await response.json();
            const mappedSuggestions = data.map((item: any) => ({
                place_id: item.place_id.toString(),
                description: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            }));
            setPredictions(mappedSuggestions);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectPlace = (placeId: string, description: string, lat: number, lng: number) => {
        setSearchQuery(description);
        setPredictions([]);
        mapRef.current?.animateToRegion({
            latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05,
        }, 1000);
    };

    const handleConfirmLocation = () => {
        if (pinnedLocation) {
            setIsTracking(true); // Switch UI to Tracking Mode

            // SIMULATION: Create a fake provider 3km away to show your group
            const fakeProviderLat = pinnedLocation.latitude + 0.025;
            const fakeProviderLng = pinnedLocation.longitude + 0.025;
            setProviderLocation({ latitude: fakeProviderLat, longitude: fakeProviderLng });

            // Fetch the route line, distance, and ETA
            getDrivingRoute(fakeProviderLat, fakeProviderLng, pinnedLocation.latitude, pinnedLocation.longitude);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0072FF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            {/* UBER-STYLE ETA BANNER (Only shows when tracking) */}
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
                    if (!isTracking) {
                        setPinnedLocation({ latitude: region.latitude, longitude: region.longitude });
                        fetchAddress(region.latitude, region.longitude);
                    }
                }}
            >
                {/* 1. Customer Marker (Only shows AFTER confirming location) */}
                {isTracking && pinnedLocation && (
                    <Marker coordinate={pinnedLocation} title="Your Location" pinColor="red" />
                )}

                {/* 2. Provider Marker */}
                {isTracking && providerLocation && (
                    <Marker coordinate={providerLocation} title="Service Provider" pinColor="blue" />
                )}

                {/* 3. The Route Line */}
                {isTracking && routeCoords.length > 0 && (
                    <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#0072FF" />
                )}
            </MapView>

            {/* CENTER PIN (Only shows BEFORE confirming location) */}
            {!isTracking && (
                <View style={styles.centerPinContainer} pointerEvents="none">
                    <Ionicons name="location" size={50} color="#0072FF" />
                    <View style={styles.pinDot} />
                </View>
            )}

            {/* SEARCH BAR (Only shows BEFORE confirming location) */}
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
                                    onPress={() => handleSelectPlace(item.place_id, item.description, (item as any).lat, (item as any).lng)}
                                >
                                    <Text style={styles.predictionIcon}>📍</Text>
                                    <Text style={styles.predictionText} numberOfLines={2}>{item.description}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}

            {/* CONFIRM BUTTON (Only shows BEFORE confirming location) */}
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

    // Tracking UI Styles
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

    // Existing Styles
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
