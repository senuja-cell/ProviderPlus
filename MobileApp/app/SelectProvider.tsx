import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Image,
    TouchableOpacity,
    FlatList,
    Alert,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Platform,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { fetchProvidersByCategory, Provider } from './services/providerService';
import {provider} from "@expo/config-plugins/build/plugins/createBaseMod";

const { width } = Dimensions.get('window');

// 2. CARD COMPONENT
const Card = ({ item }: { item: Provider }) => {
    // Placeholder image generator
    const router = useRouter();

    const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&size=150`;

    return (
        <View style={styles.cardWrapper}>
            <View style={styles.glassCard}>
                <Image source={{ uri: placeholderImage }} style={styles.providerImage} />
                <View style={styles.cardInfo}>
                    {/* Rating Badge */}
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={10} color="#D96C06" />
                        <Text style={styles.ratingText}>{item.rating || "New"}</Text>
                    </View>

                    <Text style={styles.providerName} numberOfLines={1}>{item.name}</Text>
                    {/* Safe check for category name */}
                    <Text style={styles.subCategoryText} numberOfLines={1}>
                        {item.category?.name || "Service Provider"}
                    </Text>

                    <Text style={styles.descriptionText} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <TouchableOpacity
                        style={styles.viewProfileBtn}
                        onPress={() => router.push({
                            pathname: '/ProviderProfile',
                            params: {id: item._id}
                        })}
                    >
                        <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default function ProviderMarketplace() {
    const router = useRouter();

    // Get the params passed from the Home Screen
    const params = useLocalSearchParams();

    // Ensure these are strings, not arrays
    const categorySlug = Array.isArray(params.categorySlug)
        ? params.categorySlug[0]
        : params.categorySlug;
    const categoryName = Array.isArray(params.categoryName)
        ? params.categoryName[0]
        : params.categoryName;

    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const getLocationWithFallback = (): Promise<Location.LocationObject> => {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Location timed out"));
            }, 15000);

            try {
                // Try Low accuracy first (fastest — uses WiFi/cell towers)
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Low,
                    distanceInterval: 0,
                    mayShowUserSettingsDialog: false,
                });
                clearTimeout(timeout);
                resolve(location);
            } catch {
                try {
                    // Fallback to Lowest — basically just cell tower
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Lowest,
                        mayShowUserSettingsDialog: false,
                    });
                    clearTimeout(timeout);
                    resolve(location);
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            }
        });
    };

    const fetchProviders = async () => {

        setLoading(true);
        let lat: number | undefined = undefined;
        let long: number | undefined = undefined;

        try {
            const enabled = await Location.hasServicesEnabledAsync();

            if (enabled) {
                let { status } = await Location.requestForegroundPermissionsAsync();

                if (status === 'granted') {
                    console.log("📡 Fetching location...");

                    try {
                        const location = await getLocationWithFallback();
                        lat = location.coords.latitude;
                        long = location.coords.longitude;
                        console.log(`📍 Got location: ${lat}, ${long}`);

                    } catch (locError) {
                        console.warn("⚠️ GPS failed, trying last known:", locError);

                        // Try last known — will only work if location was fetched before
                        const lastKnown = await Location.getLastKnownPositionAsync({
                            maxAge: 5 * 60 * 1000, // only use if less than 5 mins old
                            requiredAccuracy: 100,  // within 100 meters
                        });

                        if (lastKnown) {
                            lat = lastKnown.coords.latitude;
                            long = lastKnown.coords.longitude;
                            console.log(`📍 Using cached location: ${lat}, ${long}`);
                        } else {
                            console.log("📍 No location available, proceeding without it");
                        }
                    }
                }
            }
        } catch (locationError) {
            console.warn("⚠️ Location error:", locationError);
        }

        // ALWAYS call the API, even if location failed
        try {
            // Validate we have a categorySlug
            if (!categorySlug) {
                throw new Error("No category selected");
            }

            console.log(`📡 4. Calling API with category: "${categorySlug}", location: ${lat ? `${lat}, ${long}` : 'undefined (no location)'}`);
            const data = await fetchProvidersByCategory(String(categorySlug), lat, long);

            console.log(`✅ Success! Loaded ${data.length} providers.`);
            setProviders(data);

        } catch (error: any) {
            console.error("❌ Error fetching providers from API:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Could not connect to the server.";
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Client-side Search Filter
    const filteredProviders = providers.filter(p =>
        p.name.toLowerCase().includes(searchText.toLowerCase())
    );

    useEffect(() => {
        fetchProviders();
    }, []);

    return (

        <LinearGradient
            colors={['#4FC3F7', '#0072FF']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>

                {/* BACK BUTTON */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <FlatList
                    data={filteredProviders}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    ListHeaderComponent={
                        <View style={styles.headerContent}>

                            {/* Search Bar */}
                            <View style={styles.searchRow}>
                                <View style={styles.searchContainer}>
                                    <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
                                    <TextInput
                                        placeholder="Search providers..."
                                        style={styles.searchInput}
                                        placeholderTextColor="rgba(255,255,255,0.8)"
                                        value={searchText}
                                        onChangeText={setSearchText}
                                    />
                                </View>
                            </View>

                            {/* Category Header */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    {categoryName || "Providers"}
                                </Text>
                            </View>

                        </View>
                    }
                    // LOADING STATE
                    ListEmptyComponent={
                        loading ? (
                            <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 50 }} />
                        ) : (
                            <Text style={styles.emptyText}>No providers found in this category.</Text>
                        )
                    }
                    renderItem={({ item }) => <Card item={item} />}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 50,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
        padding: 8
    },
    scrollContent: { paddingBottom: 40 },
    headerContent: { paddingHorizontal: 20, marginBottom: 10, marginTop: 60 },

    // Search
    searchRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#FFFFFF' },

    // Header
    sectionHeader: { alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 26, fontWeight: 'bold', color: 'white' },
    emptyText: { textAlign: 'center', color: 'white', marginTop: 20, fontSize: 16 },

    // CARD STYLES
    cardWrapper: { width: '100%', alignItems: 'center', marginBottom: 15 },
    glassCard: {
        width: width * 0.9,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 22,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    providerImage: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#eee',
    },
    cardInfo: { flex: 1, marginLeft: 15 },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#eee'
    },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: '#D96C06', marginLeft: 3 },
    providerName: { fontSize: 16, fontWeight: '700', color: '#333' },
    subCategoryText: { fontSize: 12, color: '#666', marginBottom: 4 },
    descriptionText: { fontSize: 12, color: '#888', marginBottom: 8 },

    viewProfileBtn: {
        backgroundColor: '#0072FF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-end',
    },
    viewProfileText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
});
