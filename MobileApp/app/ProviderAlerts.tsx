"use no memo";
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

// ─── Mock Data ────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'message',
    icon: '💬',
    title: 'New Message',
    message: 'Nimal Perera sent you a message: "Hi! Are you available tomorrow at 4 PM?"',
    time: '2 mins ago',
    read: false,
  },
  {
    id: '2',
    type: 'booking',
    icon: '✅',
    title: 'Booking Confirmed',
    message: 'Your booking with Rodrigo Silva for Fix Kitchen Plumbing has been confirmed for Dec 25, 2024.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'upcoming',
    icon: '⏰',
    title: 'Upcoming Job Reminder',
    message: 'You have a plumbing job at Galle Rd, Colombo-5 scheduled in 1 hour. Customer: Rodrigo.',
    time: '3 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'reschedule',
    icon: '↻',
    title: 'Job Rescheduled',
    message: 'Fernando Perera has requested to reschedule Fix Bathroom from Dec 20 to Dec 22, 2024.',
    time: '5 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'message',
    icon: '💬',
    title: 'New Message',
    message: 'Kasun Bandara sent you a message: "Can you come earlier? Around 10 AM?"',
    time: '1 day ago',
    read: true,
  },
  {
    id: '6',
    type: 'booking',
    icon: '✅',
    title: 'New Booking Request',
    message: 'Priya Jayawardena has requested a booking for Electrical Repair on Dec 28, 2024.',
    time: '1 day ago',
    read: true,
  },
  {
    id: '7',
    type: 'upcoming',
    icon: '⏰',
    title: 'Upcoming Job Reminder',
    message: 'Reminder: You have a job with Saman Kumara tomorrow at 10:00 AM at Private Ln, Nugegoda.',
    time: '2 days ago',
    read: true,
  },
  {
    id: '8',
    type: 'reschedule',
    icon: '↻',
    title: 'Reschedule Accepted',
    message: 'Amal Dissanayake has accepted the rescheduled time for Fix Bathroom on Dec 22, 2024.',
    time: '3 days ago',
    read: true,
  },
  {
    id: '9',
    type: 'booking',
    icon: '✅',
    title: 'Booking Completed',
    message: 'Your job with Ruwan Jayasuriya has been marked as completed. LKR 4,500 has been added.',
    time: '4 days ago',
    read: true,
  },
];

// ─── Type color map ───────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  message:   '#D96C06',
  booking:   '#28A745',
  upcoming:  '#00C6FF',
  reschedule:'#FF6B35',
};

// ─── Main Screen ──────────────────────────────────────────────────────
export default function ProviderAlertsScreen() {
  const router = useRouter();
  const [isSinhala, setIsSinhala] = useState(false);
  const toggleLanguage = () => setIsSinhala(prev => !prev);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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

        {/* ── HEADER ── */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.headerSub}>{unreadCount} unread</Text>
              )}
            </View>
          </View>
          <View style={styles.headerSeparator} />

          {/* Mark all read */}
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* ── NOTIFICATIONS LIST ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              activeOpacity={0.8}
              onPress={() => markAsRead(notif.id)}
            >
              <BlurView
                intensity={25}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={[styles.notifCard, notif.read && styles.notifCardRead]}
              >
                {/* Left color bar */}
                <View style={[styles.colorBar, { backgroundColor: TYPE_COLOR[notif.type] }]} />

                {/* Icon */}
                <View style={[styles.iconCircle, { borderColor: TYPE_COLOR[notif.type] }]}>
                  <Text style={styles.iconText}>{notif.icon}</Text>
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <Text style={[styles.notifTitle, notif.read && styles.notifTitleRead]}>
                      {notif.title}
                    </Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  <Text
                    style={[styles.notifMessage, notif.read && styles.notifMessageRead]}
                    numberOfLines={2}
                  >
                    {notif.message}
                  </Text>
                </View>

                {/* Unread dot */}
                {!notif.read && (
                  <View style={[styles.unreadDot, { backgroundColor: TYPE_COLOR[notif.type] }]} />
                )}
              </BlurView>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea:  { flex: 1 },

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
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: 'white', fontSize: 30, fontWeight: '300', marginTop: -2 },

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

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
  },
  headerSub: {
    color: '#D96C06',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  markAllBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  markAllText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Scroll
  scroll: { paddingHorizontal: 14, paddingTop: 4 },

  // Notification cards
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingRight: 14,
    paddingVertical: 14,
  },
  notifCardRead: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Left color bar
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 4,
    marginRight: 12,
    marginLeft: 0,
  },

  // Icon
  iconCircle: {
    width: 46, height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginRight: 12,
  },
  iconText: { fontSize: 20 },

  // Content
  notifContent:  { flex: 1 },
  notifTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle:    { color: 'white', fontWeight: '700', fontSize: 14, flex: 1, marginRight: 6 },
  notifTitleRead:{ color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  notifTime:     { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  notifMessage:  { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18 },
  notifMessageRead: { color: 'rgba(255,255,255,0.45)' },

  // Unread dot
  unreadDot: {
    width: 10, height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
});