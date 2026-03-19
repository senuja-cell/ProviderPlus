/**
 * ProviderProfile.tsx
 * COMMIT 1 — Hero card, Stats bar, Rating row
 * Sections: Header, Hero card (avatar/name/category/location/edit),
 *           Stats bar, Rating row
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
  Animated,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderData {
  id: string;
  name: string;
  photoUri?: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  memberSince: string;
  isVerified: boolean;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const COLORS = {
  gradientTop: '#1086b5',
  gradientBot: '#022373',
  card: 'rgba(255,255,255,0.10)',
  cardBorder: 'rgba(255,255,255,0.18)',
  accent: '#1A6BFF',
  accentLight: '#4DA3FF',
  gold: '#FFD700',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  textSub: 'rgba(255,255,255,0.70)',
  divider: 'rgba(255,255,255,0.12)',
  success: '#2ECC71',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROVIDER: ProviderData = {
  id: '1',
  name: 'Nimal Chandra',
  photoUri: undefined,
  category: 'Electrician',
  location: 'Colombo 07, Western Province',
  rating: 4.8,
  reviewCount: 64,
  jobsCompleted: 142,
  memberSince: '2022',
  isVerified: true,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={
          i <= Math.floor(rating)
            ? 'star'
            : i - rating < 1
            ? 'star-half'
            : 'star-outline'
        }
        size={size}
        color={COLORS.gold}
      />
    ))}
  </View>
);

const StatItem: React.FC<{ icon: string; value: string; label: string }> = ({
  icon, value, label,
}) => (
  <View style={styles.statItem}>
    <Ionicons name={icon as any} size={22} color={COLORS.accentLight} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProviderProfile(): React.JSX.Element {
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading]   = useState<boolean>(true);
  const [isSinhala, setIsSinhala] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // TODO: replace with real API call
    const timer = setTimeout(() => {
      setProvider(MOCK_PROVIDER);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.gradientTop, COLORS.gradientBot]} style={styles.gradient}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your profile…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!provider) {
    return (
      <LinearGradient colors={[COLORS.gradientTop, COLORS.gradientBot]} style={styles.gradient}>
        <SafeAreaView style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.loadingText}>Could not load profile.</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.gradientTop, COLORS.gradientBot]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Image
              source={require('../assets/images/provider-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.languageToggle}>
            <Text style={[styles.langLabel, !isSinhala && styles.langLabelActive]}>ENG</Text>
            <Text style={styles.langDivider}>|</Text>
            <Text style={[styles.langLabel, isSinhala && styles.langLabelActive]}>සිං</Text>
            <Switch
              value={isSinhala}
              onValueChange={() => setIsSinhala(v => !v)}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#FF6B35' }}
              thumbColor={isSinhala ? '#fff' : '#f0f0f0'}
              ios_backgroundColor="rgba(255,255,255,0.3)"
              style={styles.switchStyle}
            />
          </View>
        </View>
      </SafeAreaView>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Card ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/ProviderProfiledit')}
              activeOpacity={0.85}
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.avatarWrapper}>
              {provider.photoUri ? (
                <Image source={{ uri: provider.photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color="rgba(255,255,255,0.4)" />
                </View>
              )}
              {provider.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              )}
            </View>

            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>{provider.name}</Text>
              {provider.isVerified && (
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>✓ Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroCategory}>{provider.category}</Text>
            <View style={styles.heroLocationRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.heroLocation}>{provider.location}</Text>
            </View>
            <View style={styles.memberSinceRow}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.memberSinceText}>Member since {provider.memberSince}</Text>
            </View>
          </View>

          {/* ── Stats Bar ── */}
          <View style={styles.statsCard}>
            <StatItem icon="star" value={provider.rating.toFixed(1)} label="Rating" />
            <View style={styles.statDivider} />
            <StatItem icon="hammer-outline" value={`${provider.jobsCompleted}`} label="Jobs Done" />
            <View style={styles.statDivider} />
            <StatItem icon="chatbubble-ellipses-outline" value={`${provider.reviewCount}`} label="Reviews" />
          </View>

          {/* ── Rating Row ── */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingBigNum}>{provider.rating.toFixed(1)}</Text>
            <View style={styles.ratingRightCol}>
              <StarRow rating={provider.rating} size={18} />
              <Text style={styles.ratingSubText}>
                Based on {provider.reviewCount} customer reviews
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: 'rgba(255,255,255,0.70)', fontSize: 15, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBack: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  headerLogo: { width: 80, height: 28 },
  languageToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  langLabel: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13, marginHorizontal: 3 },
  langLabelActive: { color: 'white' },
  langDivider: { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
  switchStyle: { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    padding: 20, alignItems: 'center', marginBottom: 14,
    overflow: 'hidden', position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroCircle2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  editBtn: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1A6BFF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, zIndex: 2,
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  avatarWrapper: { marginBottom: 14, position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#022373', borderRadius: 14, padding: 1,
  },
  heroNameRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4,
  },
  heroName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  verifiedTag: {
    backgroundColor: 'rgba(46,204,113,0.2)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.4)',
  },
  verifiedTagText: { color: '#2ECC71', fontSize: 11, fontWeight: '700' },
  heroCategory: { color: '#4DA3FF', fontSize: 14, fontWeight: '600', letterSpacing: 0.3, marginBottom: 8 },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  heroLocation: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  memberSinceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberSinceText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  statsCard: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 16, marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  ratingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    padding: 16, marginBottom: 20,
  },
  ratingBigNum: { fontSize: 48, fontWeight: '900', color: '#FFD700', lineHeight: 52 },
  ratingRightCol: { gap: 4 },
  ratingSubText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 },
});