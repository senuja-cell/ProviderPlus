import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    ActivityIndicator, Platform, StatusBar, Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './services/apiClient';

// ── Key used to pass the result back to ProviderSignUp ────────────────────────
export const LOCATION_PICKER_RESULT_KEY = 'location_picker_result';

// ── Default fallback (Colombo, Sri Lanka) ─────────────────────────────────────
const DEFAULT_LAT = 6.9271;
const DEFAULT_LNG = 79.8612;

// ── Build the HTML page that runs inside the WebView ──────────────────────────
const buildMapHtml = (lat: number, lng: number, apiKey: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    #info {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: rgba(255,255,255,0.95);
      padding: 12px 16px;
      font-family: -apple-system, sans-serif;
      font-size: 13px;
      color: #444;
      border-top: 1px solid #ddd;
      z-index: 100;
    }
    #coords { font-size: 11px; color: #888; margin-top: 2px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="info">
    <div id="address">Tap anywhere to set your business location</div>
    <div id="coords"></div>
  </div>

  <script>
    var map, marker, geocoder;
    var currentLat = ${lat};
    var currentLng = ${lng};

    function initMap() {
      geocoder = new google.maps.Geocoder();

      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: currentLat, lng: currentLng },
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });

      // Initial marker at the provider's current location
      marker = new google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Your business location',
      });

      // Reverse geocode the starting position
      reverseGeocode(currentLat, currentLng);

      // Tap on map moves the marker
      map.addListener('click', function(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        moveMarker(lat, lng);
      });

      // Drag end also updates
      marker.addListener('dragend', function() {
        var pos = marker.getPosition();
        moveMarker(pos.lat(), pos.lng());
      });
    }

    function moveMarker(lat, lng) {
      currentLat = lat;
      currentLng = lng;
      marker.setPosition({ lat: lat, lng: lng });
      map.panTo({ lat: lat, lng: lng });
      reverseGeocode(lat, lng);

      // Send live update back to React Native
      sendToRN(lat, lng, document.getElementById('address').innerText);
    }

    function reverseGeocode(lat, lng) {
      document.getElementById('coords').innerText = lat.toFixed(6) + ', ' + lng.toFixed(6);
      geocoder.geocode({ location: { lat: lat, lng: lng } }, function(results, status) {
        var addr = lat.toFixed(6) + ', ' + lng.toFixed(6);
        if (status === 'OK' && results[0]) {
          addr = results[0].formatted_address;
        }
        document.getElementById('address').innerText = addr;
        sendToRN(lat, lng, addr);
      });
    }

    function sendToRN(lat, lng, address) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'LOCATION_UPDATE',
        latitude: lat,
        longitude: lng,
        address: address,
      }));
    }
  </script>

  <script
    src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap"
    async defer>
  </script>
