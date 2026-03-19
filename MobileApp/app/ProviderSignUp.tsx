import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, TextInput, Pressable,
    StatusBar, Alert, ActivityIndicator, ScrollView,
    KeyboardAvoidingView, Platform, Image, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_PICKER_RESULT_KEY } from './LocationPicker';
import * as ImagePicker from 'expo-image-picker';
import { signupProvider, uploadProfileImage } from './services/providerAuthService';
import { fetchAllCategories, Category } from './services/categoryService';
import { useLanguage } from './context/LanguageContext'; // ✅ ADDED

const ProviderSignUp: React.FC = () => {
    const [name, setName]               = useState('');
    const [email, setEmail]             = useState('');
    const [phone, setPhone]             = useState('');
    const [password, setPassword]       = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId]   = useState('');

    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationAddress, setLocationAddress] = useState<string>('');
    const [tags, setTags] = useState<string[]>(['', '']);
    const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

    const [showPassword, setShowPassword]         = useState(false);
    const [showConfirmPass, setShowConfirmPass]   = useState(false);
    const [showCategoryList, setShowCategoryList] = useState(false);
    const [categories, setCategories]             = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading]               = useState(false);
    const [loadingCats, setLoadingCats]           = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ✅ ADDED — get from context
    const { t } = useLanguage();

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const raw = await AsyncStorage.getItem(LOCATION_PICKER_RESULT_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as {
                        latitude: number; longitude: number; address: string;
                    };
                    setLocation({ latitude: parsed.latitude, longitude: parsed.longitude });
                    setLocationAddress(parsed.address);
                    setErrors(e => ({ ...e, location: '' }));
                    await AsyncStorage.removeItem(LOCATION_PICKER_RESULT_KEY);
                }
            })();
        }, [])
    );

    useEffect(() => {
        fetchAllCategories()
            .then(setCategories)
            .catch(() => Alert.alert('Error', 'Could not load service categories.'))
            .finally(() => setLoadingCats(false));
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo library access to upload a profile picture.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setProfileImageUri(result.assets[0].uri);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{7,15}$/;

        if (!name.trim())                        newErrors.name = 'Full name is required';
        if (!email.trim())                       newErrors.email = 'Email is required';
        else if (!emailRegex.test(email))        newErrors.email = 'Invalid email format';
        if (!phone.trim())                       newErrors.phone = 'Phone number is required';
        else if (!phoneRegex.test(phone.trim())) newErrors.phone = 'Enter a valid phone number';
        if (!password)                           newErrors.password = 'Password is required';
        else if (password.length < 8)            newErrors.password = 'Minimum 8 characters';
        if (confirmPass !== password)            newErrors.confirmPass = 'Passwords do not match';
        if (!categoryId)                         newErrors.category = 'Please select a service category';
        if (!description.trim())                 newErrors.description = 'Please add a short description';
        else if (description.trim().length < 20) newErrors.description = 'Description too short (min 20 characters)';
        if (!location)                           newErrors.location = 'Please set your business location';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', name.trim());
            fd.append('email', email.trim().toLowerCase());
            fd.append('phone_number', phone.trim());
            fd.append('password', password);
            fd.append('category_id', categoryId);
            fd.append('description', description.trim());
            if (location) {
                fd.append('latitude', String(location.latitude));
                fd.append('longitude', String(location.longitude));
            }
            const filteredTags = tags.filter(tag => tag.trim().length > 0);
            filteredTags.forEach(tag => fd.append('tags', tag.trim()));

            const { access_token, provider_id } = await signupProvider(fd);

            if (profileImageUri) {
                try {
                    await uploadProfileImage(access_token, profileImageUri);
                } catch {
                    console.warn('Profile image upload failed — user can retry from profile');
                }
            }

            Alert.alert(
                'Account Created!',
                'Your provider account is set up. You can upload your business documents and portfolio from your profile to get verified.',
                [{ text: 'Go to Login', onPress: () => router.replace('/UserLogin') }]
            );
        } catch (error: any) {
            const msg = error?.response?.data?.detail ?? error.message ?? 'Registration failed. Please try again.';
            Alert.alert('Sign Up Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const err = (field: string) =>
        errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null;

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#1086b5', '#022373']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Back button */}
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>

                        {/* ✅ Title */}
                        <Text style={styles.title}>{t('Provider Sign Up')}</Text>
                        <Text style={styles.subtitle}>{t('Create your service provider account')}</Text>

                        {/* Profile image picker */}
                        <View style={styles.avatarSection}>
                            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                                {profileImageUri ? (
                                    <Image source={{ uri: profileImageUri }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.8)" />
                                    </View>
                                )}
                                <View style={styles.avatarEditBadge}>
                                    <Ionicons name="pencil" size={12} color="#fff" />
                                </View>
                            </TouchableOpacity>
                            {/* ✅ */}
                            <Text style={styles.avatarHint}>
                                {profileImageUri ? t('Tap to change photo') : t('Add profile photo (optional)')}
                            </Text>
                            {profileImageUri && (
                                <TouchableOpacity onPress={() => setProfileImageUri(null)}>
                                    <Text style={styles.removePhotoText}>{t('Remove')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Full Name */}
                        <Text style={styles.fieldLabel}>{t('Full Name')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('Your full name')}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {err('name')}

                        {/* Email */}
                        <Text style={styles.fieldLabel}>{t('Email')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="you@example.com"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {err('email')}

                        {/* Phone */}
                        <Text style={styles.fieldLabel}>{t('Phone Number')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="0771234567"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {err('phone')}

                        {/* Password */}
                        <Text style={styles.fieldLabel}>{t('Password')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('Min. 8 characters')}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                editable={!isLoading}
                            />
                            <Pressable onPress={() => setShowPassword(v => !v)}>
                                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255,255,255,0.7)" />
                            </Pressable>
                        </BlurView>
                        {err('password')}

                        {/* Confirm Password */}
                        <Text style={styles.fieldLabel}>{t('Confirm Password')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('Repeat password')}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                secureTextEntry={!showConfirmPass}
                                value={confirmPass}
                                onChangeText={setConfirmPass}
                                editable={!isLoading}
                            />
                            <Pressable onPress={() => setShowConfirmPass(v => !v)}>
                                <Ionicons name={showConfirmPass ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255,255,255,0.7)" />
                            </Pressable>
                        </BlurView>
                        {err('confirmPass')}

                        {/* Service Category */}
                        <Text style={styles.fieldLabel}>{t('Service Category')}</Text>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => setShowCategoryList(v => !v)}
                            disabled={loadingCats || isLoading}
                        >
                            <Ionicons name="briefcase-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <Text style={[styles.dropdownText, !selectedCategory && styles.dropdownPlaceholder]}>
                                {loadingCats
                                    ? t('Loading categories...')
                                    : selectedCategory?.name ?? t('Select your service type')
                                }
                            </Text>
                            <Ionicons name={showCategoryList ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>

                        {showCategoryList && (
                            <BlurView intensity={30} tint="dark" style={styles.dropdownList}>
                                <ScrollView
                                    style={styles.dropdownScroll}
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat._id}
                                            style={[
                                                styles.dropdownItem,
                                                categoryId === cat._id && styles.dropdownItemActive,
                                            ]}
                                            onPress={() => {
                                                setCategoryId(cat._id);
                                                setSelectedCategory(cat);
                                                setShowCategoryList(false);
                                                setErrors(e => ({ ...e, category: '' }));
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                categoryId === cat._id && styles.dropdownItemTextActive,
                                            ]}>
                                                {cat.name}
                                            </Text>
                                            {categoryId === cat._id && (
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </BlurView>
                        )}
                        {err('category')}

                        {/* Location */}
                        <Text style={styles.fieldLabel}>
                            {t('Business Location')} <Text style={styles.required}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={[styles.dropdownTrigger, errors.location && styles.inputError]}
                            onPress={() => router.push('./LocationPicker')}
                            disabled={isLoading}
                        >
                            <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <Text style={[styles.dropdownText, !location && styles.dropdownPlaceholder]} numberOfLines={1}>
                                {location
                                    ? (locationAddress || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`)
                                    : t('Tap to set your business location')
                                }
                            </Text>
                            <Ionicons name="map-outline" size={18} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                        {err('location')}

                        {/* Specializations */}
                        <Text style={styles.fieldLabel}>
                            {t('Specializations')} <Text style={styles.optional}>({t('optional')})</Text>
                        </Text>
                        {tags.map((tag, index) => (
                            <View key={index} style={styles.tagRow}>
                                <BlurView intensity={25} tint="light" style={[styles.inputWrapper, styles.tagInput]}>
                                    <Ionicons name="pricetag-outline" size={16} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={`e.g. ${['Wiring', 'Pipe Fitting', 'Tiling', 'Painting'][index] ?? 'Specialization'}`}
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        value={tag}
                                        onChangeText={text => {
                                            const updated = [...tags];
                                            updated[index] = text;
                                            setTags(updated);
                                        }}
                                        editable={!isLoading}
                                        autoCapitalize="words"
                                    />
                                    {tags.length > 2 && (
                                        <TouchableOpacity onPress={() => setTags(tags.filter((_, i) => i !== index))}>
                                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                                        </TouchableOpacity>
                                    )}
                                </BlurView>
                            </View>
                        ))}
                        {tags.length < 8 && (
                            <TouchableOpacity
                                style={styles.addTagBtn}
                                onPress={() => setTags([...tags, ''])}
                                disabled={isLoading}
                            >
                                <Ionicons name="add-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
                                {/* ✅ */}
                                <Text style={styles.addTagText}>{t('Add another specialization')}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Description */}
                        <Text style={styles.fieldLabel}>{t('About Your Service')}</Text>
                        <BlurView intensity={25} tint="light" style={[styles.inputWrapper, styles.textAreaWrapper]}>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder={t('Briefly describe your expertise and the services you offer (min 20 characters)...')}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {err('description')}

                        {/* Info card */}
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle-outline" size={18} color="rgba(255,255,255,0.8)" />
                            {/* ✅ */}
                            <Text style={styles.infoText}>
                                {t('Business documents (license, certifications) and portfolio images can be uploaded from your profile after you log in.')}
                            </Text>
                        </View>

                        {/* Sign Up button */}
                        <Pressable
                            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" size="small" />
                            ) : (
                                // ✅
                                <Text style={styles.submitBtnText}>{t('CREATE ACCOUNT')}</Text>
                            )}
                        </Pressable>

                        {/* Already have account */}
                        <Pressable
                            style={styles.loginLink}
                            onPress={() => router.replace('/UserLogin')}
                            disabled={isLoading}
                        >
                            {/* ✅ */}
                            <Text style={styles.loginLinkText}>{t('Already have an account? Sign In')}</Text>
                        </Pressable>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    safeArea: { flex: 1, zIndex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
    backBtn: { marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 4 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 28 },
    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatarWrapper: { position: 'relative', marginBottom: 8 },
    avatar: { width: 100, height: 100, borderRadius: 20, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
    avatarPlaceholder: {
        width: 100, height: 100, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
        borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarEditBadge: {
        position: 'absolute', bottom: -4, right: -4,
        backgroundColor: '#2E86D4', borderRadius: 12,
        width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#022373',
    },
    avatarHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    removePhotoText: { color: '#FFD700', fontSize: 12, marginTop: 4, textDecorationLine: 'underline' },
    fieldLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 14, letterSpacing: 0.3 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16, height: 56, paddingHorizontal: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
    },
    textAreaWrapper: { height: 110, alignItems: 'flex-start', paddingVertical: 12 },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, color: '#fff', fontSize: 15 },
    textArea: { flex: 1, color: '#fff', fontSize: 15, textAlignVertical: 'top' },
    errorText: { color: '#FFD700', fontSize: 12, marginLeft: 4, marginTop: 4, fontWeight: '600' },
    dropdownTrigger: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16, height: 56, paddingHorizontal: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    },
    dropdownText: { flex: 1, color: '#fff', fontSize: 15 },
    dropdownPlaceholder: { color: 'rgba(255,255,255,0.5)' },
    dropdownList: { borderRadius: 16, overflow: 'hidden', marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 18, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    dropdownItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
    dropdownItemText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
    dropdownItemTextActive: { color: '#fff', fontWeight: '700' },
    infoCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14, padding: 14, marginTop: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    infoText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 },
    submitBtn: {
        backgroundColor: '#fff', borderRadius: 30, height: 60,
        justifyContent: 'center', alignItems: 'center',
        marginTop: 28, elevation: 5,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#022373', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
    loginLink: { alignSelf: 'center', padding: 12, marginTop: 4 },
    loginLinkText: { color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline', fontSize: 14 },
    dropdownScroll: { maxHeight: 220 },
    inputError: { borderColor: '#FFD700', borderWidth: 1.5 },
    required: { color: '#FF6B6B', fontWeight: '900' },
    optional: { color: 'rgba(255,255,255,0.5)', fontWeight: '400', fontSize: 12 },
    tagRow: { marginBottom: 8 },
    tagInput: { flex: 1 },
    addTagBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4, marginTop: 2 },
    addTagText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
});

export default ProviderSignUp;