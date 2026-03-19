import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Image,
    Text,
    View,
    Pressable,
    TextInput,
    StatusBar,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { loginUser } from '../services/authService';
import { configureGoogleSignIn, signInWithGoogle } from "../services/googleAuthService";
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

type UserRole = 'customer' | 'provider';

const UserLogin: React.FC = () => {

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
    const [userRole, setUserRole] = useState<UserRole>("customer");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");

    const { setRole } = useAuth();
    const { isSinhala, toggleLanguage, t, isTranslating } = useLanguage();

    const handleGoogleSignIn = async (): Promise<void> => {
        setIsGoogleLoading(true);
        try {
            const response = await signInWithGoogle();
            const welcomeMessage = response.is_new_user
                ? `Welcome ${response.user_name}! Your account has been created.`
                : `Welcome back, ${response.user_name}!`;
            Alert.alert("Success!", welcomeMessage, [{
                text: "OK",
                onPress: () => router.replace("/(tabs)")
            }]);
        } catch (error: any) {
            Alert.alert(
                "Google sign in failed",
                error.message || "Unable to sign in with Google. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const validateEmail = (text: string) => {
        setEmail(text);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (text.trim().length === 0) {
            setEmailError("Email is required");
        } else if (!emailRegex.test(text)) {
            setEmailError("Invalid email format");
        } else {
            setEmailError("");
        }
    };

    const handlePasswordInput = (text: string) => {
        setPassword(text);
        if (text.length === 0) {
            setPasswordError("Password is required");
        } else {
            setPasswordError("");
        }
    };

    const handleLogin = async (): Promise<void> => {
        let hasError = false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email.trim()) {
            setEmailError("Email is required");
            hasError = true;
        } else if (!emailRegex.test(email)) {
            setEmailError("Invalid email format");
            hasError = true;
        }

        if (!password.trim()) {
            setPasswordError("Password is required");
            hasError = true;
        }

        if (hasError) {
            Alert.alert("Error", "Please fix all errors before proceeding");
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginUser({
                email: email.trim().toLowerCase(),
                password: password
            });
            if (userRole === 'customer') {
                setRole('user');
                Alert.alert("Welcome Back!", `Successfully logged in as ${response.user_name}`, [{
                    text: "OK",
                    onPress: () => router.replace('/(tabs)')
                }]);
            } else {
                setRole('provider');
                Alert.alert("Welcome Back!", `Successfully logged in as ${response.user_name}`, [{
                    text: "OK",
                    onPress: () => router.replace('/ProviderDash')
                }]);
            }
        } catch (error: any) {
            Alert.alert(
                "Login Failed",
                error.message || "Incorrect email or password. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={userRole === 'customer' ? ['#00ADF5', '#004eba'] : ['#1086b5', '#022373']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* HEADER LANGUAGE TOGGLE */}
                        <View style={styles.header}>
                            <View style={styles.languageToggle}>
                                <Text style={[styles.langLabel, !isSinhala && styles.langLabelActive]}>ENG</Text>
                                <Text style={styles.langDivider}>|</Text>
                                <Text style={[styles.langLabel, isSinhala && styles.langLabelActive]}>සිං</Text>
                                {isTranslating && (
                                    <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 4 }} />
                                )}
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

                        {/* LOGO */}
                        <View style={styles.logoContainer}>
                            <Image source={require('../../assets/images/provider-logo.png')} style={styles.mainLogo} resizeMode="contain" />
                            <Text style={styles.welcomeText}>{t('LOG IN')}</Text>
                        </View>

                        {/* FORM SECTION */}
                        <View style={styles.formContainer}>

                            {/* ROLE TOGGLE */}
                            <View style={styles.inlineRoleToggle}>
                                <View style={styles.toggleBackground}>
                                    <Pressable style={styles.toggleButton} onPress={() => setUserRole('customer')}>
                                        {userRole === 'customer' && <LinearGradient colors={['#00ADF5', '#0072FF']} style={[StyleSheet.absoluteFill, { borderRadius: 25 }]} />}
                                        <Text style={[styles.toggleText, userRole === 'customer' && styles.activeToggleText]}>{t('Customer')}</Text>
                                    </Pressable>
                                    <Pressable style={styles.toggleButton} onPress={() => setUserRole('provider')}>
                                        {userRole === 'provider' && <LinearGradient colors={['#1086b5', '#022373']} style={[StyleSheet.absoluteFill, { borderRadius: 25 }]} />}
                                        <Text style={[styles.toggleText, userRole === 'provider' && styles.activeToggleText]}>{t('Provider')}</Text>
                                    </Pressable>
                                </View>
                            </View>

                            {/* EMAIL INPUT */}
                            <View>
                                <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={t('Email')}
                                        placeholderTextColor="rgba(255,255,255,0.6)"
                                        value={email}
                                        onChangeText={validateEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                    />
                                    <Image
                                        source={{ uri: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png" }}
                                        style={styles.inputIcon}
                                    />
                                </BlurView>
                                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                            </View>

                            {/* PASSWORD INPUT */}
                            <View>
                                <BlurView intensity={25} tint="light" style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder={t('Password')}
                                        placeholderTextColor="rgba(255,255,255,0.6)"
                                        secureTextEntry={!isPasswordVisible}
                                        value={password}
                                        onChangeText={handlePasswordInput}
                                        editable={!isLoading}
                                    />
                                    <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} disabled={isLoading}>
                                        <Image
                                            source={{
                                                uri: isPasswordVisible
                                                    ? "https://cdn-icons-png.flaticon.com/512/709/709612.png"
                                                    : "https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
                                            }}
                                            style={styles.inputIcon}
                                        />
                                    </Pressable>
                                </BlurView>
                                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                            </View>

                            {/* FORGOT PASSWORD */}
                            <Pressable
                                style={styles.forgotPassContainer}
                                onPress={() => Alert.alert(t('Forgot Password?'), "Password reset feature coming soon!")}
                                disabled={isLoading}
                            >
                                <Text style={styles.linkText}>{t('Forgot Password?')}</Text>
                            </Pressable>

                            {/* SIGN IN BUTTON */}
                            <Pressable
                                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#000" size="small" />
                                ) : (
                                    <Text style={styles.loginButtonText}>{t('SIGN IN')}</Text>
                                )}
                            </Pressable>

                            {/* OR DIVIDER */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.divider} />
                            </View>

                            {/* GOOGLE SIGN-IN BUTTON */}
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
                                            source={{ uri: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" }}
                                            style={styles.googleIcon}
                                        />
                                        <Text style={styles.googleButtonText}>{t('Continue with Google')}</Text>
                                    </>
                                )}
                            </Pressable>

                            {/* SIGN UP LINK */}
                            <Pressable
                                style={styles.signupTextContainer}
                                onPress={() => router.push(userRole === 'provider' ? '../ProviderSignUp' : '../UserSignUp')}
                                disabled={isLoading}
                            >
                                <Text style={styles.signupText}>{t("Didn't sign up yet?")}</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    safeArea: { flex: 1, zIndex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 5 },
    header: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 20, marginBottom: 20 },
    languageToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    toggleBackground: { flex: 1, flexDirection: "row" },
    langLabel: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13, marginHorizontal: 3 },
    langLabelActive: { color: 'white' },
    langDivider: { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
    switchStyle: { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
    activeToggleText: { color: "#FFF" },
    logoContainer: { alignItems: "center", marginTop: 5 },
    mainLogo: { width: 80, height: 80 },
    welcomeText: { fontSize: 28, fontWeight: "900", color: "#FFF", letterSpacing: 2, margin: 25 },
    formContainer: { width: "100%" },
    inlineRoleToggle: {
        alignSelf: "center",
        width: 180,
        height: 35,
        borderRadius: 25,
        backgroundColor: "#FFF",
        overflow: "hidden",
        padding: 2,
        marginBottom: 20
    },
    toggleButton: { flex: 1, justifyContent: "center", alignItems: "center", borderRadius: 25 },
    toggleText: { fontSize: 14, fontWeight: "bold", color: "#888", zIndex: 1 },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 30,
        height: 60,
        marginBottom: 3,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        overflow: 'hidden'
    },
    textInput: { flex: 1, color: "#FFF", fontSize: 16 },
    inputIcon: { width: 22, height: 22, tintColor: "#FFF" },
    forgotPassContainer: { alignSelf: "center", marginBottom: 25, marginTop: 5 },
    linkText: { color: "#FFF", textDecorationLine: "underline", fontSize: 14 },
    loginButton: {
        backgroundColor: "#FFF",
        borderRadius: 30,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        marginBottom: 10
    },
    loginButtonDisabled: { opacity: 0.7 },
    loginButtonText: { color: "#000", fontSize: 18, fontWeight: "bold" },
    signupTextContainer: { alignSelf: "center", padding: 10 },
    signupText: { color: "#FFF", textDecorationLine: "underline", fontSize: 14 },
    errorText: {
        color: '#FFD700',
        fontSize: 12,
        marginLeft: 20,
        marginBottom: 15,
        fontWeight: '600',
    },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
    dividerText: { color: '#FFF', paddingHorizontal: 15, fontSize: 14, fontWeight: 'bold' },
    googleButton: {
        backgroundColor: '#FFF',
        borderRadius: 30,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        marginBottom: 20,
    },
    googleButtonDisabled: { opacity: 0.7 },
    googleIcon: { width: 24, height: 24, marginRight: 12 },
    googleButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});

export default UserLogin;