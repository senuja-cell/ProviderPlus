
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Modal, Dimensions,
  Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRoleBack } from '../hooks/useBackNavigation';

const { width, height } = Dimensions.get('window');

// ─── Mock Data ────────────────────────────────────────────────────────
const UPCOMING_JOBS = [
  {
    id: '1',
    jobTitle: 'Fix Kitchen Plumbing',
    address: 'Galle Rd, Colombo-5',
    customerName: 'Rodrigo',
    category: 'Plumbing',
    minutesLeft: 59,
    alwaysExpanded: true,
  },
  {
    id: '2',
    jobTitle: 'Fix Bathroom',
    address: 'Private Ln, Embuldeniya, Nugegoda',
    customerName: 'Fernando',
    category: 'Plumbing',
    minutesLeft: 120,
    alwaysExpanded: false,
  },
];

const FINISHED_JOBS = [
  {
    id: '3',
    jobTitle: 'Fix Bathroom',
    address: 'Private Ln, Embuldeniya, Nugegoda',
    customerName: 'Fernando',
    jobDescription: 'Replaced all bathroom pipe joints and fixed the leaking tap.',
    amount: 'LKR 4,500',
    dateTime: '2025-06-10  ·  2:00 PM',
    rescheduled: false,
    category: 'Plumbing',
  },
  {
    id: '4',
    jobTitle: 'Fix Bathroom',
    address: 'Private Ln, Embuldeniya, Nugegoda',
    customerName: 'Fernando',
    jobDescription: 'Full bathroom renovation plumbing work completed.',
    amount: 'LKR 7,200',
    dateTime: '2025-06-08  ·  10:00 AM',
    rescheduled: true,
    category: 'Plumbing',
  },
  {
    id: '5',
    jobTitle: 'Fix Bathroom',
    address: 'Private Ln, Embuldeniya, Nugegoda',
    customerName: 'Fernando',
    jobDescription: 'Unclogged drain and resealed bathroom fixtures.',
    amount: 'LKR 3,000',
    dateTime: '2025-06-05  ·  4:00 PM',
    rescheduled: false,
    category: 'Plumbing',
  },
];

// ─── Icon Placeholder ─────────────────────────────────────────────────
function JobIcon({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.jobIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.42 }}>🔧</Text>
    </View>
  );
}

// ─── Animated Finished Card ───────────────────────────────────────────
function FinishedCard({ job, onPress }: { job: typeof FINISHED_JOBS[0]; onPress: () => void }) {
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
            <Text style={styles.cardTitle}>{job.jobTitle}</Text>
            <Text style={styles.cardAddress}>{job.address}</Text>
            <Text style={styles.cardCustomer}>Customer Name - {job.customerName}</Text>
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
  job: typeof FINISHED_JOBS[0] | null;
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
              <Text style={styles.modalTitle}>{job.jobTitle}</Text>
              <Text style={styles.modalCategory}>{job.category}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Details */}
          <ModalRow label="Customer" value={job.customerName} />
          <ModalRow label="Address" value={job.address} />
          <ModalRow label="Description" value={job.jobDescription} />
          <ModalRow label="Amount" value={job.amount} highlight />
          <ModalRow label="Date & Time" value={job.dateTime} />

          {/* Rescheduled */}
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Rescheduled</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: job.rescheduled ? '#FF6B35' : '#28A745' }
            ]}>
              <Text style={styles.statusText}>
                {job.rescheduled ? '↻  Yes' : '✓  No'}
              </Text>
            </View>
          </View>

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
  const [selectedJob, setSelectedJob] = useState<typeof FINISHED_JOBS[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Countdown
  const [mins, setMins] = useState(59);
  useEffect(() => {
    const t = setInterval(() => setMins(p => (p > 0 ? p - 1 : 0)), 60000);
    return () => clearInterval(t);
  }, []);

  const openModal = (job: typeof FINISHED_JOBS[0]) => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  return (
    <LinearGradient colors={['#1086b5', '#022373']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >

          {/* ── UPCOMING JOBS ── */}
          <SectionHeader title="UPCOMING JOBS" />

          {/* Card 1 — always expanded */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <JobIcon />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Fix Kitchen Plumbing</Text>
                <Text style={styles.cardAddress}>Galle Rd, Colombo-5</Text>
                <Text style={styles.cardCustomer}>Customer Name - Rodrigo</Text>
              </View>
              <View style={styles.timerBox}>
                <View style={styles.redDot} />
                <Text style={styles.timerNum}>{mins}</Text>
                <Text style={styles.timerLabel}>MINS</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              {/* ↓ connect navigation yourself */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/TrackCustomer')}
              >
                <Text style={styles.actionText}>CHECK LOCATION</Text>
              </TouchableOpacity>
              <View style={styles.actionSep} />
              {/* ↓ connect navigation yourself */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/CustomerProfile')}
              >
                <Text style={styles.actionText}>CONTACT USER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2 — tap to expand */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => setExpandedId(expandedId === '2' ? null : '2')}
          >
            <View style={styles.cardRow}>
              <JobIcon />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Fix Bathroom</Text>
                <Text style={styles.cardAddress}>Private Ln, Embuldeniya, Nugegoda</Text>
                <Text style={styles.cardCustomer}>Customer Name - Fernando</Text>
              </View>
              <View style={styles.greenDot} />
            </View>

            {expandedId === '2' && (
              <>
                <View style={styles.divider} />
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/TrackCustomer')}
                  >
                    <Text style={styles.actionText}>CHECK LOCATION</Text>
                  </TouchableOpacity>
                  <View style={styles.actionSep} />
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/CustomerProfile')}
                  >
                    <Text style={styles.actionText}>CONTACT USER</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* ── FINISHED ── */}
          <SectionHeader title="FINISHED" />

          {FINISHED_JOBS.map((job) => (
            <FinishedCard key={job.id} job={job} onPress={() => openModal(job)} />
          ))}

          {/* ── RESCHEDULED BUTTON ── */}
          {/* ↓ connect navigation yourself */}
          <TouchableOpacity
            style={styles.rescheduledBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/RescheduledJobs')}
          >
            <Text style={styles.rescheduledText}>Rescheduled Jobs</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* ── MODAL ── */}
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
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  actionRow:  { flexDirection: 'row', alignItems: 'center' },
  actionBtn:  { flex: 1, alignItems: 'center', paddingVertical: 2 },
  actionText: { color: 'white', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  actionSep:  { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' },

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
});
