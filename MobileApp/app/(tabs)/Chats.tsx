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

import{ fetchProviderConversations, ChatConversation } from '../services/messagingService';
import {ActivityIndicator} from 'react-native';
import {useEffect} from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

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
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [manuallyRead, setManuallyRead] = useState<Set<string>>(new Set());

 useEffect(() => {
   const loadConversations = async () => {
     try {
       const data = await fetchProviderConversations();
       setChats(data);
     } catch (error) {
       console.error('Failed to load Conversation:', error);
     } finally {
       setLoading(false);
     }
   };
   loadConversations();
 }, []);

 // Poll silently in background — only updates if data changed
 // Does NOT show loading spinner so screen feels instant
 useEffect(() => {
   const interval = setInterval(async () => {
     try {
       const data = await fetchProviderConversations();
       setChats(prev => data.map((chat: ChatConversation) => {
         // If provider manually opened this chat, keep it at 0
         if (manuallyRead.has(chat.id)) {
           return { ...chat, unread_count: 0 };
         }
         return chat;
       }));
     } catch (error) {
       // silent fail
     }
   }, 5000);

   return () => clearInterval(interval);
 }, [manuallyRead]);

const handleChatPress = (chatId: string, customerName: string) => {
  setManuallyRead(prev => new Set([...prev, chatId]));
  setChats(prev =>
    prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c)
  );
  router.push({ pathname: '/Chat', params: { conversationId: chatId, providerName: customerName } });
};

  return (
    <LinearGradient colors={['#1086b5', '#022373']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* ── TOP BAR ── */}
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
          {loading ? (
            <ActivityIndicator color="white" style={{ marginTop: 40 }} />
          ) : (
            chats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={[styles.chatCard, chat.unread_count > 0 && styles.chatCardUnread]}
                activeOpacity={0.75}
                onPress={() => handleChatPress(chat.id, chat.customer_name ?? 'Unknown Customer')}
              >
                <View style={styles.avatarWrapper}>
                  <Avatar name={chat.customer_name ?? 'Unknown'} />
                </View>

                <View style={styles.chatInfo}>
                  <View style={styles.chatTopRow}>
                    <Text style={[styles.chatName, chat.unread_count > 0 && styles.chatNameUnread]}>
                      {chat.customer_name ?? 'Unknown Customer'}
                    </Text>
                    <Text style={styles.chatTime}>
                      {chat.last_message_at
                        ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.chatBottomRow}>
                    <Text
                      style={[styles.chatLastMsg, chat.unread_count > 0 && styles.chatLastMsgUnread]}
                      numberOfLines={1}
                    >
                      {chat.last_message_preview ?? 'No messages yet'}
                    </Text>
                    {chat.unread_count > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{chat.unread_count}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

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
