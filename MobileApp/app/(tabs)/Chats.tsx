import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRoleBack } from '../hooks/useBackNavigation';
const { width } = Dimensions.get('window');

// ─── Mock Data ────────────────────────────────────────────────────────
const MOCK_CHATS = [
  {
    id: '1',
    customerName: 'Nimal Perera',
    lastMessage: 'Hi! Nimal Are You Available Tomorrow At 4 PM?',
    time: '2:45 PM',
    unread: true,
    unreadCount: 1,
  },
  {
    id: '2',
    customerName: 'Rodrigo Silva',
    lastMessage: 'Can you come earlier? Around 10 AM?',
    time: '1:30 PM',
    unread: true,
    unreadCount: 3,
  },
  {
    id: '3',
    customerName: 'Fernando Perera',
    lastMessage: 'Thank you! The plumbing is working fine now.',
    time: '11:00 AM',
    unread: false,
    unreadCount: 0,
  },
  {
    id: '4',
    customerName: 'Kasun Bandara',
    lastMessage: 'Hi! Nimal Are You Available Tomorrow At 4 PM?',
    time: 'Yesterday',
    unread: true,
    unreadCount: 2,
  },
  {
    id: '5',
    customerName: 'Saman Kumara',
    lastMessage: 'Hi! Nimal Are You Available Tomorrow At 4 PM?',
    time: 'Yesterday',
    unread: false,
    unreadCount: 0,
  },
  {
    id: '6',
    customerName: 'Priya Jayawardena',
    lastMessage: 'Hi! Nimal Are You Available Tomorrow At 4 PM?',
    time: 'Mon',
    unread: true,
    unreadCount: 1,
  },
  {
    id: '7',
    customerName: 'Amal Dissanayake',
    lastMessage: 'Please confirm the booking.',
    time: 'Mon',
    unread: false,
    unreadCount: 0,
  },
  {
    id: '8',
    customerName: 'Ruwan Jayasuriya',
    lastMessage: 'Hi! Nimal Are You Available Tomorrow At 4 PM?',
    time: 'Sun',
    unread: false,
    unreadCount: 0,
  },
{
    id: '9',
    customerName: 'Sandun Welivita',
    lastMessage: 'Are You Available Tomorrow At 4 PM?',
    time: 'Sun',
    unread: false,
    unreadCount: 0,
  },
];

// ─── Avatar ───────────────────────────────────────────────────────────
function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────
export default function ProviderChatsScreen() {
  useRoleBack();
  const router = useRouter();
  const [isSinhala, setIsSinhala] = useState(false);
  const toggleLanguage = () => setIsSinhala(prev => !prev);
  const [chats, setChats] = useState(MOCK_CHATS);

  const handleChatPress = (chatId: string) => {
    // Mark as read when tapped
    setChats(prev =>
      prev.map(c => c.id === chatId ? { ...c, unread: false, unreadCount: 0 } : c)
    );
    // ↓ Connect navigation yourself — pass chatId to your chat screen
    router.push({ pathname: '/ChatRoom', params: { chatId } });
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

        {/* ── HEADER ── */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.headerSeparator} />
        </View>

        {/* ── CHAT LIST ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={[styles.chatCard, chat.unread && styles.chatCardUnread]}
              activeOpacity={0.75}
              onPress={() => handleChatPress(chat.id)}
            >
              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                <Avatar name={chat.customerName} />
              </View>

              {/* Text content */}
              <View style={styles.chatInfo}>
                <View style={styles.chatTopRow}>
                  <Text style={[styles.chatName, chat.unread && styles.chatNameUnread]}>
                    {chat.customerName}
                  </Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <View style={styles.chatBottomRow}>
                  <Text
                    style={[styles.chatLastMsg, chat.unread && styles.chatLastMsgUnread]}
                    numberOfLines={1}
                  >
                    {chat.lastMessage}
                  </Text>

                  {/* Unread dot */}
                  {chat.unread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
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

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginTop: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 12,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Scroll
  scroll: { paddingHorizontal: 14, paddingTop: 12 },

  // Chat cards
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chatCardUnread: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // Avatar
  avatarWrapper: { marginRight: 14 },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '700',
  },

  // Chat info
  chatInfo:     { flex: 1 },
  chatTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatBottomRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName:     { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 15 },
  chatNameUnread: { color: 'white', fontWeight: '800' },
  chatTime:     { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  chatLastMsg:  { color: 'rgba(255,255,255,0.55)', fontSize: 13, flex: 1, marginRight: 8 },
  chatLastMsgUnread: { color: 'rgba(255,255,255,0.8)' },

  // Unread badge
  unreadBadge: {
    backgroundColor: '#D96C06',
    width: 22, height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: { color: 'white', fontSize: 11, fontWeight: '800' },
});
