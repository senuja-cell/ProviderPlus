import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Image, ScrollView,
  TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProviderById, ProviderData } from './services/providerProfileService';
import { getOrCreateConversation } from './services/messagingApi';
import { useLanguage } from './context/LanguageContext'; // ✅ ADDED

// ── Colors ────────────────────────────────────────────────────────────────────
const COLORS = {
  blueLight:    '#5BB8F5',
  blueMid:      '#2E86D4',
  blueDark:     '#1A4F9C',
  accent:       '#FFFFFF',
  text:         '#1A1A1A',
  subtext:      '#5A5A5A',
  background:   '#FFFFFF',
  star:         '#FFD700',
  border:       '#E8F0FB',
  cardBg:       '#F4F8FF',
  pillInactive: '#DDE9F8',
  verified:     '#4CAF50',
};

// ── Small reusable pieces ─────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={13}
          color={COLORS.star}
        />
      ))}
      <Text style={{ fontSize: 12, color: COLORS.subtext, marginLeft: 3, fontWeight: '600' }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 22 }} />;
}

function EmptyCard({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon as any} size={30} color={COLORS.blueMid} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function PortfolioCard({ uri, index, label }: { uri: string; index: number; label: string }) {
  return (
    <View style={styles.portfolioCard}>
      <Text style={styles.workTitle}>{label} {index + 1}</Text>
      <View style={styles.portfolioImageWrapper}>
        <Image source={{ uri }} style={styles.portfolioImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(26,79,156,0.6)']}
          style={styles.portfolioGradient}
        />
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProviderProfile() {
  const { id: providerId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ✅ get from context
  const { t, isSinhala } = useLanguage();

  // ✅ Pre-register all texts so auto-translate picks them up
  useEffect(() => {
    t('Loading profile…');
    t('Provider not found.');
    t('Go Back');
    t('Rating');
    t('Verified');
    t('Pending');
    t('Portfolio');
    t('About');
    t('Specialisations');
    t('No portfolio images uploaded yet.');
    t('Work');
  }, [isSinhala]);

  const scrollRef    = useRef<ScrollView>(null);
  const aboutRef     = useRef<View>(null);
  const portfolioRef = useRef<View>(null);

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'about' | 'portfolio'>('about');
  const [booking, setBooking] = useState(false);

  const handleBookPress = async () => {
    if (!provider) return;
    setBooking(true);
    try {
      const conversationId = await getOrCreateConversation(
        provider.id,
        provider.category.slug
      );
      router.push({
        pathname: '/Chat',
        params: {
          conversationId,
          providerId,
          providerName: provider.name,
          providerRole: provider.category.name,
        },
      });
    } catch (e) {
      console.error('Failed to open chat:', e);
    } finally {
      setBooking(false);
    }
  };

  useEffect(() => {
    if (!providerId) {
      setError('No provider ID provided.');
      setLoading(false);
      return;
    }
    getProviderById(providerId)
      .then(setProvider)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [providerId]);

  const scrollToSection = (
    ref: React.RefObject<View | null>,
    section: 'about' | 'portfolio'
  ) => {
    setActiveSection(section);
    ref.current?.measureLayout(
      scrollRef.current as any,
      (_x: number, y: number) => scrollRef.current?.scrollTo({ y: y - 70, animated: true }),
      () => {}
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient colors={[COLORS.blueLight, COLORS.blueDark]} style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#fff" />
        {/* ✅ */}
        <Text style={[styles.loadingText, { color: '#fff' }]}>{t('Loading profile…')}</Text>
      </LinearGradient>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !provider) {
    return (
      <LinearGradient colors={[COLORS.blueLight, COLORS.blueDark]} style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={48} color="#fff" />
        {/* ✅ */}
        <Text style={[styles.errorText, { color: '#fff' }]}>{error ?? t('Provider not found.')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          {/* ✅ */}
          <Text style={styles.retryBtnText}>{t('Go Back')}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView ref={scrollRef} stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.headerContainer}>
          {provider.profile_image ? (
            <>
              <Image
                source={{ uri: provider.profile_image }}
                style={styles.banner}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(91,184,245,0.45)', 'rgba(26,79,156,0.75)']}
                style={StyleSheet.absoluteFillObject}
              />
            </>
          ) : (
            <LinearGradient
              colors={[COLORS.blueLight, COLORS.blueDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            />
          )}

          <TouchableOpacity style={styles.iconBack} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          <View style={styles.profilePicWrapper}>
            <Image
              source={provider.profile_image ? { uri: provider.profile_image } : require('../assets/images/account.png')}
              style={styles.profilePic}
            />
            {provider.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.verified} />
              </View>
            )}
          </View>
        </View>

        {/* ── INFO ── */}
        <View style={styles.infoSection}>

          {/* Stats bar */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StarRow rating={provider.rating ?? 0} />
              {/* ✅ */}
              <Text style={styles.statLabel}>{t('Rating')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[
                styles.statBadge,
                {
                  backgroundColor: provider.is_verified ? '#E8F5E9' : '#FFF3E0',
                  color: provider.is_verified ? '#2E7D32' : '#E65100',
                }
              ]}>
                {/* ✅ */}
                {provider.is_verified ? `✓  ${t('Verified')}` : t('Pending')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{provider.portfolio_images.length}</Text>
              {/* ✅ */}
              <Text style={styles.statLabel}>{t('Portfolio')}</Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.fullName}>{provider.name.toUpperCase()}</Text>

          {/* Category tag */}
          <View style={styles.categoryTag}>
            <Ionicons name="briefcase-outline" size={12} color={COLORS.blueMid} />
            <Text style={styles.categoryText}>{provider.category.name}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{provider.description}</Text>

          {/* Tags */}
          {provider.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {provider.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── STICKY PILLS ── */}
        <View style={styles.pillsContainer}>
          {(
            [
              { key: 'about',     ref: aboutRef,      label: t('About') },
              { key: 'portfolio', ref: portfolioRef,  label: t('Portfolio') },
            ] as const
          ).map(({ key, ref, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.pill, activeSection === key && styles.pillActive]}
              onPress={() => scrollToSection(ref, key)}
            >
              {/* ✅ */}
              <Text style={[styles.pillText, activeSection === key && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.contentPadding}>

          {/* ABOUT */}
          <View ref={aboutRef} style={styles.contentBlock}>
            {/* ✅ */}
            <SectionTitle>{t('About')}</SectionTitle>
            <Text style={styles.bodyText}>{provider.description}</Text>

            {provider.tags.length > 0 && (
              <>
                {/* ✅ */}
                <Text style={[styles.sectionTitle, { marginTop: 18 }]}>{t('Specialisations')}</Text>
                <View style={styles.tagsRow}>
                  {provider.tags.map((tag) => (
                    <View key={tag} style={styles.tagLarge}>
                      <Text style={styles.tagLargeText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          <Divider />

          {/* PORTFOLIO */}
          <View ref={portfolioRef} style={styles.contentBlock}>
            {/* ✅ */}
            <SectionTitle>{t('Portfolio')}</SectionTitle>
            {provider.portfolio_images.length > 0 ? (
              provider.portfolio_images.map((uri, i) => (
                // ✅ pass translated 'Work' label
                <PortfolioCard key={i} uri={uri} index={i} label={t('Work')} />
              ))
            ) : (
              // ✅
              <EmptyCard icon="images-outline" text={t('No portfolio images uploaded yet.')} />
            )}
          </View>

          {/* BOOK CTA */}
          <LinearGradient
            colors={[COLORS.blueMid, COLORS.blueDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtn}
          >
            <TouchableOpacity
              style={styles.bookBtnInner}
              onPress={handleBookPress}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={18} color="white" style={{ marginRight: 8 }} />
                  {/* ✅ provider name stays in original language */}
                  <Text style={styles.bookBtnText}>Message {provider.name.split(' ')[0]}</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:  { marginTop: 12, fontSize: 15 },
  errorText:    { marginTop: 12, fontSize: 15, textAlign: 'center', paddingHorizontal: 30 },
  retryBtn:     { marginTop: 20, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerContainer:   { height: 270, position: 'relative' },
  banner:            { width: '100%', height: 210 },
  iconBack:          { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, padding: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  profilePicWrapper: {
    position: 'absolute', bottom: 0, alignSelf: 'center',
    backgroundColor: 'white', borderRadius: 22, padding: 4,
    shadowColor: COLORS.blueDark, shadowOpacity: 0.25, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  profilePic:        { width: 130, height: 130, borderRadius: 18 },
  verifiedBadge:     { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'white', borderRadius: 12 },
  infoSection:   { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  statsRow:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.cardBg, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20, marginBottom: 16, width: '100%',
    shadowColor: COLORS.blueDark, shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statItem:     { flex: 1, alignItems: 'center' },
  statDivider:  { width: 1, height: 32, backgroundColor: COLORS.border },
  statNumber:   { fontSize: 15, fontWeight: '800', color: COLORS.blueDark },
  statLabel:    { fontSize: 11, color: COLORS.subtext, marginTop: 2 },
  statBadge:    { fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  fullName:     { fontSize: 26, fontWeight: '900', letterSpacing: 1.5, color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  categoryTag:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12, gap: 5, borderWidth: 1, borderColor: COLORS.border },
  categoryText: { fontSize: 13, color: COLORS.blueMid, fontWeight: '600' },
  description:  { color: COLORS.subtext, lineHeight: 21, fontSize: 14, textAlign: 'center', marginBottom: 10 },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 6 },
  tag:          { backgroundColor: COLORS.pillInactive, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText:      { fontSize: 12, color: COLORS.blueDark, fontWeight: '500' },
  pillsContainer: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, paddingHorizontal: 30,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    shadowColor: COLORS.blueDark, shadowOpacity: 0.07, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  pill:           { backgroundColor: COLORS.pillInactive, paddingVertical: 10, paddingHorizontal: 40, borderRadius: 25 },
  pillActive:     { backgroundColor: COLORS.blueDark },
  pillText:       { fontWeight: '700', fontSize: 13, color: COLORS.blueDark },
  pillTextActive: { color: '#fff' },
  contentPadding: { padding: 20 },
  contentBlock:   { marginBottom: 4 },
  sectionTitle:   { fontSize: 17, fontWeight: '800', color: COLORS.blueDark, marginBottom: 10, letterSpacing: 0.3 },
  bodyText:       { fontSize: 14, color: COLORS.subtext, lineHeight: 22 },
  tagLarge:     { backgroundColor: COLORS.cardBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  tagLargeText: { fontSize: 13, color: COLORS.blueMid, fontWeight: '600' },
  portfolioCard:         { marginBottom: 24 },
  workTitle:             { fontSize: 16, fontWeight: '800', color: COLORS.blueDark, marginBottom: 8 },
  portfolioImageWrapper: { position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  portfolioImage:        { width: '100%', height: 200 },
  portfolioGradient:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, paddingVertical: 28, paddingHorizontal: 20, gap: 8, marginBottom: 4, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.subtext, fontSize: 13, textAlign: 'center' },
  bookBtn:      { borderRadius: 30, marginTop: 24, overflow: 'hidden', shadowColor: COLORS.blueDark, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  bookBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  bookBtnText:  { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
