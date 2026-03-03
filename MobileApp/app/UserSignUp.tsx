import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles, COLORS } from '@/app/styles/UserSignUpStyles';
import { router } from 'expo-router';
import { signupUser } from './services/authService';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import { configureGoogleSignIn, signInWithGoogle } from "./services/googleAuthService";

type UserRole = 'customer' | 'provider';
type Language = 'ENG' | 'සිං';

const UserSignUp = ({ navigation }: any) => {

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    // Language toggle
    const [language, setLanguage] = useState<Language>('ENG');
    const [isTranslating, setIsTranslating] = useState<boolean>(false);

    // Role toggle
    const [userRole, setUserRole] = useState<UserRole>("customer");

    // Form fields for CUSTOMER
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Error states
    const [fullNameError, setFullNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [phoneError, setPhoneError] = useState("");

    // Password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Loading state for API call
    const [isLoading, setIsLoading] = useState(false);

    // Validation functions
    const handleFullNameInput = (text: string) => {
        // Allow letters and spaces only
        const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
        setFullName(filteredText);

        if (filteredText.trim().length === 0) {
            setFullNameError("Full name is required");
        } else if (filteredText.trim().length < 3) {
            setFullNameError("Full name must be at least 3 characters");
        } else {
            setFullNameError("");
        }
    };

    const handleGoogleSignIn = async (): Promise<void> => {
        setIsGoogleLoading(true);

        try{
            const response = await signInWithGoogle();

            const welcomeMessage = response.is_new_user
                ? `Welcome ${response.user_name}! Your account has been created.`
                : `Welcome back, ${response.user_name}!`;

            Alert.alert(
                "Success!",
                welcomeMessage,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace('/(tabs)');
                        }
                    }
                ]
            );

        }
        catch (error: any) {
            Alert.alert(
                "Google Sign-In Failed",
                error.message || "Unable to sign in with Google. Please try again.",
                [{ text: "OK" }]
            );
        }
        finally {
            setIsGoogleLoading(false);
        }
    }

    const validateEmail = (text: string) => {
        setEmail(text);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (text.trim().length === 0) {
            setEmailError("Email is required");
        } else if (!emailRegex.test(text)) {
            setEmailError("Invalid email format (e.g., user@example.com)");
        } else {
            setEmailError("");
        }
    };

    const handlePasswordInput = (text: string) => {
        setPassword(text);

        if (text.length === 0) {
            setPasswordError("Password is required");
        } else if (text.length < 8) {
            setPasswordError("Password must be at least 8 characters");
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(text)) {
            setPasswordError("Password must contain uppercase, lowercase, and number");
        } else {
            setPasswordError("");
        }

        // Re-validate confirm password if it's already filled
        if (confirmPassword) {
            if (text !== confirmPassword) {
                setConfirmPasswordError("Passwords do not match");
            } else {
                setConfirmPasswordError("");
            }
        }
    };

    const handleConfirmPasswordInput = (text: string) => {
        setConfirmPassword(text);

        if (text.length === 0) {
            setConfirmPasswordError("Please confirm your password");
        } else if (text !== password) {
            setConfirmPasswordError("Passwords do not match");
        } else {
            setConfirmPasswordError("");
        }
    };

    const handlePhoneInput = (text: string) => {
        // Only numbers allowed
        const filteredText = text.replace(/[^0-9]/g, '');

        if (filteredText.length <= 10) {
            setPhoneNumber(filteredText);

            if (filteredText.length === 0) {
                setPhoneError("Phone number is required");
            } else if (filteredText.length < 10) {
                setPhoneError("Phone number must be exactly 10 digits");
            } else {
                setPhoneError("");
            }
        }
    };

    // Submit handler with API call
    const handleSignUp = async () => {
        let hasError = false;

        // Validate all fields
        if (!fullName.trim()) {
            setFullNameError("Full name is required");
            hasError = true;
        } else if (fullName.trim().length < 3) {
            setFullNameError("Full name must be at least 3 characters");
            hasError = true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setEmailError("Email is required");
            hasError = true;
        } else if (!emailRegex.test(email)) {
            setEmailError("Invalid email format");
            hasError = true;
        }

        if (!password) {
            setPasswordError("Password is required");
            hasError = true;
        } else if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            hasError = true;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
            setPasswordError("Password must contain uppercase, lowercase, and number");
            hasError = true;
        }

        if (!confirmPassword) {
            setConfirmPasswordError("Please confirm your password");
            hasError = true;
        } else if (confirmPassword !== password) {
            setConfirmPasswordError("Passwords do not match");
            hasError = true;
        }

        if (!phoneNumber.trim()) {
            setPhoneError("Phone number is required");
            hasError = true;
        } else if (phoneNumber.length !== 10) {
            setPhoneError("Phone number must be exactly 10 digits");
            hasError = true;
        }

        if (hasError) {
            Alert.alert("Validation Error", "Please fix all errors before proceeding");
            return;
        }

        // Call API
        setIsLoading(true);
        try {
            const response = await signupUser({
                full_name: fullName.trim(),
                email: email.trim().toLowerCase(),
                password: password,
                phone_number: phoneNumber,
                role: userRole
            });

            Alert.alert(
                "Success!",
                `Welcome ${response.user_name}! Your account has been created.`,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // Navigate to home page
                            router.replace('/(tabs)');
                        }
                    }
                ]
            );

        } catch (error: any) {
            // Show error message
            Alert.alert(
                "Signup Failed",
                error.message || "Something went wrong. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Render Provider View (Coming Soon)
    if (userRole === 'provider') {
        return (
            <View style={globalStyles.mainContainer}>
                <LinearGradient colors={COLORS.userGradient} style={StyleSheet.absoluteFill} />
                <SafeAreaView style={globalStyles.safeArea}>
                    {/* Language Toggle */}
                    <View style={styles.headerToggleLang}>
                        <View style={styles.langToggleContainer}>
                            <View style={styles.toggleBackground}>
                                <Pressable style={styles.langButton} onPress={() => setLanguage('ENG')}>
                                    {language === 'ENG' && (
                                        <LinearGradient
                                            colors={['#E440FF', '#5A1F63']}
                                            style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
                                        />
                                    )}
                                    <Text style={[styles.langText, language === 'ENG' && styles.activeToggleText]}>
                                        ENG
                                    </Text>
                                </Pressable>
                                <Pressable style={styles.langButton} onPress={() => setLanguage('සිං')}>
                                    {language === 'සිං' && (
                                        <LinearGradient
                                            colors={['#E440FF', '#5A1F63']}
                                            style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
                                        />
                                    )}
                                    <Text style={[styles.langText, language === 'සිං' && styles.activeToggleText]}>
                                        සිං
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                        {isTranslating && (
                            <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 10 }} />
                        )}
                    </View>

                    {/* Role Toggle */}
                    <View style={styles.inlineRoleToggle}>
                        <View style={styles.toggleBackground}>
                            <Pressable style={styles.toggleButton} onPress={() => setUserRole('customer')}>
                                <Text style={styles.toggleText}>Customer</Text>
                            </Pressable>
                            <Pressable style={styles.toggleButton} onPress={() => setUserRole('provider')}>
                                <LinearGradient
                                    colors={['#00ADF5', '#0066CC']}
                                    style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                                />
                                <Text style={[styles.toggleText, { color: '#FFF' }]}>Provider</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.comingSoonContainer}>
                        <Text style={styles.comingSoonTitle}>Provider Registration</Text>
                        <Text style={styles.comingSoonText}>Coming Soon!</Text>
                        <Text style={styles.comingSoonSubtext}>
                            Provider signup requires additional verification and documentation.
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // Render Customer Sign Up Form
    return (
        <View style={globalStyles.mainContainer}>
            <LinearGradient colors={COLORS.userGradient} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={globalStyles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Language Toggle */}
                    <View style={styles.headerToggleLang}>
                        <View style={styles.langToggleContainer}>
                            <View style={styles.toggleBackground}>
                                <Pressable style={styles.langButton} onPress={() => setLanguage('ENG')}>
                                    {language === 'ENG' && (
                                        <LinearGradient
                                            colors={['#E440FF', '#5A1F63']}
                                            style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
                                        />
                                    )}
                                    <Text style={[styles.langText, language === 'ENG' && styles.activeToggleText]}>
                                        ENG
                                    </Text>
                                </Pressable>
                                <Pressable style={styles.langButton} onPress={() => setLanguage('සිං')}>
                                    {language === 'සිං' && (
                                        <LinearGradient
                                            colors={['#E440FF', '#5A1F63']}
                                            style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
                                        />
                                    )}
                                    <Text style={[styles.langText, language === 'සිං' && styles.activeToggleText]}>
                                        සිං
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                        {isTranslating && (
                            <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 10 }} />
                        )}
                    </View>

                    {/* Title */}
                    <Text style={globalStyles.title}>Create Your Account</Text>

                    {/* Role Toggle */}
                    <View style={styles.inlineRoleToggle}>
                        <View style={styles.toggleBackground}>
                            <Pressable style={styles.toggleButton} onPress={() => setUserRole('customer')}>
                                <LinearGradient
                                    colors={['#00ADF5', '#0066CC']}
                                    style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                                />
                                <Text style={[styles.toggleText, { color: '#FFF' }]}>Customer</Text>
                            </Pressable>
                            <Pressable style={styles.toggleButton} onPress={() => setUserRole('provider')}>
                                <Text style={styles.toggleText}>Provider</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* FULL NAME */}
                    <View>
                        <BlurView intensity={20} style={globalStyles.inputWrapper}>
                            <TextInput
                                placeholder="Full Name"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                style={globalStyles.textInput}
                                value={fullName}
                                onChangeText={handleFullNameInput}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {fullNameError ? (
                            <Text style={styles.errorText}>{fullNameError}</Text>
                        ) : null}
                    </View>

                    {/* EMAIL */}
                    <View>
                        <BlurView intensity={20} style={globalStyles.inputWrapper}>
                            <TextInput
                                placeholder="Email"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                style={globalStyles.textInput}
                                value={email}
                                onChangeText={validateEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </BlurView>
                        {emailError ? (
                            <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}
                    </View>

                    {/* PHONE NUMBER */}
                    <View>
                        <BlurView intensity={20} style={globalStyles.inputWrapper}>
                            <TextInput
                                placeholder="Phone Number"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                style={globalStyles.textInput}
                                value={phoneNumber}
                                onChangeText={handlePhoneInput}
                                keyboardType="phone-pad"
                                maxLength={10}
                                editable={!isLoading}
                            />
                        </BlurView>
                        {phoneError ? (
                            <Text style={styles.errorText}>{phoneError}</Text>
                        ) : null}
                    </View>

                    {/* PASSWORD */}
                    <View>
                        <BlurView intensity={20} style={globalStyles.inputWrapper}>
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                style={[globalStyles.textInput, { flex: 1 }]}
                                value={password}
                                onChangeText={handlePasswordInput}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                            >
                                <MaterialCommunityIcons
                                    name={showPassword ? "eye" : "eye-off"}
                                    size={24}
                                    color="#666"
                                />
                            </Pressable>
                        </BlurView>
                        {passwordError ? (
                            <Text style={styles.errorText}>{passwordError}</Text>
                        ) : null}
                    </View>

                    {/* CONFIRM PASSWORD */}
                    <View>
                        <BlurView intensity={20} style={globalStyles.inputWrapper}>
                            <TextInput
                                placeholder="Confirm Password"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                style={[globalStyles.textInput, { flex: 1 }]}
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordInput}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <Pressable
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                            >
                                <MaterialCommunityIcons
                                    name={showConfirmPassword ? "eye" : "eye-off"}
                                    size={24}
                                    color="#666"
                                />
                            </Pressable>
                        </BlurView>
                        {confirmPasswordError ? (
                            <Text style={styles.errorText}>{confirmPasswordError}</Text>
                        ) : null}
                    </View>

                    {/* Sign Up Button */}
                    <Pressable
                        style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={isLoading ? ['#999', '#666'] : ['#00ADF5', '#0066CC']}
                            style={styles.signUpGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.signUpButtonText}>Sign Up</Text>
                            )}
                        </LinearGradient>
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
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Image
                                    source={{ uri: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" }}
                                    style={styles.googleIcon}
                                />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </>
                        )}
                    </Pressable>


                    {/* Already have account */}
                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginLinkText}>Already have an account? </Text>
                        <Pressable onPress={() => router.push('.//(tabs)')} disabled={isLoading}>
                            <Text style={styles.loginLink}>Log In</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerToggleLang: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20
    },
    langToggleContainer: {
        width: 104,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FFF",
        overflow: "hidden",
        padding: 3,
        marginBottom: 20,
    },
    toggleBackground: {
        flex: 1,
        flexDirection: "row"
    },
    langButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 15
    },
    langText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#888"
    },
    activeToggleText: {
        color: "#FFF"
    },
    inlineRoleToggle: {
        alignSelf: "center",
        width: 220,
        height: 40,
        borderRadius: 25,
        backgroundColor: "#FFF",
        overflow: "hidden",
        padding: 2,
        marginBottom: 30,
        marginTop: 10,
    },
    toggleButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 25
    },
    toggleText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#888",
        zIndex: 1
    },
    errorText: {
        color: '#FF4B4B',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 20,
        marginBottom: 10,
        fontWeight: '600',
    },
    eyeIcon: {
        fontSize: 22,
        paddingHorizontal: 10,
    },
    signUpButton: {
        marginTop: 30,
        marginHorizontal: 20,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    signUpButtonDisabled: {
        opacity: 0.7,
    },
    signUpGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signUpButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginLinkText: {
        color: '#FFF',
        fontSize: 14,
    },
    loginLink: {
        color: '#00ADF5',
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    comingSoonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    comingSoonTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 20,
    },
    comingSoonText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#00ADF5',
        marginBottom: 10,
    },
    comingSoonSubtext: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 24,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        marginHorizontal: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dividerText: {
        color: '#FFF',
        paddingHorizontal: 15,
        fontSize: 14,
        fontWeight: 'bold',
    },
    googleButton: {
        marginHorizontal: 20,
        backgroundColor: '#FFF',
        borderRadius: 30,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        marginBottom: 10,
    },
    googleButtonDisabled: {
        opacity: 0.7,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    googleButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UserSignUp;
