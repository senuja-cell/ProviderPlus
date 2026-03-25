import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Modal, Dimensions,
  ActivityIndicator, RefreshControl, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyBookings, Booking, submitRating } from '../services/ordersService';
import { useRoleBack } from '../hooks/useBackNavigation';

const { width } = Dimensions.get('window');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "2025-07-14" + "09:00" → "14 Jul 2025  ·  09:00 AM" */
const formatDateTime = (date: string, time: string): string => {
  const d = new Date(`${date}T${time}`);
  if (isNaN(d.getTime())) return `${date}  ·  ${time}`;
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart}  ·  ${timePart}`;
};

const STATUS_COLORS: Record<string, string> = {
  pending:   '#FF9800',
  confirmed: '#2196F3',
  completed: '#28A745',
  cancelled: '#FF3B30',
};

// ── Star rating component ─────────────────────────────────────────────────────

function StarRating({
                      value,
                      onChange,
                      size = 36,
                      readonly = false,
                    }: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
                key={star}
                onPress={() => !readonly && onChange?.(star)}
                activeOpacity={readonly ? 1 : 0.7}
                disabled={readonly}
            >
              <Ionicons
                  name={star <= value ? 'star' : 'star-outline'}
                  size={size}
                  color={star <= value ? '#FFB800' : '#ccc'}
              />
            </TouchableOpacity>
        ))}
      </View>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ size = 52, name }: { size?: number; name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.35, color: 'white', fontWeight: '700' }}>{initials}</Text>
      </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, style }: { title: string; style?: object }) {
  return (
      <View style={[styles.sectionHeader, style]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
  );
}

// ── Modal row ─────────────────────────────────────────────────────────────────

function ModalRow({ label, value, valueColor = '#1a1a1a' }: {
  label: string; value: string; valueColor?: string;
}) {
  return (
      <View style={styles.modalRow}>
        <Text style={styles.modalLabel}>{label}</Text>
        <Text style={[styles.modalValue, { color: valueColor }]}>{value}</Text>
      </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

function OrdersScreen() {
  const router = useRouter();
  useRoleBack();

  const { isSinhala, toggleLanguage, t, isTranslating } = useLanguage();

  const [mins, setMins] = useState(59);

  useEffect(() => {
    const timer = setInterval(() => setMins(p => (p > 0 ? p - 1 : 0)), 60000);
    return () => clearInterval(timer);
  }, []);

  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [selectedJob, setSelectedJob]   = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ── Rating state ────────────────────────────────────────────────────────────
  const [ratingValue,   setRatingValue]   = useState(0);
  const [reviewText,    setReviewText]    = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError,   setRatingError]   = useState<string | null>(null);

  // ── Fetch bookings ──────────────────────────────────────────────────────────

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Could not load bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, []);

  // ── Open modal ──────────────────────────────────────────────────────────────

  const openJobModal = (booking: Booking) => {
    setSelectedJob(booking);
    // Pre-fill if already rated
    setRatingValue(booking.rating ?? 0);
    setReviewText(booking.review_text ?? '');
    setRatingError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedJob(null);
    setRatingValue(0);
    setReviewText('');
    setRatingError(null);
  };

  // ── Submit rating ───────────────────────────────────────────────────────────

  const handleSubmitRating = async () => {
    if (!selectedJob) return;
    if (ratingValue === 0) {
      setRatingError(t('Please select a star rating.'));
      return;
    }

    setRatingLoading(true);
    setRatingError(null);

    try {
      await submitRating(selectedJob.booking_id, {
        rating:      ratingValue,
        review_text: reviewText.trim() || undefined,
      });

      // Optimistically update local state so the card reflects the new rating
      setBookings(prev =>
          prev.map(b =>
              b.booking_id === selectedJob.booking_id
                  ? { ...b, rating: ratingValue, review_text: reviewText.trim() || undefined }
                  : b
          )
      );

      // Update selectedJob so the modal switches to read-only view immediately
      setSelectedJob(prev => prev
          ? { ...prev, rating: ratingValue, review_text: reviewText.trim() || undefined }
          : prev
      );
    } catch (e: any) {
      setRatingError(e?.response?.data?.detail ?? t('Failed to submit rating. Please try again.'));
    } finally {
      setRatingLoading(false);
    }
  };

  // ── Split bookings ──────────────────────────────────────────────────────────

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const finished = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const isCompleted  = selectedJob?.status === 'completed';
  const alreadyRated = (selectedJob?.rating ?? null) !== null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
      <LinearGradient colors={['#00D9FF', '#0056D2']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>

          {/* ── TOP BAR ── */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)')}>
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

          {/* LOADING */}
          {loading ? (
              <View style={styles.centred}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.centredText}>{t('Loading your bookings…')}</Text>
              </View>

              /* ERROR */
          ) : error ? (
              <View style={styles.centred}>
                <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.8)" />
                <Text style={styles.centredText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadBookings()}>
                  <Text style={styles.retryText}>{t('Try Again')}</Text>
                </TouchableOpacity>
              </View>

              /* MAIN CONTENT */
          ) : (
              <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scroll}
                  refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadBookings(true)}
                        tintColor="#fff"
                    />
                  }
              >
                {/* ── UPCOMING ── */}
                <SectionHeader title={t('UPCOMING')} />

                {upcoming.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyText}>{t('No upcoming bookings')}</Text>
                    </View>
                ) : (
                    upcoming.map((booking, idx) => {
                      const isFirst    = idx === 0;
                      const isExpanded = expandedId === booking.booking_id;

                      return (
                          <TouchableOpacity
                              key={booking.booking_id}
                              style={styles.card}
                              activeOpacity={isFirst ? 1 : 0.85}
                              onPress={() => !isFirst && setExpandedId(isExpanded ? null : booking.booking_id)}
                          >
                            <View style={styles.cardRow}>
                              <Avatar name={booking.provider_name} />
                              <View style={styles.cardInfo}>
                                <Text style={styles.cardName}>{booking.provider_name}</Text>
                                <Text style={styles.cardCategory}>{booking.category_name}</Text>
                                <Text style={styles.cardDesc} numberOfLines={2}>{booking.summary}</Text>
                              </View>
                              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[booking.status] ?? '#888' }]} />
                            </View>

                            <View style={styles.dateRow}>
                              <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
                              <Text style={styles.dateText}>{formatDateTime(booking.date, booking.time)}</Text>
                            </View>

                            {(isFirst || isExpanded) && (
                                <>
                                  <View style={styles.divider} />

                                  {booking.status === 'pending' ? (
                                      <TouchableOpacity
                                          style={styles.payBtn}
                                          onPress={() => router.push({
                                            pathname: '/Checkout',
                                            params: {
                                              bookingId:    booking.booking_id,
                                              providerName: booking.provider_name,
                                              date:         formatDateTime(booking.date, booking.time),
                                              summary:      booking.summary,
                                            },
                                          })}
                                      >
                                        <Text style={styles.payBtnText}>{t('PAY NOW')}</Text>
                                      </TouchableOpacity>
                                  ) : (
                                      <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => router.push({
                                              pathname: '/MapScreen',
                                              params: { bookingId: booking.booking_id },
                                            })}
                                        >
                                          <Text style={styles.actionText}>{t('SEE LOCATION')}</Text>
                                        </TouchableOpacity>
                                        <View style={styles.actionSep} />
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => router.push({
                                              pathname: '/ProviderProfile',
                                              params: { id: booking.provider_id },
                                            })}
                                        >
                                          <Text style={styles.actionText}>{t('VIEW PROVIDER')}</Text>
                                        </TouchableOpacity>
                                      </View>
                                  )}
                                </>
                            )}
                          </TouchableOpacity>
                      );
                    })
                )}

                {/* ── FINISHED ── */}
                <SectionHeader title={t('FINISHED')} style={{ marginTop: 10 }} />

                {finished.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyText}>{t('No finished bookings yet')}</Text>
                    </View>
                ) : (
                    finished.map(booking => (
                        <TouchableOpacity
                            key={booking.booking_id}
                            style={styles.card}
                            activeOpacity={0.8}
                            onPress={() => openJobModal(booking)}
                        >
                          <View style={styles.cardRow}>
                            <Avatar name={booking.provider_name} />
                            <View style={styles.cardInfo}>
                              <Text style={styles.cardName}>{booking.provider_name}</Text>
                              <Text style={styles.cardCategory}>{booking.category_name}</Text>
                              <Text style={styles.cardDesc} numberOfLines={1}>{booking.summary}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[booking.status] ?? '#888' }]} />
                              {/* Show mini stars if already rated */}
                              {booking.status === 'completed' && booking.rating != null && (
                                  <View style={{ flexDirection: 'row', gap: 1 }}>
                                    {[1,2,3,4,5].map(s => (
                                        <Ionicons
                                            key={s}
                                            name={s <= booking.rating! ? 'star' : 'star-outline'}
                                            size={10}
                                            color={s <= booking.rating! ? '#FFB800' : 'rgba(255,255,255,0.4)'}
                                        />
                                    ))}
                                  </View>
                              )}
                              {/* Prompt to rate if completed but unrated */}
                              {booking.status === 'completed' && booking.rating == null && (
                                  <Text style={styles.rateMeHint}>{t('Rate')}</Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.dateText}>{formatDateTime(booking.date, booking.time)}</Text>
                          </View>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 50 }} />
              </ScrollView>
          )}

          {/* ── FINISHED JOB DETAIL + RATING MODAL ── */}
          <Modal
              visible={modalVisible}
              transparent
              animationType="slide"
              onRequestClose={closeModal}
          >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHandle} />

                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <Avatar name={selectedJob?.provider_name ?? '?'} size={46} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.modalName}>{selectedJob?.provider_name}</Text>
                      <Text style={styles.modalCategory}>{selectedJob?.category_name}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                      <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalDivider} />

                  {/* Job details */}
                  <ModalRow label={t('Job Description')} value={selectedJob?.summary ?? '—'} />
                  <ModalRow
                      label={t('Date & Time')}
                      value={selectedJob ? formatDateTime(selectedJob.date, selectedJob.time) : '—'}
                  />
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{t('Status')}</Text>
                    <View style={[styles.statusBadge, {
                      backgroundColor: STATUS_COLORS[selectedJob?.status ?? ''] ?? '#888'
                    }]}>
                      <Text style={styles.statusText}>
                        {selectedJob?.status?.charAt(0).toUpperCase() + (selectedJob?.status?.slice(1) ?? '')}
                      </Text>
                    </View>
                  </View>

                  {/* ── RATING SECTION (only for completed jobs) ── */}
                  {isCompleted && (
                      <>
                        <View style={styles.modalDivider} />

                        {alreadyRated ? (
                            /* ── READ-ONLY: already rated ── */
                            <View style={styles.ratingSection}>
                              <Text style={styles.ratingSectionTitle}>{t('Your Rating')}</Text>
                              <StarRating value={selectedJob?.rating ?? 0} readonly size={28} />
                              {selectedJob?.review_text ? (
                                  <View style={styles.reviewBubble}>
                                    <Text style={styles.reviewBubbleText}>`{selectedJob.review_text}`</Text>
                                  </View>
                              ) : (
                                  <Text style={styles.noReviewText}>{t('No written review')}</Text>
                              )}
                            </View>
                        ) : (
                            /* ── INTERACTIVE: submit a rating ── */
                            <View style={styles.ratingSection}>
                              <Text style={styles.ratingSectionTitle}>{t('Rate this Job')}</Text>
                              <Text style={styles.ratingSubtitle}>{t('How did it go?')}</Text>

                              <StarRating
                                  value={ratingValue}
                                  onChange={v => { setRatingValue(v); setRatingError(null); }}
                                  size={38}
                              />

                              <TextInput
                                  style={styles.reviewInput}
                                  placeholder={t('Leave a review (optional)…')}
                                  placeholderTextColor="#bbb"
                                  value={reviewText}
                                  onChangeText={setReviewText}
                                  multiline
                                  maxLength={500}
                                  textAlignVertical="top"
                              />

                              {ratingError && (
                                  <Text style={styles.ratingError}>{ratingError}</Text>
                              )}

                              <TouchableOpacity
                                  style={[styles.submitRatingBtn, ratingLoading && { opacity: 0.7 }]}
                                  onPress={handleSubmitRating}
                                  disabled={ratingLoading}
                              >
                                {ratingLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.submitRatingText}>{t('SUBMIT RATING')}</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                        )}
                      </>
                  )}

                  <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
                    <Text style={styles.modalCloseBtnText}>{t('CLOSE')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

        </SafeAreaView>
      </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea:  { flex: 1 },
  scroll:    { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:      { color: 'white', fontSize: 30, fontWeight: '300', marginTop: -6 },
  languageToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  langLabel:       { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13, marginHorizontal: 3 },
  langLabelActive: { color: 'white' },
  langDivider:     { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
  switchStyle:     { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

  // Centred states
  centred:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  centredText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, textAlign: 'center' },
  retryBtn:    { backgroundColor: 'white', borderRadius: 25, paddingVertical: 10, paddingHorizontal: 28 },
  retryText:   { color: '#0072FF', fontWeight: '700', fontSize: 14 },

  // Section header
  sectionHeader: { alignItems: 'center', marginBottom: 14, marginTop: 8 },
  sectionTitle:  { color: 'white', fontWeight: '800', fontSize: 17, letterSpacing: 2, marginBottom: 8 },
  sectionLine:   { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Empty state
  emptyCard:  { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  emptyText:  { color: 'rgba(255,255,255,0.7)', fontSize: 14 },

  // Avatar
  avatar: { backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },

  // Cards
  card:         { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  cardRow:      { flexDirection: 'row', alignItems: 'center' },
  cardInfo:     { flex: 1 },
  cardName:     { color: 'white', fontWeight: '700', fontSize: 15, marginBottom: 1 },
  cardCategory: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 3 },
  cardDesc:     { color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 17 },
  statusDot:    { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  dateText:     { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  rateMeHint:   { color: '#FFE066', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginLeft: 4 },

  // Divider & actions
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 12 },
  actionRow:  { flexDirection: 'row', alignItems: 'center' },
  actionBtn:  { flex: 1, alignItems: 'center', paddingVertical: 2 },
  actionText: { color: 'white', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  actionSep:  { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.35)' },

  // Pay Now button
  payBtn:     { backgroundColor: 'white', borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  payBtnText: { color: '#0072FF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 24, paddingBottom: 36,
  },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16 },
  modalHeader:   { flexDirection: 'row', alignItems: 'center' },
  modalName:     { fontWeight: '700', fontSize: 17, color: '#1a1a1a' },
  modalCategory: { color: '#888', fontSize: 13, marginTop: 2 },
  closeBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:  { color: '#555', fontSize: 14, fontWeight: '700' },
  modalDivider:  { height: 1, backgroundColor: '#eee', marginVertical: 14 },
  modalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalLabel:    { color: '#888', fontSize: 13, fontWeight: '600', flex: 1 },
  modalValue:    { fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  statusBadge:   { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  statusText:    { color: 'white', fontWeight: '700', fontSize: 12 },
  modalCloseBtn: { marginTop: 12, backgroundColor: '#0072FF', borderRadius: 25, paddingVertical: 15, alignItems: 'center' },
  modalCloseBtnText: { color: 'white', fontWeight: '700', fontSize: 14, letterSpacing: 1 },

  // Rating section
  ratingSection: { alignItems: 'center', paddingVertical: 4, gap: 10 },
  ratingSectionTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', letterSpacing: 0.5 },
  ratingSubtitle:     { fontSize: 13, color: '#888', marginTop: -4 },

  reviewInput: {
    width: '100%', minHeight: 70, borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 14, padding: 12, fontSize: 13, color: '#1a1a1a',
    backgroundColor: '#fafafa', marginTop: 4,
  },
  ratingError: { color: '#FF3B30', fontSize: 12, fontWeight: '600', alignSelf: 'flex-start' },

  submitRatingBtn: {
    width: '100%', backgroundColor: '#FFB800',
    borderRadius: 25, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  submitRatingText: { color: 'white', fontWeight: '800', fontSize: 14, letterSpacing: 1 },

  // Already rated read-only view
  reviewBubble: {
    backgroundColor: '#f5f5f5', borderRadius: 14,
    padding: 12, width: '100%', marginTop: 4,
  },
  reviewBubbleText: { color: '#444', fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  noReviewText:     { color: '#bbb', fontSize: 13, fontStyle: 'italic' },
});

export default OrdersScreen;
