import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Image, Text, View, Pressable, TextInput,
    StatusBar, Alert, ActivityIndicator, ScrollView,
    KeyboardAvoidingView, Platform, Switch, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { getUserProfile, updateUserProfile } from './services/userService';
import { useAuth } from './context/AuthContext';

export default function CustomerAccountEdit() {
    const [fullName, setFullName]   = useState('');
    const [mobile, setMobile]       = useState('');
    const [email, setEmail]         = useState('');
    const [birthday, setBirthday]   = useState('');
    const [gender, setGender]       = useState('');
    const [isSinhala, setIsSinhala] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const genderOptions = ['Male', 'Female', 'Prefer not to say'];

    const { signOut } = useAuth();

    // ── Load existing profile data when screen opens ──
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getUserProfile();
            setFullName(data.full_name ?? '');
            setMobile(data.phone_number ?? '');
            setEmail(data.email ?? '');
            setBirthday(data.birthday ?? '');
            setGender(data.gender ?? '');
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setIsFetching(false);
        }
    };

    // ── Save changes to backend ──
    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateUserProfile({
                full_name: fullName,
                phone_number: mobile,
                birthday: birthday,
                gender: gender,
            });
            Alert.alert(
                'Success',
                'Your profile has been updated!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    signOut();
                    router.replace('/(tabs)/UserLogin');
                }
            },
        ]);
    };

    if (isFetching) {
        return (
            <View style={styles.mainContainer}>
                <LinearGradient
                    colors={['#00ADF5', '#004eba']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color="#FFF" size="large" />
                    <Text style={{ color: '#FFF', marginTop: 12, fontSize: 14 }}>
                        Loading your profile...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#00ADF5', '#004eba']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* ── HEADER ── */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Text style={styles.backArrow}>‹</Text>
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>
                                {isSinhala ? 'ඔබේ පැතිකඩ' : 'Your Profile'}
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

                        {/* ── PROFILE PICTURE ── */}
                        <View style={styles.profilePicContainer}>
                            <BlurView intensity={25} tint="light" style={styles.profilePicWrapper}>
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png' }}
                                    style={styles.profilePic}
                                />
                                <TouchableOpacity style={styles.editPicButton}>
                                    <Text style={styles.editPicText}>📷</Text>
                                </TouchableOpacity>
                            </BlurView>
                            <Text style={styles.profilePicLabel}>
                                {isSinhala ? 'පැතිකඩ රූපය එකතු කරන්න' : 'Add profile picture'}
                            </Text>
                        </View>

                        {/* ── YOUR INFORMATION ── */}
                        <Text style={styles.sectionTitle}>
                            {isSinhala ? 'ඔබේ තොරතුරු' : 'Your information'}
                        </Text>

                        {/* Full Name */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{isSinhala ? 'සම්පූර්ණ නම' : 'Full Name'}</Text>
                            <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png' }} style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder={isSinhala ? 'සම්පූර්ණ නම' : 'Enter your full name'}
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    editable={!isLoading}
                                />
                            </BlurView>
                        </View>

                        {/* Mobile */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{isSinhala ? 'දුරකථන අංකය' : 'Mobile'}</Text>
                            <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/191.png' }} style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="07XXXXXXXX"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={mobile}
                                    onChangeText={setMobile}
                                    keyboardType="phone-pad"
                                    editable={!isLoading}
                                />
                            </BlurView>
                        </View>

                        {/* Email */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.fieldLabelRow}>
                                <Text style={styles.fieldLabel}>{isSinhala ? 'විද්‍යුත් තැපෑල' : 'E-mail'}</Text>
                                <Text style={styles.verifiedBadge}>✔ Verified</Text>
                            </View>
                            <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/732/732200.png' }} style={styles.fieldIcon} />
                                <TextInput
                                    style={[styles.textInput, styles.disabledInput]}
                                    value={email}
                                    editable={false}
                                />
                            </BlurView>
                        </View>

                        {/* Birthday */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{isSinhala ? 'උපන් දිනය' : 'Birthday'}</Text>
                            <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png' }} style={styles.fieldIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="DD / MM / YYYY"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={birthday}
                                    onChangeText={setBirthday}
                                    editable={!isLoading}
                                />
                            </BlurView>
                        </View>

                        {/* Gender */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{isSinhala ? 'ස්ත්‍රී පුරුෂ භාවය' : 'Gender'}</Text>
                            <TouchableOpacity onPress={() => setShowGenderPicker(!showGenderPicker)}>
                                <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.fieldIcon} />
                                    <Text style={[styles.textInput, !gender && { color: 'rgba(255,255,255,0.5)' }]}>
                                        {gender || (isSinhala ? 'ස්ත්‍රී පුරුෂ භාවය තෝරන්න' : 'Select your gender')}
                                    </Text>
                                    <Text style={styles.dropdownArrow}>▾</Text>
                                </BlurView>
                            </TouchableOpacity>

                            {showGenderPicker && (
                                <BlurView intensity={30} tint="light" style={styles.dropdownContainer}>
                                    {genderOptions.map(option => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.dropdownItem}
                                            onPress={() => { setGender(option); setShowGenderPicker(false); }}
                                        >
                                            <Text style={styles.dropdownItemText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </BlurView>
                            )}
                        </View>

                        {/* ── SAVE BUTTON ── */}
                        <Pressable
                            style={[styles.saveButton, isLoading && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" size="small" />
                            ) : (
                                <View style={styles.saveButtonInner}>
                                    <Text style={styles.saveButtonText}>
                                        {isSinhala ? 'සුරකින්න' : 'Save Changes'}
                                    </Text>
                                    <Text style={styles.saveArrow}>›</Text>
                                </View>
                            )}
                        </Pressable>

                        {/* ── LOGOUT BUTTON ── */}
                        <Pressable style={styles.logoutButton} onPress={handleLogout}>
                            <Text style={styles.logoutText}>
                                {isSinhala ? 'ඉවත් වන්න' : 'Logout'}
                            </Text>
                        </Pressable>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    safeArea:      { flex: 1, zIndex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 5 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 10, marginBottom: 20,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center', justifyContent: 'center',
        padding: 0,
    },
    backArrow:   { color: '#FFF', fontSize: 28, fontWeight: '300', lineHeight: 32 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 1 },

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

    // Profile Picture
    profilePicContainer: { alignItems: 'center', marginBottom: 24 },
    profilePicWrapper: {
        width: 90, height: 90, borderRadius: 45, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    },
    profilePic:      { width: 50, height: 50, tintColor: 'rgba(255,255,255,0.8)' },
    editPicButton:   { position: 'absolute', bottom: 6, right: 6 },
    editPicText:     { fontSize: 16 },
    profilePicLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 8 },

    // Section Title
    sectionTitle: {
        color: 'rgba(255,255,255,0.7)', fontSize: 13,
        fontWeight: '600', letterSpacing: 0.5, marginBottom: 12, marginTop: 4,
    },

    // Fields
    fieldContainer:  { marginBottom: 12 },
    fieldLabelRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    fieldLabel:      { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 4, marginLeft: 4 },
    verifiedBadge:   { color: '#4ADE80', fontSize: 12, fontWeight: '700' },

    // Input
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 25, height: 55,
        paddingHorizontal: 20,
        borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
    },
    textInput:     { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '500' },
    disabledInput: { color: 'rgba(255,255,255,0.6)' },
    fieldIcon:     { width: 20, height: 20, tintColor: 'rgba(255,255,255,0.7)', marginRight: 12 },
    dropdownArrow: { color: 'rgba(255,255,255,0.7)', fontSize: 18 },

    // Gender Dropdown
    dropdownContainer: {
        borderRadius: 16, overflow: 'hidden', marginTop: 4,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dropdownItem: {
        paddingVertical: 14, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    dropdownItemText: { color: '#FFF', fontSize: 15, fontWeight: '500' },

    // Save Button
    saveButton: {
        backgroundColor: '#FFF', borderRadius: 30, height: 60,
        justifyContent: 'center', alignItems: 'center',
        elevation: 5, marginTop: 20, marginBottom: 12,
    },
    saveButtonInner: { flexDirection: 'row', alignItems: 'center' },
    saveButtonText:  { color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
    saveArrow:       { color: '#000', fontSize: 24, fontWeight: '300', marginLeft: 8 },

    // Logout Button
    logoutButton: {
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
        borderRadius: 30, height: 56,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'transparent',
    },
    logoutText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});