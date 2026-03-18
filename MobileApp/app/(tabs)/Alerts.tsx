import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {useRouter} from 'expo-router';
import { Switch } from 'react-native';



const { width } = Dimensions.get('window');

// Sample notifications data
const NOTIFICATIONS = [
  {
    id: 1,
    title: 'Booking Confirmed',
    message: 'Your booking with DJ Artist John has been confirmed for Dec 25, 2024',
    time: '2 hours ago',
    type: 'success',
    icon: '✅',
    read: false,
  },
  {
    id: 2,
    title: 'New Message',
    message: 'Event Planner Sarah sent you a message regarding your upcoming event',
    time: '5 hours ago',
    type: 'info',
    icon: '💬',
    read: false,
  },
  {
    id: 3,
    title: 'Payment Received',
    message: 'Payment of LKR 50,000 has been received successfully',
    time: '1 day ago',
    type: 'success',
    icon: '💰',
    read: true,
  },
  {
    id: 4,
    title: 'Booking Reminder',
    message: 'Your photography session is scheduled for tomorrow at 3:00 PM',
    time: '1 day ago',
    type: 'warning',
    icon: '⏰',
    read: true,
  },
  {
    id: 5,
    title: 'New Provider Available',
    message: 'A new LED Wall Provider has joined in your area',
    time: '2 days ago',
    type: 'info',
    icon: '🎉',
    read: true,
  },
  {
    id: 6,
    title: 'Review Request',
    message: 'Please rate your recent experience with Catering Service',
    time: '3 days ago',
    type: 'info',
    icon: '⭐',
    read: true,
  },
  {
    id: 7,
    title: 'Special Offer',
    message: 'Get 20% off on your next booking with our featured providers',
    time: '4 days ago',
    type: 'promo',
    icon: '🎁',
    read: true,
  },
{
    id: 8,
    title: 'New Provider Available',
    message: 'A new LED Wall Provider has joined in your area',
    time: '2 days ago',
    type: 'info',
    icon: '🎉',
    read: true,
  },
  {
    id: 9,
    title: 'Review Request',
    message: 'Please rate your recent experience with Catering Service',
    time: '3 days ago',
    type: 'info',
    icon: '⭐',
    read: true,
  },
  {
    id: 10,
    title: 'Special Offer',
    message: 'Get 20% off on your next booking with our featured providers',
    time: '4 days ago',
    type: 'promo',
    icon: '🎁',
    read: true,
  },
];

export default function Alerts() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Get color based on notification type
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'promo':
        return '#E37322';
      default:
        return '#0072FF';
    }
  };
const router = useRouter();
const [isSinhala, setIsSinhala] = useState(false);
const toggleLanguage = () => setIsSinhala(prev => !prev);

  return (
    <LinearGradient colors={['#00C6FF', '#0072FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Notifications</Text>

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

          {/* Separator */}
          <View style={styles.separator} />

          {/* Mark all read — below separator */}
          <TouchableOpacity
            style={styles.markAllReadBtn}
            onPress={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
          >
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              activeOpacity={0.8}
              onPress={() => markAsRead(notification.id)}
            >
              <BlurView intensity={30} experimentalBlurMethod="dimezisBlurView" tint="dark" style={styles.notificationCard}>



                {/* Unread indicator */}
                {!notification.read && (
                  <View
                    style={[
                      styles.unreadIndicator,
                      { backgroundColor: getTypeColor(notification.type) }
                    ]}
                  />
                )}

                {/* Content */}
                <View style={styles.cardContent}>
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{notification.icon}</Text>
                  </View>

                  {/* Text Content */}
                  <View style={styles.textContent}>
                    <View style={styles.titleRow}>
                      <Text style={[
                        styles.title,
                        !notification.read && styles.titleUnread
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.time}>{notification.time}</Text>
                    </View>

                    <Text style={styles.message} numberOfLines={2}>
                      {notification.message}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}

          {/* Empty space for bottom tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: 'white',
    position: 'absolute',
    left: 0,
    right: 100,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 10,
  },
  markAllReadBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  markAllRead: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
    opacity: 0.85,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  backArrow: { color: 'white', fontSize: 30, fontWeight: '300', marginTop: -6 },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 1,
  },
  langLabel:       { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13, marginHorizontal: 3 },
  langLabelActive: { color: 'white' },
  langDivider:     { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
  switchStyle:     { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 5,
  },

  // Notification Card
  notificationCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    //elevation: 3,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 10,
  },

  // Card Content
  cardContent: {
    flexDirection: 'row',
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },

  // Text Content
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
    marginRight: 10,
  },
  titleUnread: {
    fontWeight: '700',
    color: 'white',
  },
  time: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
  },
});