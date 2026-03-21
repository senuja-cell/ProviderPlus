import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View,
    ScrollView, TouchableOpacity, StatusBar, Switch, Image,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import { getUserProfile } from '../services/userService';

const SETTINGS_ITEMS = [
    { id: '1', icon: '✏️', label: 'Edit Profile',    labelSi: 'පැතිකඩ සංස්කරණය', route: '/CustomerAccountEdit' },
    { id: '2', icon: '📍', label: 'Saved Addresses', labelSi: 'සුරකින ලද ලිපින',   route: null },
    { id: '3', icon: '💳', label: 'Payment',         labelSi: 'ගෙවීම',              route: null },
    { id: '4', icon: '🔔', label: 'Notifications',   labelSi: 'දැනුම්දීම්',         route: null },
    { id: '5', icon: '❓', label: 'Help & Support',  labelSi: 'උදවු සහ සහාය',       route: null },
    { id: '6', icon: 'ℹ️', label: 'About Provider+', labelSi: 'Provider+ ගැන',       route: null },
];

export default function CustomerProfile() {
    const [isSinhala, setIsSinhala] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{
        full_name: string;
        email: string;
        phone_number?: string;
        birthday?: string;
        gender?: string;
        role: string;
    } | null>(null);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const data = await getUserProfile();
            setUser(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load on mount
    useEffect(() => {
        loadProfile();
    }, []);

    // Reload every time screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadProfile();
        }, [])
    );

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

                    {/* ── PROFILE CARD ── */}
                    <BlurView intensity={25} tint="light" style={styles.profileCard}>
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" size="large" style={{ padding: 20 }} />
                        ) : (
                            <>
                                <View style={styles.avatarContainer}>
                                    <LinearGradient colors={['#00ADF5', '#0072FF']} style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarInitial}>
                                            {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
                                        </Text>
                                    </LinearGradient>
                                    <TouchableOpacity
                                        style={styles.editAvatarBtn}
                                        onPress={() => router.push('/CustomerAccountEdit' as any)}
                                    >
                                        <Text style={styles.editAvatarIcon}>✏️</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.userName}>{user?.full_name ?? 'User'}</Text>
                                <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
                                {user?.phone_number && (
                                    <Text style={styles.userPhone}>{user.phone_number}</Text>
                                )}
                            </>
                        )}
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
                                {index < SETTINGS_ITEMS.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </BlurView>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

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
    avatarContainer: { position: 'relative', marginBottom: 12 },
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
    userEmail:      { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    userPhone:      { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },

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

    // Settings
    settingRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    settingIcon:  { fontSize: 20, marginRight: 14 },
    settingLabel: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
    settingArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 22 },
    divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
});