import React, { useState } from 'react';
import {
    StyleSheet, Image, Text, View,
    ScrollView, TouchableOpacity, StatusBar, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

// ── Mock Data (replace with real data from AuthContext / API) ──────────────
const MOCK_USER = {
    name: 'Senuja Ranmith',
    email: 'senujaranmith3169@gmail.com',
    totalBookings: 12,
    profileImage: null as string | null,
};

const MOCK_BOOKINGS = [
    { id: '1', service: 'Plumbing',    provider: 'Nimal Chandra',  date: 'Mar 15, 2026', status: 'Completed', statusColor: '#4ADE80' },
    { id: '2', service: 'Electrician', provider: 'Kamal Perera',   date: 'Mar 10, 2026', status: 'Completed', statusColor: '#4ADE80' },
    { id: '3', service: 'Photography', provider: 'Dilani Silva',   date: 'Mar 20, 2026', status: 'Upcoming',  statusColor: '#FBBF24' },
    { id: '4', service: 'Catering',    provider: 'Priya Fernando', date: 'Feb 28, 2026', status: 'Cancelled', statusColor: '#F87171' },
];

const SETTINGS_ITEMS = [
    { id: '1', icon: '✏️', label: 'Edit Profile',       labelSi: 'පැතිකඩ සංස්කරණය', route: '/CustomerAccountEdit' },
    { id: '2', icon: '🔔', label: 'Notifications',      labelSi: 'දැනුම්දීම්',         route: null },
    { id: '3', icon: '🔒', label: 'Privacy & Security', labelSi: 'පෞද්ගලිකත්වය',       route: null },
    { id: '4', icon: '❓', label: 'Help & Support',     labelSi: 'උදවු සහ සහාය',       route: null },
    { id: '5', icon: 'ℹ️', label: 'About Provider+',    labelSi: 'Provider+ ගැන',       route: null },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerProfile() {
    const [isSinhala, setIsSinhala] = useState(false);

    const handleLogout = () => router.replace('/(tabs)/UserLogin');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#00ADF5', '#004eba']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ── HEADER ── */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {isSinhala ? 'ගිණුම' : 'Account'}
                        </Text>
                        <View style={styles.languageToggle}>
                            <Text style={[styles.langLabel, !isSinhala && styles.langLabelActive]}>ENG</Text>
                            <Text style={styles.langDivider}>|</Text>
                            <Text style={[styles.langLabel, isSinhala && styles.langLabelActive]}>සිං</Text>
                            <Switch
                                value={isSinhala}
                                onValueChange={() => setIsSinhala(p => !p)}
                                trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#FF6B35' }}
                                thumbColor={isSinhala ? '#fff' : '#f0f0f0'}
                                ios_backgroundColor="rgba(255,255,255,0.3)"
                                style={styles.switchStyle}
                            />
                        </View>
                    </View>

                    {/* ── PROFILE HERO CARD ── */}
                    <BlurView intensity={25} tint="light" style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            {MOCK_USER.profileImage ? (
                                <Image source={{ uri: MOCK_USER.profileImage }} style={styles.avatar} />
                            ) : (
                                <LinearGradient colors={['#00ADF5', '#0072FF']} style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitial}>
                                        {MOCK_USER.name.charAt(0).toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}
                            <TouchableOpacity
                                style={styles.editAvatarBtn}
                                onPress={() => router.push('/CustomerAccountEdit' as any)}
                            >
                                <Text style={styles.editAvatarIcon}>✏️</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{MOCK_USER.name}</Text>
                        <Text style={styles.userEmail}>{MOCK_USER.email}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{MOCK_USER.totalBookings}</Text>
                                <Text style={styles.statLabel}>{isSinhala ? 'වෙන්කිරීම්' : 'Bookings'}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>⭐ 4.8</Text>
                                <Text style={styles.statLabel}>{isSinhala ? 'ශ්‍රේණිය' : 'Avg Rating'}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>2025</Text>
                                <Text style={styles.statLabel}>{isSinhala ? 'සාමාජිකත්වය' : 'Member Since'}</Text>
                            </View>
                        </View>
                    </BlurView>

                    {/* ── BOOKING HISTORY ── */}
                    <Text style={styles.sectionTitle}>
                        {isSinhala ? 'වෙන්කිරීම් ඉතිහාසය' : 'Booking History'}
                    </Text>

                    <BlurView intensity={20} tint="light" style={styles.card}>
                        {MOCK_BOOKINGS.map((booking, index) => (
                            <View key={booking.id}>
                                <View style={styles.bookingRow}>
                                    <View style={styles.bookingIconContainer}>
                                        <Text style={styles.bookingIcon}>🔧</Text>
                                    </View>
                                    <View style={styles.bookingInfo}>
                                        <Text style={styles.bookingService}>{booking.service}</Text>
                                        <Text style={styles.bookingProvider}>{booking.provider}</Text>
                                        <Text style={styles.bookingDate}>{booking.date}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { borderColor: booking.statusColor }]}>
                                        <Text style={[styles.statusText, { color: booking.statusColor }]}>
                                            {booking.status}
                                        </Text>
                                    </View>
                                </View>
                                {index < MOCK_BOOKINGS.length - 1 && <View style={styles.bookingDivider} />}
                            </View>
                        ))}
                        <TouchableOpacity style={styles.viewAllBtn}>
                            <Text style={styles.viewAllText}>
                                {isSinhala ? 'සියල්ල බලන්න' : 'View All Bookings'} →
                            </Text>
                        </TouchableOpacity>
                    </BlurView>

                    {/* ── SETTINGS ── */}
                    <Text style={styles.sectionTitle}>
                        {isSinhala ? 'සැකසුම්' : 'Settings'}
                    </Text>

                    <BlurView intensity={20} tint="light" style={styles.card}>
                        {SETTINGS_ITEMS.map((item, index) => (
                            <View key={item.id}>
                                <TouchableOpacity
                                    style={styles.settingRow}
                                    onPress={() => item.route && router.push(item.route as any)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.settingIcon}>{item.icon}</Text>
                                    <Text style={styles.settingLabel}>
                                        {isSinhala ? item.labelSi : item.label}
                                    </Text>
                                    <Text style={styles.settingArrow}>›</Text>
                                </TouchableOpacity>
                                {index < SETTINGS_ITEMS.length - 1 && <View style={styles.bookingDivider} />}
                            </View>
                        ))}
                    </BlurView>

                    {/* ── LOGOUT ── */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>
                            {isSinhala ? 'ඉවත් වන්න' : 'Logout'}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:     { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20, marginTop: 6,
    },
    headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },

    // Language Toggle
    languageToggle: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    langLabel:       { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13, marginHorizontal: 3 },
    langLabelActive: { color: '#FFF' },
    langDivider:     { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
    switchStyle:     { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },

    // Profile Card
    profileCard: {
        borderRadius: 24, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', paddingVertical: 28,
        paddingHorizontal: 20, marginBottom: 24,
    },
    avatarContainer:   { position: 'relative', marginBottom: 12 },
    avatar:            { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder: {
        width: 90, height: 90, borderRadius: 45,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarInitial:  { color: '#FFF', fontSize: 36, fontWeight: '900' },
    editAvatarBtn: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12, width: 26, height: 26,
        alignItems: 'center', justifyContent: 'center',
    },
    editAvatarIcon: { fontSize: 13 },
    userName:       { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 4 },
    userEmail:      { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 20 },

    // Stats
    statsRow:    { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
    statItem:    { alignItems: 'center' },
    statNumber:  { color: '#FFF', fontSize: 18, fontWeight: '800' },
    statLabel:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: 36 },

    // Section Title
    sectionTitle: {
        color: 'rgba(255,255,255,0.85)', fontSize: 15,
        fontWeight: '700', letterSpacing: 0.5,
        marginBottom: 10, marginLeft: 4,
    },

    // Card
    card: {
        borderRadius: 20, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 24, paddingHorizontal: 16, paddingVertical: 8,
    },

    // Booking
    bookingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    bookingIconContainer: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    bookingIcon:     { fontSize: 18 },
    bookingInfo:     { flex: 1 },
    bookingService:  { color: '#FFF', fontSize: 15, fontWeight: '700' },
    bookingProvider: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
    bookingDate:     { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 },
    statusBadge:     { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    statusText:      { fontSize: 11, fontWeight: '700' },
    bookingDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
    viewAllBtn:      { alignItems: 'center', paddingVertical: 14 },
    viewAllText:     { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

    // Settings
    settingRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    settingIcon:  { fontSize: 20, marginRight: 14 },
    settingLabel: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
    settingArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 22 },

    // Logout
    logoutButton: {
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
        borderRadius: 30, height: 56,
        justifyContent: 'center', alignItems: 'center',
    },
    logoutText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
