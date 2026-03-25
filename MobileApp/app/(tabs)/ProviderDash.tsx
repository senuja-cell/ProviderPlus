import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Switch,
  Image,
  StatusBar,
  RefreshControl,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DashboardData,
  DEFAULT_DASHBOARD_DATA,
  fetchAIOverview,
  fetchDashboardData,
} from '../services/dashboardService';
import { useLanguage } from '../context/LanguageContext';
import apiClient from "@/app/services/apiClient";
import { useProviderLocationSender } from "@/app/hooks/useProviderLocationSender";
import { useBlockBack } from '../hooks/useBlockBack';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { getMyProfile, ProviderData } from '../services/providerProfileService';
import { fetchProviderBookings } from '../services/ordersService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────

interface ExpandableCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  expandedContent?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

interface AIOverviewCardProps {
  overview: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  t: (text: string) => string;
}

interface RouteParams {
  params?: {
    providerName?: string;
    providerId?: string;
    jobRole?: string;
  };
}

interface ProviderDashboardProps {
  navigation?: any;
  route?: RouteParams;
}

// ─── Greeting Logic ───────────────────────────────────────────

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 20) return 'Good Evening';
  return 'Good Night';
};

const getGreetingEmoji = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 17) return '🌤️';
  if (hour >= 17 && hour < 20) return '🌅';
  return '🌙';
};

// ─── Popup Modal Component ────────────────────────────────────

interface CardModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  children: React.ReactNode;
}

const CardModal: React.FC<CardModalProps> = ({ visible, onClose, title, icon, children }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
      <View style={modalStyles.overlay}>
        <BlurView
            intensity={40}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[modalStyles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <LinearGradient colors={['#1086b5', '#022373']} style={modalStyles.cardGradient}>
            <View style={modalStyles.cardHeader}>
              <Text style={modalStyles.cardIcon}>{icon}</Text>
              <Text style={modalStyles.cardTitle}>{title}</Text>
              <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={modalStyles.divider} />
            {children}
          </LinearGradient>
        </Animated.View>
      </View>
  );
};

// ─── Expandable Card Component ────────────────────────────────

const ExpandableCard: React.FC<ExpandableCardProps> = ({
                                                         icon, title, value, subtitle, onPress, style,
                                                       }) => {
  const animScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(animScale, { toValue: 0.95, useNativeDriver: true, friction: 8 }),
      Animated.spring(animScale, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start(() => onPress && onPress());
  };

  return (
      <Animated.View style={[{ transform: [{ scale: animScale }] }, style]}>
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePress}
            style={styles.card}
        >
          <View style={styles.cardInner}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>{icon}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
            <View style={styles.cardValueRow}>
              <Text style={styles.cardValue} numberOfLines={1}>{value}</Text>
              {subtitle ? <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
  );
};

// ─── AI Overview Card ─────────────────────────────────────────

const AIOverviewCard: React.FC<AIOverviewCardProps> = ({ overview, loading, error, onRetry, t }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loading) {
      const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading, pulseAnim]);

  return (
      <View style={styles.aiCard}>
        <View style={styles.aiCardHeader}>
          <Text style={styles.aiCardIcon}>✨</Text>
          <Text style={styles.aiCardTitle}>{t('AI Overview')}</Text>
        </View>

        {loading ? (
            <View style={styles.aiLoadingContainer}>
              <Animated.View style={[styles.aiSkeletonLine, { opacity: pulseAnim, width: '90%' }]} />
              <Animated.View style={[styles.aiSkeletonLine, { opacity: pulseAnim, width: '75%' }]} />
              <Animated.View style={[styles.aiSkeletonLine, { opacity: pulseAnim, width: '60%' }]} />
            </View>
        ) : error ? (
            <View style={styles.aiErrorContainer}>
              <Text style={styles.aiErrorText}>{t('Unable to load insights right now.')}</Text>
              <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>{t('Tap to Retry')}</Text>
              </TouchableOpacity>
            </View>
        ) : (
            <View style={{ gap: 8 }}>
              {overview.split('\n').filter(line => line.trim().length > 0).map((line, index) => (
                  <View key={index} style={styles.aiOverviewLine}>
                    <Text style={styles.aiOverviewText}>{line.trim()}</Text>
                  </View>
              ))}
            </View>
        )}
      </View>
  );
};

