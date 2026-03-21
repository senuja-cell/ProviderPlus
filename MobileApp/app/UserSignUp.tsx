import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable, Image,
    ScrollView, StyleSheet, ActivityIndicator,
    Alert, StatusBar, KeyboardAvoidingView, Platform,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signupUser } from './services/authService';
import { configureGoogleSignIn, signInWithGoogle } from './services/googleAuthService';
import { useLanguage } from './context/LanguageContext'; // ✅ ADDED
import { useAuth } from './context/AuthContext';

const UserSignUp = () => {

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    // ✅ get from context
    const { t, isSinhala } = useLanguage();

    // ✅ Pre-register all texts so auto-translate picks them up
    useEffect(() => {
        t('Create Account');
        t('Sign up as a customer');
        t('Full Name');
        t('Your full name');
        t('Email');
        t('Phone Number');
        t('Password');
        t('Min. 8 characters');
        t('Confirm Password');
        t('Repeat password');
        t('CREATE ACCOUNT');
        t('Continue with Google');
        t('Already have an account? Sign In');
    }, [isSinhala]);
    const { setRole } = useAuth();

    // Form fields
    const [fullName, setFullName]               = useState('');
    const [email, setEmail]                     = useState('');
    const [password, setPassword]               = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber]         = useState('');

    // UI state
    const [showPassword, setShowPassword]               = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading]                     = useState(false);
    const [isGoogleLoading, setIsGoogleLoading]         = useState(false);

    // Field errors
    const [fullNameError, setFullNameError]               = useState('');
    const [emailError, setEmailError]                     = useState('');
    const [passwordError, setPasswordError]               = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [phoneError, setPhoneError]                     = useState('');

    // ── Validation ──────────────────────────────────────────────────────

    const handleFullNameInput = (text: string) => {
        const filtered = text.replace(/[^a-zA-Z\s]/g, '');
        setFullName(filtered);
        if (filtered.trim().length === 0)     setFullNameError('Full name is required');
        else if (filtered.trim().length < 3)  setFullNameError('Full name must be at least 3 characters');
        else                                  setFullNameError('');
    };

    const validateEmail = (text: string) => {
        setEmail(text);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (text.trim().length === 0)         setEmailError('Email is required');
        else if (!emailRegex.test(text))      setEmailError('Invalid email format');
        else                                  setEmailError('');
    };

    const handlePasswordInput = (text: string) => {
        setPassword(text);
        if (text.length === 0)                setPasswordError('Password is required');
        else if (text.length < 8)             setPasswordError('Minimum 8 characters');
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(text))
            setPasswordError('Must include uppercase, lowercase and a number');
        else                                  setPasswordError('');

        if (confirmPassword) {
            setConfirmPasswordError(text !== confirmPassword ? 'Passwords do not match' : '');
        }
    };

    const handleConfirmPasswordInput = (text: string) => {
        setConfirmPassword(text);
        if (text.length === 0)        setConfirmPasswordError('Please confirm your password');
        else if (text !== password)   setConfirmPasswordError('Passwords do not match');
        else                          setConfirmPasswordError('');
    };

    const handlePhoneInput = (text: string) => {
        const filtered = text.replace(/[^0-9]/g, '');
        if (filtered.length <= 10) {
            setPhoneNumber(filtered);
            if (filtered.length === 0)        setPhoneError('Phone number is required');
            else if (filtered.length < 10)    setPhoneError('Phone number must be exactly 10 digits');
            else                              setPhoneError('');
        }
    };

    // ── Google sign-in ──────────────────────────────────────────────────

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            const response = await signInWithGoogle();
            const msg = response.is_new_user
                ? `Welcome ${response.user_name}! Your account has been created.`
                : `Welcome back, ${response.user_name}!`;
            Alert.alert('Success!', msg, [{
                text: 'OK',
                onPress: () => {
                    setRole('user');
                    router.replace('/CustomerProfile' as any);
                }
            }]);
        } catch (error: any) {
            Alert.alert('Google Sign-In Failed', error.message || 'Unable to sign in with Google.', [{ text: 'OK' }]);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // ── Submit ──────────────────────────────────────────────────────────

    const handleSignUp = async () => {
        let hasError = false;

        if (!fullName.trim()) { setFullNameError('Full name is required'); hasError = true; }
        else if (fullName.trim().length < 3) { setFullNameError('Full name must be at least 3 characters'); hasError = true; }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) { setEmailError('Email is required'); hasError = true; }
        else if (!emailRegex.test(email)) { setEmailError('Invalid email format'); hasError = true; }

        if (!password) { setPasswordError('Password is required'); hasError = true; }
        else if (password.length < 8) { setPasswordError('Minimum 8 characters'); hasError = true; }
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
            setPasswordError('Must include uppercase, lowercase and a number'); hasError = true;
        }

        if (!confirmPassword) { setConfirmPasswordError('Please confirm your password'); hasError = true; }
        else if (confirmPassword !== password) { setConfirmPasswordError('Passwords do not match'); hasError = true; }

        if (!phoneNumber.trim()) { setPhoneError('Phone number is required'); hasError = true; }
        else if (phoneNumber.length !== 10) { setPhoneError('Phone number must be exactly 10 digits'); hasError = true; }

        if (hasError) {
            Alert.alert('Validation Error', 'Please fix all errors before proceeding');
            return;
        }

        setIsLoading(true);
        try {
            const response = await signupUser({
                full_name: fullName.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone_number: phoneNumber,
                role: 'customer',
            });
            Alert.alert(
                'Welcome!',
                `Your account has been created, ${response.user_name}.`,
                [{
                    text: 'OK',
                    onPress: () => {
                        setRole('user');
                        router.replace('/CustomerProfile' as any);
                    }
                }]
            );
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message || 'Something went wrong. Please try again.', [{ text: 'OK' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#00ADF5', '#004eba']}
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
                        <Text style={styles.title}>{t('Create Account')}</Text>
                        <Text style={styles.subtitle}>{t('Sign up as a customer')}</Text>

                        {/* ── Full Name ── */}
                        <Text style={styles.fieldLabel}>{t('Full Name')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('Your full name')}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={fullName}
                                onChangeText={handleFullNameInput}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

                        {/* ── Email ── */}
                        <Text style={styles.fieldLabel}>{t('Email')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="you@example.com"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={email}
                                onChangeText={validateEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        {/* ── Phone ── */}
                        <Text style={styles.fieldLabel}>{t('Phone Number')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="0771234567"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={phoneNumber}
                                onChangeText={handlePhoneInput}
                                keyboardType="phone-pad"
                                maxLength={10}
                                editable={!isLoading}
                            />
                        </BlurView>
                        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                        {/* ── Password ── */}
                        <Text style={styles.fieldLabel}>{t('Password')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('Min. 8 characters')}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={password}
                                onChangeText={handlePasswordInput}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <Pressable onPress={() => setShowPassword(v => !v)}>
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20} color="rgba(255,255,255,0.7)"
                                />
                            </Pressable>
                        </BlurView>
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                        {/* ── Confirm Password ── */}
                        <Text style={styles.fieldLabel}>{t('Confirm Password')}</Text>
                        <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('Repeat password')}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordInput}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <Pressable onPress={() => setShowConfirmPassword(v => !v)}>
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20} color="rgba(255,255,255,0.7)"
                                />
                            </Pressable>
                        </BlurView>
                        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                        {/* Sign Up button */}
                        <Pressable
                            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <ActivityIndicator color="#000" size="small" />
                                : <Text style={styles.submitBtnText}>{t('CREATE ACCOUNT')}</Text>
                            }
                        </Pressable>

                        {/* OR divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Google sign-in */}
                        <Pressable
                            style={[styles.googleButton, (isLoading || isGoogleLoading) && styles.googleButtonDisabled]}
                            onPress={handleGoogleSignIn}
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <ActivityIndicator color="#000" size="small" />
                            ) : (
                                <>
                                    <Image
                                        source={{ uri: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png' }}
                                        style={styles.googleIcon}
                                    />
                                    {/* ✅ */}
                                    <Text style={styles.googleButtonText}>{t('Continue with Google')}</Text>
                                </>
                            )}
                        </Pressable>

                        {/* Already have account */}
                        <Pressable
                            style={styles.loginLink}
                            onPress={() => router.replace('/(tabs)/UserLogin')}
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
    safeArea:      { flex: 1, zIndex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
    backBtn:  { marginBottom: 16 },
    title:    { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 4 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 28 },
    fieldLabel: {
        color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700',
        marginBottom: 6, marginTop: 14, letterSpacing: 0.3,
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16, height: 56, paddingHorizontal: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
    },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, color: '#fff', fontSize: 15 },
    errorText: {
        color: '#FFD700', fontSize: 12, marginLeft: 4,
        marginTop: 4, fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#fff', borderRadius: 30, height: 60,
        justifyContent: 'center', alignItems: 'center',
        marginTop: 28, elevation: 5,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#004eba', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    divider:          { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
    dividerText:      { color: '#fff', paddingHorizontal: 15, fontSize: 14, fontWeight: 'bold' },
    googleButton: {
        backgroundColor: '#fff', borderRadius: 30, height: 60,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        elevation: 5, marginBottom: 10,
    },
    googleButtonDisabled: { opacity: 0.7 },
    googleIcon:       { width: 24, height: 24, marginRight: 12 },
    googleButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
    loginLink:     { alignSelf: 'center', padding: 12, marginTop: 4 },
    loginLinkText: { color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline', fontSize: 14 },
});

export default UserSignUp;