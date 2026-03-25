import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Modal, Dimensions,
  Animated, Platform, Linking, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRoleBack } from '../hooks/useBackNavigation';

const { width, height } = Dimensions.get('window');

import { fetchProviderBookings, completeBooking, ProviderBooking } from '../services/ordersService';
import { useFocusEffect } from '@react-navigation/native';

const formatDateTime = (date: string, time: string): string => {
  const d = new Date(`${date}T${time}`);
  if (isNaN(d.getTime())) return `${date}  ·  ${time}`;
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart}  ·  ${timePart}`;
};

// ─── Icon Placeholder ─────────────────────────────────────────────────
function JobIcon({ size = 48 }: { size?: number }) {
  return (
      <View style={[styles.jobIcon, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.42 }}>🔧</Text>
      </View>
  );
}

// ─── Animated Finished Card ───────────────────────────────────────────
function FinishedCard({ job, onPress }: { job: ProviderBooking; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => onPress());
  };

  return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={handlePress}>
          <View style={styles.cardRow}>
            <JobIcon />
            <View style={styles.cardInfo}>
              {/* Fixed: was job.jobTitle — ProviderBooking uses job.summary */}
              <Text style={styles.cardTitle}>{job.summary}</Text>
              <Text style={styles.cardAddress}>{job.category_name}</Text>
              {/* Fixed: was job.customerName — ProviderBooking uses job.user_name */}
              <Text style={styles.cardCustomer}>Customer - {job.user_name}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
  );
}

// ─── Modal Component ──────────────────────────────────────────────────
function JobDetailModal({
                          job, visible, onClose,
                        }: {
  job: ProviderBooking | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!job) return null;

  return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        {/* Backdrop */}
        <Animated.View style={[styles.modalBackdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1086b5', '#022373']} style={styles.modalGradient}>

            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <JobIcon size={56} />
              <View style={{ marginLeft: 14, flex: 1 }}>
                {/* Fixed: was job.jobTitle */}
                <Text style={styles.modalTitle}>{job.summary}</Text>
                {/* Fixed: was job.category */}
                <Text style={styles.modalCategory}>{job.category_name}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* Details — Fixed: all field names corrected to ProviderBooking shape */}
            <ModalRow label="Customer"    value={job.user_name} />
            <ModalRow label="Description" value={job.summary} />
            <ModalRow label="Date & Time" value={formatDateTime(job.date, job.time)} />
            <ModalRow label="Status"      value={job.status.toUpperCase()} highlight />

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </TouchableOpacity>

          </LinearGradient>
        </Animated.View>
      </Modal>
  );
}

function ModalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
      <View style={styles.modalRow}>
        <Text style={styles.modalLabel}>{label}</Text>
        <Text style={[styles.modalValue, highlight && { color: '#00C6FF', fontWeight: '800' }]}>
          {value}
        </Text>
      </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────
export default function ProviderScheduleScreen() {
  useRoleBack();
  const router = useRouter();
  const [isSinhala, setIsSinhala] = useState(false);
  const toggleLanguage = () => setIsSinhala(prev => !prev);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ProviderBooking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks which booking_id is currently being marked complete (shows loading)
  const [completing, setCompleting] = useState<string | null>(null);

  // Tick every minute to refresh countdowns
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchProviderBookings();
      setBookings(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Could not load schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
      useCallback(() => { loadBookings(); }, [])
  );

  // ─── Finish Job Handler ────────────────────────────────────────────
  const handleFinishJob = (booking: ProviderBooking) => {
    Alert.alert(
        'Finish Job',
        `Mark "${booking.summary}" as completed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Finish',
            style: 'default',
            onPress: async () => {
              setCompleting(booking.booking_id);
              try {
                await completeBooking(booking.booking_id);
                // Optimistically update local state — moves card to Finished section
                setBookings(prev =>
                    prev.map(b =>
                        b.booking_id === booking.booking_id
                            ? { ...b, status: 'completed' }
                            : b
                    )
                );
                Alert.alert('Job Completed', `"${booking.summary}" has been marked as completed. Great work! 🎉`);
              } catch (e: any) {
                Alert.alert(
                    'Error',
                    e?.response?.data?.detail ?? 'Could not complete the job. Please try again.'
                );
              } finally {
                setCompleting(null);
              }
            },
          },
        ]
    );
  };

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const finished  = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  // Timing logic for the upcoming job
  const timeUntil = (date: string, time: string): { value: string; label: string; isImminent: boolean } => {
    const target = new Date(`${date}T${time}`);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0)  return { value: 'NOW',  label: '',      isImminent: true };

    const totalMins   = Math.floor(diffMs / 60000);
    const totalHours  = Math.floor(totalMins / 60);
    const totalDays   = Math.floor(totalHours / 24);
    const totalWeeks  = Math.floor(totalDays / 7);
    const totalMonths = Math.floor(totalDays / 30);

    if (totalMonths >= 2) return { value: `${totalMonths}`, label: 'MONTHS', isImminent: false };
    if (totalDays  >= 14) return { value: `${totalWeeks}`,  label: 'WEEKS',  isImminent: false };
    if (totalHours >= 24) return { value: `${totalDays}`,   label: 'DAYS',   isImminent: false };
    if (totalMins  >= 60) return { value: `${totalHours}`,  label: 'HRS',    isImminent: false };
    return { value: `${totalMins}`,   label: 'MINS',   isImminent: totalMins <= 30 };
  };

  const openMaps = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return;
    const url = Platform.select({
      ios:     `maps://?q=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
    }) ?? `https://www.google.com/maps?q=${lat},${lng}`;
    Linking.openURL(url).catch(() =>
        Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`)
    );
  };

  const openChat = (conversationId: string) => {
    router.push({ pathname: '/Chat', params: { conversationId } });
  };

  return (
      <LinearGradient colors={['#1086b5', '#022373']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/ProviderDash')}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
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
          </View>

          {loading ? (
              <View style={styles.centred}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
          ) : error ? (
              <View style={styles.centred}>
                <Text style={styles.centredText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadBookings()}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
          ) : (
              <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scroll}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} tintColor="#fff" />
                  }
              >
                {/* UPCOMING JOBS */}
                <SectionHeader title="UPCOMING JOBS" />

                {upcoming.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyText}>No upcoming jobs</Text>
                    </View>
                ) : (
                    upcoming.map((booking, idx) => {
                      const isFirst    = idx === 0;
                      const isExpanded = expandedId === booking.booking_id;
                      const t          = isFirst ? timeUntil(booking.date, booking.time) : null;
                      const isCompleting = completing === booking.booking_id;

                      return (
                          <TouchableOpacity
                              key={booking.booking_id}
                              style={styles.card}
                              activeOpacity={isFirst ? 1 : 0.85}
                              onPress={() => !isFirst && setExpandedId(isExpanded ? null : booking.booking_id)}
                          >
                            <View style={styles.cardRow}>
                              <JobIcon />
                              <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>{booking.summary}</Text>
                                <Text style={styles.cardAddress}>{booking.category_name}</Text>
                                <Text style={styles.cardCustomer}>Customer - {booking.user_name}</Text>
                              </View>

                              {isFirst && t ? (
                                  <View style={styles.timerBox}>
                                    <View style={[styles.redDot, { backgroundColor: t.isImminent ? '#FF3B30' : '#FF9800' }]} />
                                    <Text style={[styles.timerNum, t.value === 'NOW' && { fontSize: 20 }]}>{t.value}</Text>
                                    {t.label ? <Text style={styles.timerLabel}>{t.label}</Text> : null}
                                  </View>
                              ) : (
                                  <View style={styles.greenDot} />
                              )}
                            </View>

                            {(isFirst || isExpanded) && (
                                <>
                                  <View style={styles.divider} />
                                  <View style={styles.actionRow}>

                                    {/* CHECK LOCATION */}
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => openMaps(booking.user_latitude, booking.user_longitude)}
                                    >
                                      <Text style={styles.actionText}>📍 LOCATION</Text>
                                    </TouchableOpacity>

                                    <View style={styles.actionSep} />

                                    {/* CONTACT USER */}
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => openChat(booking.conversation_id)}
                                    >
                                      <Text style={styles.actionText}>💬 CONTACT</Text>
                                    </TouchableOpacity>

                                    <View style={styles.actionSep} />

                                    {/* FINISH JOB */}
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.finishBtn]}
                                        onPress={() => !isCompleting && handleFinishJob(booking)}
                                        disabled={isCompleting}
                                    >
                                      {isCompleting ? (
                                          <ActivityIndicator size="small" color="#fff" />
                                      ) : (
                                          <Text style={[styles.actionText, styles.finishBtnText]}>✅ FINISH</Text>
                                      )}
                                    </TouchableOpacity>

                                  </View>
                                </>
                            )}
                          </TouchableOpacity>
                      );
                    })
                )}

                {/* FINISHED */}
                <SectionHeader title="FINISHED" />

                {finished.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyText}>No finished jobs yet</Text>
                    </View>
                ) : (
                    finished.map(job => (
                        <FinishedCard
                            key={job.booking_id}
                            job={job}
                            onPress={() => { setSelectedJob(job); setModalVisible(true); }}
                        />
                    ))
                )}

                <View style={{ height: 60 }} />
              </ScrollView>
          )}

          <JobDetailModal
              job={selectedJob}
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
          />

        </SafeAreaView>
      </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea:  { flex: 1 },
  scroll:    { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: 'white', fontSize: 30, fontWeight: '300', marginTop: -6 },

  // Language toggle
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langLabel:       { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13, marginHorizontal: 3 },
  langLabelActive: { color: 'white' },
  langDivider:     { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
  switchStyle:     { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

  // Section header
  sectionHeader: { alignItems: 'center', marginBottom: 14, marginTop: 10 },
  sectionTitle:  { color: 'white', fontWeight: '800', fontSize: 17, letterSpacing: 2, marginBottom: 8 },
  sectionLine:   { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Job icon
  jobIcon: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardRow:      { flexDirection: 'row', alignItems: 'center' },
  cardInfo:     { flex: 1 },
  cardTitle:    { color: 'white', fontWeight: '700', fontSize: 15, marginBottom: 2 },
  cardAddress:  { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  cardCustomer: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  chevron:      { color: 'rgba(255,255,255,0.5)', fontSize: 22, marginLeft: 6 },

  // Timer
  timerBox:   { alignItems: 'center', marginLeft: 8, position: 'relative' },
  timerNum:   { color: 'white', fontWeight: '800', fontSize: 32, lineHeight: 34 },
  timerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  redDot: {
    position: 'absolute', top: -4, right: -4,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  greenDot: {
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#28A745',
    marginLeft: 8,
  },

  // Divider & actions
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  actionText:{ color: 'white', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  actionSep: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Finish job button — subtle green tint to stand out from the other action buttons
  finishBtn: {
    backgroundColor: 'rgba(40,167,69,0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    marginHorizontal: 2,
  },
  finishBtnText: {
    color: '#7CFC00',
  },

  // Rescheduled button
  rescheduledBtn: {
    alignSelf: 'center',
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  rescheduledText: { color: '#022373', fontWeight: '700', fontSize: 14 },

  // Modal backdrop
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Modal sheet
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeader:   { flexDirection: 'row', alignItems: 'center' },
  modalTitle:    { fontWeight: '700', fontSize: 17, color: 'white' },
  modalCategory: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText:  { color: 'white', fontSize: 14, fontWeight: '700' },
  modalDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', flex: 1 },
  modalValue: { fontSize: 13, fontWeight: '600', color: 'white', flex: 2, textAlign: 'right' },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: { color: 'white', fontWeight: '700', fontSize: 12 },
  modalCloseBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalCloseBtnText: { color: 'white', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  centred:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  centredText:{ color: 'rgba(255,255,255,0.9)', fontSize: 15, textAlign: 'center' },
  retryBtn:   { backgroundColor: 'white', borderRadius: 25, paddingVertical: 10, paddingHorizontal: 28 },
  retryText:  { color: '#022373', fontWeight: '700', fontSize: 14 },
  emptyCard:  { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  emptyText:  { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
});