// ─── Main Dashboard Screen ────────────────────────────────────

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ navigation, route }) => {
  useBlockBack();
  const router = useRouter();

  const { isSinhala, toggleLanguage, t, isTranslating } = useLanguage();

  // ── Real profile loaded from API ──────────────────────────────────────────
  const [profile, setProfile]       = useState<ProviderData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Derived from profile (or fallback while loading) ─────────────────────
  const providerName = profile?.name ?? route?.params?.providerName ?? '';
  const providerId   = profile?.id   ?? route?.params?.providerId   ?? '';
  const jobRole      = profile?.category.name ?? route?.params?.jobRole ?? '';

  const [aiOverview, setAiOverview] = useState<string>('');
  const [aiLoading, setAiLoading]   = useState<boolean>(true);
  const [aiError, setAiError]       = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    ...DEFAULT_DASHBOARD_DATA,
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const openModal  = (name: string) => setActiveModal(name);
  const closeModal = () => setActiveModal(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/geo/active')
        .then(res => setActiveBookingId(res.data.booking_id))
        .catch(() => {});
  }, []);

  useProviderLocationSender({
    enabled:   !!activeBookingId,
    bookingId: activeBookingId ?? '',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // ── Load real profile on mount ────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      console.log('Profile fetch error:', err);
      // Keeps route param fallbacks — no crash
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Load real booking counts ──────────────────────────────────────────────
  const loadBookingCounts = useCallback(async () => {
    try {
      const bookings = await fetchProviderBookings();
      const completedJobs = bookings.filter(b => b.status === 'completed').length;
      const upcomingJobs  = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
      setDashboardData(prev => ({ ...prev, completedJobs, upcomingJobs }));
    } catch (err) {
      console.log('Booking counts fetch error:', err);
    }
  }, []);

  useEffect(() => { loadBookingCounts(); }, [loadBookingCounts]);

  // Fire AI overview after profile has loaded
  useEffect(() => {
    if (!profileLoading && providerId) {
      loadAIOverview();
    }
  }, [profileLoading, providerId]);

  // ── Load other dashboard stats via existing service ───────────────────────
  const loadDashboardData = useCallback(async (): Promise<void> => {
    if (!providerId) return;
    try {
      const data = await fetchDashboardData(providerId);
      // Merge — preserve our real completedJobs/upcomingJobs from bookings
      setDashboardData(prev => ({
        ...data,
        completedJobs: prev.completedJobs,
        upcomingJobs:  prev.upcomingJobs,
        // Use real rating from profile
        rating: profile?.rating ?? data.rating,
      }));
    } catch (err) {
      console.log('Dashboard data fetch error:', err);
    }
  }, [providerId, profile?.rating]);


  // ── Load AI Overview (waits for profile so name/role are real) ────────────
  const loadAIOverview = useCallback(async (): Promise<void> => {
    if (!providerId) return; // wait until profile is loaded
    setAiLoading(true);
    setAiError(false);
    try {
      const overview = await fetchAIOverview({
        provider_id:          providerId,
        provider_name:        providerName,
        job_role:             jobRole,
        completed_jobs_today: dashboardData.completedJobs,
        upcoming_jobs:        dashboardData.upcomingJobs,
        rating:               dashboardData.rating,
      });
      setAiOverview(overview);
    } catch (err) {
      console.error('AI Overview fetch error:', err);
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }, [providerId, providerName, jobRole, dashboardData.completedJobs, dashboardData.upcomingJobs, dashboardData.rating]);

  useEffect(() => {
    if (!profileLoading && providerId) {
      loadDashboardData();
    }
  }, [profileLoading, providerId]);

  // ── Pull to Refresh ───────────────────────────────────────────────────────
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadBookingCounts()]);
    await Promise.all([loadAIOverview(), loadDashboardData()]);
    setRefreshing(false);
  };

  const greeting = getGreeting();
  const emoji    = getGreetingEmoji();

  return (
      <>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={['#1086b5', '#022373']} style={styles.container}>
          <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
              }
          >
            {/* ── Top Bar ── */}
            <View style={styles.topBar}>
              <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/images/provider-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
              </View>

              <View style={styles.topBarRight}>
                <View style={styles.languageToggle}>
                  <Text style={[styles.langLabel, !isSinhala && styles.langLabelActive]}>ENG</Text>
                  <Text style={styles.langDivider}>|</Text>
                  <Text style={[styles.langLabel, isSinhala && styles.langLabelActive]}>සිං</Text>
                  {isTranslating && (
                      <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 4 }} />
                  )}
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
                    onPress={() => router.push('../ProviderAlerts')}
                >
                  <Text style={styles.bellIcon}>🔔</Text>
                  {dashboardData.notifications > 0 && (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>{dashboardData.notifications}</Text>
                      </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Welcome Section ── */}
            <Animated.View
                style={[styles.welcomeSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <Text style={styles.dashboardLabel}>{t('Provider Dashboard')}</Text>
              <Text style={styles.greetingText}>
                {t(greeting)}, {emoji}
              </Text>
              {/* Show real name once loaded, skeleton otherwise */}
              {profileLoading ? (
                  <View style={styles.nameSkeleton} />
              ) : (
                  <Text style={styles.providerName}>{providerName}</Text>
              )}
            </Animated.View>

            {/* ── AI Overview ── */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <AIOverviewCard
                  overview={aiOverview}
                  loading={aiLoading || profileLoading}
                  error={aiError}
                  onRetry={loadAIOverview}
                  t={t}
              />
            </Animated.View>

            {/* ── Dashboard Cards Grid ── */}
            <View style={styles.cardsGrid}>
              <View style={styles.cardRow}>
                <ExpandableCard
                    icon="✅"
                    title={t('Completed Jobs')}
                    value={dashboardData.completedJobs}
                    subtitle={t('Total')}
                    onPress={() => openModal('completed')}
                    style={styles.cardWrapper}
                />
                <ExpandableCard
                    icon="📋"
                    title={t('Upcoming Jobs')}
                    value={dashboardData.upcomingJobs}
                    subtitle="Scheduled"
                    onPress={() => openModal('upcoming')}
                    style={styles.cardWrapper}
                />
              </View>

              <View style={styles.cardRow}>
                <ExpandableCard
                    icon="🔔"
                    title={t('Notifications')}
                    value={dashboardData.notifications}
                    subtitle="New"
                    onPress={() => openModal('notifications')}
                    style={styles.cardWrapper}
                />
                <ExpandableCard
                    icon="⭐"
                    title={t('Rating')}
                    value={profile?.rating != null && profile.rating > 0
                        ? profile.rating.toFixed(1)
                        : dashboardData.rating}
                    subtitle={`/ 5.0`}
                    onPress={() => openModal('rating')}
                    style={styles.cardWrapper}
                />
              </View>

              <View style={styles.cardRow}>
                <ExpandableCard
                    icon="💬"
                    title={t('Responses')}
                    value={dashboardData.customerResponses}
                    subtitle="Pending"
                    onPress={() => openModal('responses')}
                    style={styles.cardWrapper}
                />
                <ExpandableCard
                    icon="🔄"
                    title={t('Re-Schedules')}
                    value={dashboardData.reSchedules}
                    subtitle="View All"
                    onPress={() => openModal('reschedules')}
                    style={styles.cardWrapper}
                />
              </View>
            </View>

            <View style={{ height: 80 }} />

            {/* ── Popups ── */}

            {/* Upcoming Jobs */}
            <CardModal visible={activeModal === 'upcoming'} onClose={closeModal} title="Upcoming Jobs" icon="📋">
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Scheduled bookings</Text>
                <Text style={modalStyles.statValue}>{dashboardData.upcomingJobs}</Text>
              </View>
              <TouchableOpacity style={modalStyles.navBtn} onPress={() => { closeModal(); router.push('/ProviderSchedule'); }}>
                <Text style={modalStyles.navBtnText}>VIEW FULL SCHEDULE →</Text>
              </TouchableOpacity>
            </CardModal>

            {/* Completed Jobs */}
            <CardModal visible={activeModal === 'completed'} onClose={closeModal} title="Completed Jobs" icon="✅">
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Total completed jobs</Text>
                <Text style={modalStyles.statValue}>{dashboardData.completedJobs}</Text>
              </View>
              <TouchableOpacity style={modalStyles.navBtn} onPress={() => { closeModal(); router.push('/ProviderSchedule'); }}>
                <Text style={modalStyles.navBtnText}>VIEW ALL JOBS →</Text>
              </TouchableOpacity>
            </CardModal>

            {/* Notifications */}
            <CardModal visible={activeModal === 'notifications'} onClose={closeModal} title="Notifications" icon="🔔">
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Unread notifications</Text>
                <Text style={modalStyles.statValue}>{dashboardData.notifications}</Text>
              </View>
              <TouchableOpacity style={modalStyles.navBtn} onPress={() => { closeModal(); router.push('../ProviderAlerts'); }}>
                <Text style={modalStyles.navBtnText}>VIEW ALL NOTIFICATIONS →</Text>
              </TouchableOpacity>
            </CardModal>

            {/* Rating — real from DB, reviews deferred */}
            <CardModal visible={activeModal === 'rating'} onClose={closeModal} title="Your Rating" icon="⭐">
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Average Rating</Text>
                <Text style={modalStyles.statValue}>
                  {profile?.rating != null && profile.rating > 0
                      ? `${profile.rating.toFixed(1)} / 5.0`
                      : 'Not rated yet'}
                </Text>
              </View>
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Reviews</Text>
                <Text style={modalStyles.statValue}>Coming soon</Text>
              </View>
            </CardModal>

            {/* Responses */}
            <CardModal visible={activeModal === 'responses'} onClose={closeModal} title="Responses" icon="💬">
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Unread chats</Text>
                <Text style={modalStyles.statValue}>{dashboardData.customerResponses}</Text>
              </View>
              <TouchableOpacity style={modalStyles.navBtn} onPress={() => { closeModal(); router.push('/Chats'); }}>
                <Text style={modalStyles.navBtnText}>OPEN CHATS →</Text>
              </TouchableOpacity>
            </CardModal>

            <View style={{ height: 40 }} />
          </ScrollView>
        </LinearGradient>
      </>
  );
};

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: { width: 44, height: 44 },
  logo:          { width: 44, height: 44 },
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
  langLabel:       { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  langLabelActive: { color: '#fff' },
  langDivider:     { color: 'rgba(255,255,255,0.4)', marginHorizontal: 6, fontSize: 12 },
  switchStyle:     { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  bellButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  bellIcon:     { fontSize: 18 },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  welcomeSection: { alignItems: 'center', marginBottom: 24 },
  dashboardLabel: {
    color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  greetingText: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 2 },
  providerName: { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '500' },
  // Skeleton placeholder for provider name while loading
  nameSkeleton: {
    height: 20, width: 160, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  aiCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  aiCardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiCardIcon:      { fontSize: 20, marginRight: 8 },
  aiCardTitle:     { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1 },
  aiOverviewText:  { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 22, fontWeight: '400' },
  aiOverviewLine:  { marginBottom: 4 },
  aiLoadingContainer: { gap: 10 },
  aiSkeletonLine: {
    height: 12, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  aiErrorContainer: { alignItems: 'center', paddingVertical: 8 },
  aiErrorText:     { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8,
  },
  retryButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  cardsGrid:   { gap: 12 },
  cardRow:     { flexDirection: 'row', gap: 12 },
  cardWrapper: { flex: 1 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', minHeight: 110,
  },
  cardInner:        { alignItems: 'flex-start' },
  cardIconContainer: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  cardIcon:     { fontSize: 18 },
  cardTitle:    { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cardValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  cardValue:    { color: '#fff', fontSize: 24, fontWeight: '800' },
  cardSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
  card: {
    width: SCREEN_WIDTH * 0.85, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  cardGradient: { padding: 22 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIcon:     { fontSize: 22, marginRight: 10 },
  cardTitle:    { color: 'white', fontSize: 18, fontWeight: '800', flex: 1 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  navBtn: {
    marginTop: 6, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  navBtnText: { color: 'white', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  statValue: { color: 'white', fontWeight: '700', fontSize: 13 },
});

export default ProviderDashboard;
