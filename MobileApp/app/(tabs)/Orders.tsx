
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─── Mock Data (replace with your backend data later) ─────────────────
const FINISHED_JOBS = [
  {
    id: '3',
    providerName: 'Nimal Perera',
    jobDescription: 'Fixed kitchen plumbing system and replaced pipe joints.',
    amount: 'LKR 3,500',
    dateTime: '2025-06-10  ·  2:00 PM',
    rescheduled: false,
    category: 'Plumbing',
  },
  {
    id: '4',
    providerName: 'Saman Silva',
    jobDescription: 'Repaired electrical wiring in the living room.',
    amount: 'LKR 5,000',
    dateTime: '2025-06-08  ·  10:00 AM',
    rescheduled: true,
    category: 'Electrical',
  },
  {
    id: '5',
    providerName: 'Kasun Fernando',
    jobDescription: 'Full house deep cleaning service completed.',
    amount: 'LKR 2,800',
    dateTime: '2025-06-05  ·  4:00 PM',
    rescheduled: false,
    category: 'Cleaning',
  },
];

// ─── Avatar Placeholder ───────────────────────────────────────────────
function Avatar({ size = 52 }: { size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.45 }}>👤</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────
function OrdersScreen() {
  const router = useRouter();

  // Language toggle
  const [isSinhala, setIsSinhala] = useState(false);
  const toggleLanguage = () => setIsSinhala(prev => !prev);

  // Second upcoming card expand state
  const [secondExpanded, setSecondExpanded] = useState(false);

  // Countdown timer for first job
  const [mins, setMins] = useState(59);
  useEffect(() => {
    const t = setInterval(() => setMins(p => (p > 0 ? p - 1 : 0)), 60000);
    return () => clearInterval(t);
  }, []);

  // Finished job modal
  const [selectedJob, setSelectedJob] = useState<(typeof FINISHED_JOBS)[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (job: (typeof FINISHED_JOBS)[0]) => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  return (
    <LinearGradient colors={['#00C6FF', '#0072FF']} style={styles.container}>
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

          {/* ── UPCOMING SECTION ── */}
          <SectionHeader title="UPCOMING" />

          {/* Card 1 — always expanded */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Avatar />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>Nimal Sahan</Text>
                <Text style={styles.cardDesc}>Arriving to fix the kitchen plumbing system</Text>
              </View>
              {/* Timer */}
              <View style={styles.timerBox}>
                <View style={styles.redDot} />
                <Text style={styles.timerNum}>{mins}</Text>
                <Text style={styles.timerLabel}>MINS</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/TrackProvider')}
              >
                <Text style={styles.actionText}>CHECK LOCATION</Text>
              </TouchableOpacity>
              <View style={styles.actionSep} />

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/ProviderProfile')}
              >
                <Text style={styles.actionText}>CONTACT PROVIDER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2 — tap to expand */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => setSecondExpanded(p => !p)}
          >
            <View style={styles.cardRow}>
              <Avatar />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>Nimal</Text>
                <Text style={styles.cardDesc}>Arriving for the House wiring</Text>
              </View>
              {/* Green badge */}
              <View style={styles.greenBadge}>
                <Text style={styles.greenBadgeText}></Text>
              </View>
            </View>

            {secondExpanded && (
              <>
                <View style={styles.divider} />
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/TrackProvider')}
                  >
                    <Text style={styles.actionText}>CHECK LOCATION</Text>
                  </TouchableOpacity>
                  <View style={styles.actionSep} />
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/ProviderProfile')}
                  >
                    <Text style={styles.actionText}>CONTACT PROVIDER</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* ── FINISHED SECTION ── */}
          <SectionHeader title="FINISHED" style={{ marginTop: 10 }} />

          {FINISHED_JOBS.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => openModal(job)}
            >
              <View style={styles.cardRow}>
                <Avatar />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{job.providerName}</Text>
                  <Text style={styles.cardDesc}>{job.jobDescription}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* ── RESCHEDULED BUTTON ── */}
          <TouchableOpacity
            style={styles.rescheduledBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/RescheduledJobs')}
          >
            <Text style={styles.rescheduledText}>Rescheduled Jobs</Text>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>

        {/* ── FINISHED JOB MODAL ── */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>

              {/* Modal handle */}
              <View style={styles.modalHandle} />

              {/* Provider header */}
              <View style={styles.modalHeader}>
                <Avatar size={58} />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={styles.modalName}>{selectedJob?.providerName}</Text>
                  <Text style={styles.modalCategory}>{selectedJob?.category}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              {/* Details */}
              <ModalRow label="Job Description" value={selectedJob?.jobDescription ?? ''} />
              <ModalRow label="Amount" value={selectedJob?.amount ?? ''} valueColor="#0072FF" />
              <ModalRow label="Date & Time" value={selectedJob?.dateTime ?? ''} />

              {/* Rescheduled */}
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Rescheduled</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: selectedJob?.rescheduled ? '#FF6B35' : '#28A745' }
                ]}>
                  <Text style={styles.statusText}>
                    {selectedJob?.rescheduled ? '↻  Yes' : '✓  No'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>CLOSE</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Small helper components ──────────────────────────────────────────
function SectionHeader({ title, style }: { title: string; style?: object }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function ModalRow({
  label, value, valueColor = '#1a1a1a',
}: {
  label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.modalRow}>
      <Text style={styles.modalLabel}>{label}</Text>
      <Text style={[styles.modalValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea:  { flex: 1 },
  scroll:    { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
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
  sectionHeader: { alignItems: 'center', marginBottom: 14, marginTop: 8 },
  sectionTitle:  { color: 'white', fontWeight: '800', fontSize: 17, letterSpacing: 2, marginBottom: 8 },
  sectionLine:   { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Avatar
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardRow:  { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { color: 'white', fontWeight: '700', fontSize: 15, marginBottom: 3 },
  cardDesc: { color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 17 },

  // Timer
  timerBox:   { alignItems: 'center', marginLeft: 8, position: 'relative' },
  timerNum:   { color: 'white', fontWeight: '800', fontSize: 30, lineHeight: 36 },
  timerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  redDot: {
    position: 'absolute',
    top: -10, right: -4,
    width: 11, height: 11,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },

  // Green notification badge
  greenBadge: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: '#28A745',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  greenBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },

  // Divider & actions
  divider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  actionText:{ color: 'white', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  actionSep: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.35)' },

  // Rescheduled button
  rescheduledBtn: {
    alignSelf: 'center',
    marginTop: 22,
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  rescheduledText: { color: '#0072FF', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader:   { flexDirection: 'row', alignItems: 'center' },
  modalName:     { fontWeight: '700', fontSize: 17, color: '#1a1a1a' },
  modalCategory: { color: '#888', fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#555', fontSize: 14, fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: '#eee', marginVertical: 14 },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalLabel: { color: '#888', fontSize: 13, fontWeight: '600', flex: 1 },
  modalValue: { fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: { color: 'white', fontWeight: '700', fontSize: 12 },
  modalCloseBtn: {
    marginTop: 8,
    backgroundColor: '#0072FF',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalCloseBtnText: { color: 'white', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
});

export default OrdersScreen;