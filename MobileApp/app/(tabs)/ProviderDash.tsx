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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DashboardData,
  DEFAULT_DASHBOARD_DATA,
  fetchAIOverview,
  fetchDashboardData,
} from '../services/dashboardService';

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

// ─── Expandable Card Component ────────────────────────────────

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  expandedContent,
  onPress,
  style,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const animHeight = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(1)).current;

  const toggleExpand = (): void => {
    if (onPress) {
      onPress();
      return;
    }
    const toExpanded = !expanded;
    setExpanded(toExpanded);

    Animated.parallel([
      Animated.spring(animHeight, {
        toValue: toExpanded ? 1 : 0,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.spring(animScale, {
        toValue: toExpanded ? 1.02 : 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const expandedHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <Animated.View style={[{ transform: [{ scale: animScale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={toggleExpand}
        onPress={onPress || toggleExpand}
        delayLongPress={400}
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

        <Animated.View
          style={[styles.expandedSection, { height: expandedHeight, opacity: animHeight }]}
        >
          {expanded && (
            <View style={styles.expandedContentInner}>
              <View style={styles.divider} />
              {expandedContent}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── AI Overview Card ─────────────────────────────────────────

const AIOverviewCard: React.FC<AIOverviewCardProps> = ({ overview, loading, error, onRetry }) => {
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
        <Text style={styles.aiCardTitle}>AI Overview</Text>
      </View>

      {loading ? (
        <View style={styles.aiLoadingContainer}>
          <Animated.View style={[styles.aiSkeletonLine, { opacity: pulseAnim, width: '90%' }]} />
          <Animated.View style={[styles.aiSkeletonLine, { opacity: pulseAnim, width: '75%' }]} />
          <Animated.View style={[styles.aiSkeletonLine, { opacity: pulseAnim, width: '60%' }]} />
        </View>
      ) : error ? (
        <View style={styles.aiErrorContainer}>
          <Text style={styles.aiErrorText}>Unable to load insights right now.</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.aiOverviewText}>{overview}</Text>
      )}
    </View>
  );
};

// ─── Main Dashboard Screen ────────────────────────────────────

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ navigation, route }) => {
  const providerName: string = route?.params?.providerName || 'Nimal Chandra';
  const providerId: string = route?.params?.providerId || 'provider_001';
  const jobRole: string = route?.params?.jobRole || 'Plumber';

  const [isSinhala, setIsSinhala] = useState<boolean>(false);
  const [aiOverview, setAiOverview] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(true);
  const [aiError, setAiError] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    ...DEFAULT_DASHBOARD_DATA,
    upcomingJobs: 2,
    notifications: 1,
    rating: 4.8,
    totalReviews: 24,
    customerResponses: 5,
    reSchedules: 12,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // ── Load AI Overview via service ──
  const loadAIOverview = useCallback(async (): Promise<void> => {
    setAiLoading(true);
    setAiError(false);
    try {
      const overview = await fetchAIOverview({
        provider_id: providerId,
        provider_name: providerName,
        job_role: jobRole,
        completed_jobs_today: dashboardData.completedJobs,
        upcoming_jobs: dashboardData.upcomingJobs,
        rating: dashboardData.rating,
      });
      setAiOverview(overview);
    } catch (err) {
      console.error('AI Overview fetch error:', err);
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }, [providerId, providerName, jobRole, dashboardData]);

  useEffect(() => {
    loadAIOverview();
  }, [loadAIOverview]);

  // ── Load Dashboard Stats via service ──
  const loadDashboardData = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchDashboardData(providerId);
      setDashboardData(data);
    } catch (err) {
      console.log('Dashboard data fetch error:', err);
      // Keeps the default/hardcoded values — no crash
    }
  }, [providerId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Pull to Refresh ──
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([loadAIOverview(), loadDashboardData()]);
    setRefreshing(false);
  };

  const toggleLanguage = (): void => {
    setIsSinhala(!isSinhala);
  };

  const greeting = getGreeting();
  const emoji = getGreetingEmoji();

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#17AEFF', '#003D96']} style={styles.container}>
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
                onPress={() => navigation?.navigate?.('Notifications')}
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
            style={[
              styles.welcomeSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.dashboardLabel}>Provider Dashboard</Text>
            <Text style={styles.greetingText}>
              {greeting}, {emoji}
            </Text>
            <Text style={styles.providerName}>{providerName}</Text>
          </Animated.View>

          {/* ── AI Overview ── */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <AIOverviewCard
              overview={aiOverview}
              loading={aiLoading}
              error={aiError}
              onRetry={loadAIOverview}
            />
          </Animated.View>

          {/* ── Dashboard Cards Grid ── */}
          <View style={styles.cardsGrid}>
            <View style={styles.cardRow}>
              <ExpandableCard
                icon="✅"
                title="Completed Jobs"
                value={dashboardData.completedJobs}
                subtitle="Today"
                onPress={() => navigation?.navigate?.('CompletedJobs')}
                style={styles.cardWrapper}
              />
              <ExpandableCard
                icon="📋"
                title="Upcoming Jobs"
                value={dashboardData.upcomingJobs}
                subtitle="Scheduled"
                expandedContent={
                  <View>
                    <Text style={styles.expandedText}>Next job in 2 hours</Text>
                    <Text style={styles.expandedText}>Tap to see full schedule →</Text>
                  </View>
                }
                style={styles.cardWrapper}
              />
            </View>

            <View style={styles.cardRow}>
              <ExpandableCard
                icon="🔔"
                title="Notifications"
                value={dashboardData.notifications}
                subtitle="New"
                expandedContent={
                  <View>
                    <Text style={styles.expandedText}>• New job request nearby</Text>
                    <Text style={styles.expandedText}>Tap to view all →</Text>
                  </View>
                }
                style={styles.cardWrapper}
              />
              <ExpandableCard
                icon="⭐"
                title="Rating"
                value={dashboardData.rating}
                subtitle={`(${dashboardData.totalReviews})`}
                expandedContent={
                  <View>
                    <Text style={styles.expandedText}>Top rated in your area!</Text>
                    <Text style={styles.expandedText}>5★: 18 | 4★: 4 | 3★: 2</Text>
                  </View>
                }
                style={styles.cardWrapper}
              />
            </View>

            <View style={styles.cardRow}>
              <ExpandableCard
                icon="💬"
                title="Responses"
                value={dashboardData.customerResponses}
                subtitle="Pending"
                expandedContent={
                  <View>
                    <Text style={styles.expandedText}>3 awaiting your reply</Text>
                    <Text style={styles.expandedText}>Avg response time: 12min</Text>
                  </View>
                }
                style={styles.cardWrapper}
              />
              <ExpandableCard
                icon="🔄"
                title="Re-Schedules"
                value={dashboardData.reSchedules}
                subtitle="View All"
                expandedContent={
                  <View>
                    <Text style={styles.expandedText}>2 pending approval</Text>
                    <Text style={styles.expandedText}>10 completed this month</Text>
                  </View>
                }
                style={styles.cardWrapper}
              />
            </View>
          </View>

          {/* Bottom spacing for your existing navbar */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  logoContainer: {
    width: 44,
    height: 44,
  },
  logo: {
    width: 44,
    height: 44,
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
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dashboardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  providerName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '500',
  },
  aiCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiCardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  aiCardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  aiOverviewText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  aiLoadingContainer: {
    gap: 10,
  },
  aiSkeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  aiErrorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  aiErrorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cardsGrid: {
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    minHeight: 110,
  },
  cardInner: {
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  cardValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  expandedSection: {
    overflow: 'hidden',
  },
  expandedContentInner: {
    paddingTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 8,
  },
  expandedText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400',
  },
});

export default ProviderDashboard;
