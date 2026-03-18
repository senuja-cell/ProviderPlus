import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { fetchAllCategories } from '../services/categoryService';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [isAiMode, setIsAiMode] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['12%', '75%'], []);
  const animatedIndex = useSharedValue(0);

  const [isSinhala, setIsSinhala] = useState(false);
  const toggleLanguage = () => setIsSinhala(prev => !prev);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("Fetching categories for Home Screen...");
        const data = await fetchAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories on Home Screen.");
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  useAnimatedReaction(
      () => animatedIndex.value,
      (currentValue) => {
        if (currentValue > 0.3) {
          runOnJS(setSheetExpanded)(true);
        } else {
          runOnJS(setSheetExpanded)(false);
        }
      },
      []
  );

  const logoAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animatedIndex.value, [0.2, 1], [0, -120], Extrapolation.CLAMP);
    const translateX = interpolate(animatedIndex.value, [0.2, 1], [0, -width / 2 + 60], Extrapolation.CLAMP);
    const scale = interpolate(animatedIndex.value, [0.2, 1], [1, 0.35], Extrapolation.CLAMP);
    return { transform: [{ translateY }, { translateX }, { scale }] };
  });

  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animatedIndex.value, [0.2, 1], [0, -120], Extrapolation.CLAMP);
    const widthAnim = interpolate(animatedIndex.value, [0.2, 1], [width * 0.9, width * 0.95], Extrapolation.CLAMP);
    return { width: widthAnim, transform: [{ translateY }] };
  });

  const fadeOutStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animatedIndex.value, [0.2, 0.6], [1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LinearGradient colors={['#00C6FF', '#0072FF']} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>

            {/* --- TOP BAR --- */}
            <View style={styles.topBar}>
              <View style={{ width: 50 }} />
              <View style={styles.topBarRight}>

              <View style={styles.languageToggle}>
              <Text style={[styles.langLabel, !isSinhala && styles.langLabelActive]}>ENG</Text>
              <Text style={styles.langDivider}>|</Text>
              <Text style={[styles.langLabel, isSinhala && styles.langLabelActive]}>සිං</Text>
              <Switch
                value={isSinhala}
                onValueChange={toggleLanguage}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#FF6B35' }}
                thumbColor={isSinhala ? '#fff' : '#f0f0f0'}
                ios_backgroundColor="rgba(255,255,255,0.3)"
                style={styles.switchStyle}
              />
            </View>
              <TouchableOpacity
                style={styles.bellButton}
                onPress={() => router.push('/Alerts')}
              >
                <Text style={styles.bellIcon}>🔔</Text>
                {hasUnreadAlerts && <View style={styles.redDot}/>}
              </TouchableOpacity>
            </View>
            </View>


            {/* --- MAIN CONTENT AREA --- */}
            <View style={styles.contentContainer}>
              <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
                <Image
                    source={require('../../assets/images/provider-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
              </Animated.View>

              <Animated.View style={[styles.searchWrapper, searchBarAnimatedStyle]}>
                <View style={styles.searchBar}>
                  <TextInput
                      placeholder={'Who Are You Looking For?'}
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      style={styles.searchInput}
                  />
                  <Text style={{ color: 'white', fontSize: 18 }}>🔎</Text>
                </View>
              </Animated.View>

              <Animated.View
                  style={[styles.toggleWrapper, fadeOutStyle]}
                  pointerEvents={sheetExpanded ? 'none' : 'auto'}
              >
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                      style={[styles.toggleBtn, !isAiMode && styles.activeWhiteBtn]}
                      onPress={() => setIsAiMode(false)}
                  >
                    <Text style={[styles.toggleText, !isAiMode && styles.activeBlueText]}>
                      {'SEARCH YOURSELF'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                      style={[styles.toggleBtn, isAiMode && styles.activeOrangeBtn]}
                      onPress={() => router.push('/AiPage')}
                  >
                    <Text style={[styles.toggleText, isAiMode && styles.activeWhiteText]}>
                      {'LET US PLAN'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>

            {/* --- SWIPE INDICATORS --- */}
            <Animated.View
                style={[styles.swipeIndicator, fadeOutStyle]}
                pointerEvents={sheetExpanded ? 'none' : 'auto'}
            >
              <Text style={styles.arrowText}>^</Text>
              <Text style={styles.swipeText}>{'SWIPE UP FOR CATEGORIES'}</Text>
            </Animated.View>

            {/* --- BOTTOM SHEET --- */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                animatedIndex={animatedIndex}
                handleIndicatorStyle={{ backgroundColor: 'rgba(0,0,0,0.2)', width: 40 }}
                backgroundStyle={{ backgroundColor: '#F0F8FF' }}
                enableOverDrag={false}
                enablePanDownToClose={false}
                maxDynamicContentSize={height * 0.55}
            >
              <BottomSheetScrollView
                  contentContainerStyle={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sheetTitle}>{'SERVICE PROVIDER CATEGORIES'}</Text>

                {loadingCategories ? (
                    <ActivityIndicator size="large" color="#0072FF" style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.grid}>
                      {categories.map((cat) => (
                          <TouchableOpacity
                              key={cat._id}
                              style={styles.card}
                              activeOpacity={0.7}
                              onPress={() => {
                                router.push({
                                  pathname: '/SelectProvider',
                                  params: {
                                    categorySlug: cat.slug,
                                    categoryName: cat.name
                                  }
                                });
                              }}
                          >
                            <Text style={{ fontSize: 32 }}>{cat.icon}</Text>
                            <Text style={styles.cardText}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                      ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
              </BottomSheetScrollView>
            </BottomSheet>

          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 20,
  },
  contentContainer: { alignItems: 'center', marginTop: 60, zIndex: 10 },
  logoWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  langLabelActive: {
    color: '#fff',
  },
  langDivider: {
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
    fontSize: 12,
  },
  switchStyle: {
    marginLeft: 6,
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  redDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FF3B30',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.15)',
    },
  logoImage: { width: '100%', height: '100%' },
  searchWrapper: { marginTop: 30 },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    width: '100%',
  },
  searchInput: { flex: 1, color: 'white', fontSize: 16, fontWeight: '600', marginRight: 10 },
  toggleWrapper: { marginTop: 40 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 30,
    width: width * 0.75,
    padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 25, alignItems: 'center' },
  activeWhiteBtn: { backgroundColor: 'white' },
  activeOrangeBtn: { backgroundColor: '#E37322' },
  toggleText: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 12 },
  activeBlueText: { color: '#0072FF' },
  activeWhiteText: { color: 'white' },
  swipeIndicator: { position: 'absolute', bottom: '16%', width: '100%', alignItems: 'center' },
  arrowText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  swipeText: { color: 'white', fontWeight: '700', letterSpacing: 1 },
  sheetContent: { padding: 20, alignItems: 'center' },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0072FF',
    marginBottom: 20,
    marginTop: 10
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  card: {
    width: '46%',
    backgroundColor: '#89CFF0',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  cardText: { marginTop: 10, fontWeight: '600', color: '#333', textAlign: 'center' }
});