import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Animated,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRoleBack } from '../hooks/useBackNavigation';
import { getMyProfile, ProviderData } from '../services/providerProfileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  danger: '#FF4D4F',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** GeoJSON [lng, lat] → human-readable string */
function formatLocation(
    location: { type: string; coordinates: [number, number] } | null
): string {
  if (!location?.coordinates) return 'Location not set';
  const [lng, lat] = location.coordinates;
  return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
}

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

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProviderProfile(): React.JSX.Element {
  useRoleBack();
  const [provider, setProvider]                 = useState<ProviderData | null>(null);
  const [loading, setLoading]                   = useState<boolean>(true);
  const [error, setError]                       = useState<string | null>(null);
  const [showAllPortfolio, setShowAllPortfolio] = useState<boolean>(false);
  const [isSinhala, setIsSinhala]               = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Fetch real provider profile ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        setProvider(data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? 'Could not load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────────
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

  if (error || !provider) {
    return (
        <LinearGradient colors={[COLORS.gradientTop, COLORS.gradientBot]} style={styles.gradient}>
          <SafeAreaView style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.loadingText}>{error ?? 'Could not load profile.'}</Text>
            <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => { setLoading(true); setError(null); }}
            >
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
    );
  }

  // ─── Derived display values ────────────────────────────────────────────────
  const portfolioImages = provider.portfolio_images ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
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
            {/* Left: back + logo */}
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.push('/ProviderDash')} style={styles.headerBack}>
                <Ionicons name="chevron-back" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Image
                  source={require('../../assets/images/provider-logo.png')}
                  style={styles.headerLogo}
                  resizeMode="contain"
              />
            </View>

            <Text style={styles.headerTitle}>My Profile</Text>

            {/* Right: language toggle */}
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

              {/* Edit button */}
              <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push('../ProviderProfileEdit')}
                  activeOpacity={0.85}
              >
                <Feather name="edit-2" size={14} color="#fff" />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>

              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                {provider.profile_image ? (
                    <Image source={provider.profile_image ? { uri: provider.profile_image } : require('../../assets/images/account.png')}/>
                ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={44} color="rgba(255,255,255,0.4)" />
                    </View>
                )}
                {provider.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    </View>
                )}
              </View>

              {/* Name + verified */}
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{provider.name}</Text>
                {provider.is_verified && (
                    <View style={styles.verifiedTag}>
                      <Text style={styles.verifiedTagText}>✓ Verified</Text>
                    </View>
                )}
              </View>

              {/* Category */}
              <Text style={styles.heroCategory}>{provider.category.name}</Text>

              {/* Location */}
              <View style={styles.heroLocationRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.heroLocation}>{formatLocation(provider.location)}</Text>
              </View>

              {/* Member since */}
              {provider.member_since && (
                  <View style={styles.memberSinceRow}>
                    <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.memberSinceText}>Member since {provider.member_since}</Text>
                  </View>
              )}
            </View>

            {/* ── Stats Bar ── */}
            <View style={styles.statsCard}>
              {/* Rating — kept from DB as-is */}
              <StatItem
                  icon="star"
                  value={provider.rating > 0 ? provider.rating.toFixed(1) : '—'}
                  label="Rating"
              />
              <View style={styles.statDivider} />
              {/* Completed jobs — real count from backend */}
              <StatItem
                  icon="hammer-outline"
                  value={`${provider.completed_jobs}`}
                  label="Jobs Done"
              />
              <View style={styles.statDivider} />
              {/* Reviews — placeholder until review system is built */}
              <StatItem
                  icon="chatbubble-ellipses-outline"
                  value="—"
                  label="Reviews"
              />
            </View>

            {/* ── Rating Row — kept from DB, reviews section deferred ── */}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingBigNum}>
                {provider.rating > 0 ? provider.rating.toFixed(1) : '—'}
              </Text>
              <View style={styles.ratingRightCol}>
                {provider.rating > 0 ? (
                    <StarRow rating={provider.rating} size={18} />
                ) : (
                    <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>No rating yet</Text>
                )}
                <Text style={styles.ratingSubText}>
                  Reviews coming soon
                </Text>
              </View>
            </View>

            {/* ── Skills ── */}
            <SectionHeader title="Skills" />
            <View style={styles.skillsCard}>
              {provider.tags.length > 0 ? (
                  provider.tags.map((skill) => (
                      <View key={skill} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                      </View>
                  ))
              ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No skills added yet</Text>
                    <Text style={styles.emptySubText}>Edit your profile to add skills</Text>
                  </View>
              )}
            </View>

            {/* ── Work Portfolio ── */}
            <SectionHeader title="Work Portfolio" />
            {portfolioImages.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.portfolioScroll}
                >
                  {(showAllPortfolio ? portfolioImages : portfolioImages.slice(0, 3)).map((uri, index) => (
                      <View key={uri} style={styles.portfolioCard}>
                        <Image
                            source={{ uri }}
                            style={styles.portfolioImage}
                            resizeMode="cover"
                        />
                        <View style={styles.portfolioInfo}>
                          <Text style={styles.portfolioName} numberOfLines={1}>
                            Portfolio Image {index + 1}
                          </Text>
                        </View>
                      </View>
                  ))}

                  {portfolioImages.length > 3 && (
                      <TouchableOpacity
                          style={styles.portfolioViewAllCard}
                          onPress={() => setShowAllPortfolio(v => !v)}
                          activeOpacity={0.8}
                      >
                        <Ionicons
                            name={showAllPortfolio ? 'chevron-back-circle-outline' : 'grid-outline'}
                            size={30}
                            color={COLORS.accentLight}
                        />
                        <Text style={styles.portfolioViewAllText}>
                          {showAllPortfolio ? 'Show\nLess' : 'View\nAll'}
                        </Text>
                        {!showAllPortfolio && (
                            <Text style={styles.portfolioViewAllCount}>
                              {portfolioImages.length} photos
                            </Text>
                        )}
                      </TouchableOpacity>
                  )}
                </ScrollView>
            ) : (
                <TouchableOpacity
                    style={styles.emptyPortfolioBtn}
                    onPress={() => router.push('../ProviderProfileEdit')}
                >
                  <Feather name="plus-circle" size={22} color={COLORS.accentLight} />
                  <Text style={styles.emptyPortfolioBtnText}>Add your first work photo</Text>
                </TouchableOpacity>
            )}

            {/* ── Reviews — deferred until review system is built ── */}
            <SectionHeader title="Reviews Received" />
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubble-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubText}>
                Reviews will appear here once customers rate your work
              </Text>
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

  // Loading / error
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingText: { color: COLORS.textSub, fontSize: 15, fontWeight: '600' },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  retryBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBack: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  headerTitle: {
    color: COLORS.text, fontSize: 17,
    fontWeight: '700', letterSpacing: 0.3,
  },
  headerLogo: { width: 80, height: 28 },
  languageToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  langLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700', fontSize: 13, marginHorizontal: 3,
  },
  langLabelActive: { color: 'white' },
  langDivider: { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
  switchStyle: { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
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

  // Edit button
  editBtn: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    zIndex: 2,
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Avatar
  avatarWrapper: { marginBottom: 14, position: 'relative' },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 2, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.gradientBot,
    borderRadius: 14, padding: 1,
  },

  // Hero info
  heroNameRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4,
  },
  heroName: {
    color: COLORS.text, fontSize: 22,
    fontWeight: '800', letterSpacing: 0.3,
  },
  verifiedTag: {
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.4)',
  },
  verifiedTagText: { color: '#2ECC71', fontSize: 11, fontWeight: '700' },
  heroCategory: {
    color: COLORS.accentLight, fontSize: 14,
    fontWeight: '600', letterSpacing: 0.3, marginBottom: 8,
  },
  heroLocationRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, marginBottom: 4,
  },
  heroLocation: { color: COLORS.textMuted, fontSize: 13 },
  memberSinceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberSinceText: { color: COLORS.textMuted, fontSize: 12 },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 16,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: COLORS.divider, marginVertical: 4 },

  // Rating row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  ratingBigNum: {
    fontSize: 48, fontWeight: '900',
    color: COLORS.gold, lineHeight: 52,
  },
  ratingRightCol: { gap: 4 },
  ratingSubText: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },

  // Section header with lines
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 16, gap: 10,
  },
  sectionLine: {
    flex: 1, height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionTitle: {
    color: COLORS.text, fontSize: 14,
    fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Skills
  skillsCard: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    marginBottom: 4,
  },
  skillChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  skillChipText: { color: COLORS.textSub, fontSize: 13, fontWeight: '500' },

  // Portfolio
  portfolioScroll: { gap: 12, paddingRight: 4 },
  portfolioCard: {
    width: SCREEN_WIDTH * 0.65,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  portfolioImage: { width: '100%', height: 130 },
  portfolioInfo: { padding: 12 },
  portfolioName: {
    color: COLORS.text, fontSize: 14,
    fontWeight: '700', marginBottom: 4,
  },
  portfolioViewAllCard: {
    width: SCREEN_WIDTH * 0.38,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  portfolioViewAllText: {
    color: COLORS.accentLight,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  portfolioViewAllCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyPortfolioBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 14, borderWidth: 1,
    borderColor: COLORS.accentLight,
    paddingVertical: 16,
  },
  emptyPortfolioBtnText: {
    color: COLORS.accentLight, fontSize: 14, fontWeight: '700',
  },

  // Empty states
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  emptyText: { color: COLORS.textSub, fontSize: 14, fontWeight: '600' },
  emptySubText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
});