</body>
</html>
`;

// ── Component ─────────────────────────────────────────────────────────────────

const LocationPicker: React.FC = () => {
    const webViewRef = useRef<WebView>(null);

    const [apiKey, setApiKey]           = useState('');
    const [initialLat, setInitialLat]   = useState(DEFAULT_LAT);
    const [initialLng, setInitialLng]   = useState(DEFAULT_LNG);
    const [mapReady, setMapReady]       = useState(false);
    const [locating, setLocating]       = useState(true);

    // Track the currently selected location (updated live from WebView messages)
    const [selected, setSelected] = useState<{
        latitude: number;
        longitude: number;
        address: string;
    } | null>(null);

    // ── On mount: fetch API key from backend + get GPS in parallel ─────────────
    useEffect(() => {
        (async () => {
            // Run both requests at the same time to minimise wait
            const [keyResult, gpsResult] = await Promise.allSettled([

                // 1. Fetch the Maps API key from the backend
                apiClient.get('/geo/config/maps-key').then(res => res.data.key as string),

                // 2. Get device GPS position
                Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
                    if (status !== 'granted') return null;
                    return Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                }),
            ]);


            // Apply the API key
            if (keyResult.status === 'fulfilled' && keyResult.value) {
                setApiKey(keyResult.value);
            } else {
                // Key fetch failed — map won't load but we won't crash silently
                console.error('Could not fetch Maps API key from backend:',
                    keyResult.status === 'rejected' ? keyResult.reason : 'empty key');
            }

            // Apply the GPS position if we got one
            if (gpsResult.status === 'fulfilled' && gpsResult.value) {
                setInitialLat(gpsResult.value.coords.latitude);
                setInitialLng(gpsResult.value.coords.longitude);
            }
            // Either way, stop showing the loading screen
            setLocating(false);
        })();
    }, []);

    // ── Handle messages from the Google Maps JS running inside the WebView ────
    const onMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOCATION_UPDATE') {
                setSelected({
                    latitude:  data.latitude,
                    longitude: data.longitude,
                    address:   data.address,
                });
            }
        } catch {
            // Ignore malformed messages
        }
    };

    // ── Confirm: save to AsyncStorage and go back ─────────────────────────────
    const confirmLocation = async () => {
        if (!selected) {
            Alert.alert('No location selected', 'Tap anywhere on the map to set your business location.');
            return;
        }
        await AsyncStorage.setItem(
            LOCATION_PICKER_RESULT_KEY,
            JSON.stringify(selected)
        );
        router.back();
    };

    // ── Loading screen while GPS resolves ─────────────────────────────────────
    if (locating) {
        return (
            <View style={styles.loadingScreen}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#1A4F9C" />
                <Text style={styles.loadingText}>Finding your location…</Text>
            </View>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Top bar */}
            <SafeAreaView style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Set Business Location</Text>
                <View style={{ width: 40 }} />
            </SafeAreaView>

            {/* Hint banner */}
            <View style={styles.hintBanner}>
                <Ionicons name="information-circle-outline" size={15} color="#1A4F9C" />
                <Text style={styles.hintText}>Tap the map or drag the pin to your business location</Text>
            </View>

            {/* Google Maps inside WebView */}
            {!locating && apiKey ? (
                <WebView
                    ref={webViewRef}
                    style={styles.webview}
                    source={{ html: buildMapHtml(initialLat, initialLng, apiKey) }}
                    onMessage={onMessage}
                    onLoad={() => setMapReady(true)}
                    javaScriptEnabled
                    domStorageEnabled
                    geolocationEnabled
                    scrollEnabled={false}
                    bounces={false}
                    // Needed on Android to allow map touch gestures inside a ScrollView ancestor
                    nestedScrollEnabled={false}
                />
            ) : !locating && !apiKey ? (
                <View style={styles.mapLoadingOverlay}>
                    <Ionicons name="warning-outline" size={32} color="#E65100" />
                    <Text style={[styles.loadingText, { color: '#E65100' }]}>Could not load map.{'\n'}Check your connection and try again.</Text>
                </View>
            ) : null}

            {/* WebView loading spinner */}
            {!mapReady && (
                <View style={styles.mapLoadingOverlay}>
                    <ActivityIndicator size="large" color="#1A4F9C" />
                    <Text style={styles.loadingText}>Loading map…</Text>
                </View>
            )}

            {/* Bottom confirm bar */}
            <View style={styles.bottomBar}>
                {selected ? (
                    <View style={styles.selectedInfo}>
                        <Ionicons name="location" size={18} color="#1A4F9C" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.addressText} numberOfLines={2}>{selected.address}</Text>
                            <Text style={styles.coordsText}>
                                {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noSelectionText}>No location selected yet</Text>
                )}

                <TouchableOpacity
                    style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
                    onPress={confirmLocation}
                    disabled={!selected}
                >
                    <Text style={styles.confirmBtnText}>Confirm Location</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#fff' },
    loadingScreen: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#fff', gap: 16,
    },
    loadingText: { color: '#1A4F9C', fontWeight: '600', fontSize: 15 },

    // Top bar
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#eee',
        zIndex: 10,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center', alignItems: 'center',
    },
    topBarTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

    // Hint
    hintBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#EEF4FF',
        paddingHorizontal: 16, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#D0E0FF',
    },
    hintText: { fontSize: 12, color: '#1A4F9C', flex: 1 },

    // Map
    webview: { flex: 1 },
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center', alignItems: 'center', gap: 12,
        zIndex: 5,
    },

    // Bottom bar
    bottomBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 20, paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1, borderTopColor: '#eee',
        gap: 12,
    },
    selectedInfo: { flexDirection: 'row', alignItems: 'flex-start' },
    addressText:  { fontSize: 14, color: '#1A1A1A', fontWeight: '500', lineHeight: 20 },
    coordsText:   { fontSize: 11, color: '#aaa', marginTop: 2 },
    noSelectionText: { fontSize: 13, color: '#aaa', textAlign: 'center' },

    confirmBtn: {
        backgroundColor: '#1A4F9C', borderRadius: 30, height: 54,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        elevation: 3,
        shadowColor: '#1A4F9C', shadowOpacity: 0.35, shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    confirmBtnDisabled: { backgroundColor: '#aaa', shadowOpacity: 0 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});

export default LocationPicker;
