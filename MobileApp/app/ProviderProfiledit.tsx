import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#071A3E',
  card: 'rgba(255,255,255,0.07)',
  cardBorder: 'rgba(255,255,255,0.12)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.18)',
  accent: '#1A6BFF',
  accentLight: '#3D85FF',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  textSub: 'rgba(255,255,255,0.65)',
  divider: 'rgba(255,255,255,0.1)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}) => (
  <View style={styles.inputWrapper}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? label}
      placeholderTextColor={COLORS.textMuted}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      keyboardType={keyboardType}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProviderProfiledit(): React.JSX.Element {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [nic, setNic] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handlePickProfileImage = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const handleEditDetails = (): void => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Info', 'Please fill in your name and email.');
      return;
    }
    Alert.alert('Profile Updated', 'Your provider profile has been saved successfully!');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Profile</Text>
        <View style={styles.headerRight}>
          <Text style={styles.langText}>ENG</Text>
          <View style={styles.toggleOuter}>
            <View style={styles.toggleThumb} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickProfileImage}
            activeOpacity={0.85}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={38} color="rgba(255,255,255,0.4)" />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Personal Info Card */}
          <View style={styles.card}>
            <InputField label="Name" value={name} onChangeText={setName} />
            <View style={styles.divider} />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <View style={styles.divider} />
            <InputField
              label="Contact No."
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />
            <View style={styles.divider} />
            <InputField label="NIC" value={nic} onChangeText={setNic} />
          </View>

          <Text style={styles.orText}>Or</Text>

          {/* Skip */}
          <TouchableOpacity
            style={styles.skipBtn}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>

          {/* Edit Details */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={handleEditDetails}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnText}>Edit Details</Text>
            <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langText: { color: COLORS.textSub, fontSize: 13, fontWeight: '600' },
  toggleOuter: {
    width: 40, height: 22, borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center', paddingHorizontal: 2, alignItems: 'flex-end',
  },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  avatarWrapper: { alignSelf: 'center', marginBottom: 24 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: COLORS.accent,
  },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: COLORS.card,
    borderWidth: 2, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.bg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 24,
  },
  inputWrapper: { marginBottom: 4 },
  inputLabel: {
    color: COLORS.textSub, fontSize: 12, fontWeight: '600',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  input: {
    color: COLORS.text, fontSize: 15, fontWeight: '500',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.inputBorder,
    minHeight: 44,
  },
  inputMultiline: { minHeight: 90, paddingTop: 10 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 10 },
  orText: {
    color: COLORS.textMuted, fontSize: 14,
    textAlign: 'center', marginBottom: 12,
  },
  skipBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingVertical: 13, marginBottom: 20,
  },
  skipBtnText: { color: COLORS.textSub, fontSize: 15, fontWeight: '600' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 14, paddingVertical: 15,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});