/**
 * ProviderProfiledit.tsx
 * Provider+ App — Provider Profile Editing Screen
 *
 * Changes in this commit:
 *  - LinearGradient background (#1086b5 → #022373)
 *  - Skills chips center-aligned
 *  - Provider+ logo in top right of header
 *  - Edit Details button removed
 *
 * Required packages:
 *   npx expo install expo-image-picker expo-document-picker expo-linear-gradient
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_PICKER_RESULT_KEY } from './LocationPicker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentFile {
  name: string;
  uri: string;
}

interface WorkItem {
  name: string;
  attachments: AttachmentFile[];
  description: string;
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}

interface SectionHeaderProps {
  title: string;
}

interface SkillChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  onRemove?: () => void;
  isCustom?: boolean;
}

interface WorkCardProps {
  index: number;
  work: WorkItem;
  onChange: (index: number, field: keyof WorkItem, value: any) => void;
  onRemove: (index: number) => void;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const COLORS = {
  // Gradient colours — used on background
  gradientTop: '#1086b5',
  gradientBot: '#022373',

  card: 'rgba(255,255,255,0.10)',
  cardBorder: 'rgba(255,255,255,0.18)',
  inputBg: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.22)',
  accent: '#1A6BFF',
  accentLight: '#4DA3FF',
  accentGlow: 'rgba(26,107,255,0.25)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  textSub: 'rgba(255,255,255,0.70)',
  chipBg: 'rgba(255,255,255,0.12)',
  chipBorder: 'rgba(255,255,255,0.25)',
  chipSelected: '#1A6BFF',
  sectionTitle: '#FFFFFF',
  divider: 'rgba(255,255,255,0.12)',
  danger: '#FF4D4F',
};

// ─── Static Data ──────────────────────────────────────────────────────────────

const CATEGORIES: string[] = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting',
  'Cleaning', 'Landscaping', 'HVAC & Air Conditioning',
  'IT & Tech Support', 'Interior Design', 'Other',
];

const PREDEFINED_SKILLS: string[] = [
  'Plumbing', 'Electrical', 'Welding', 'Carpentry',
  'Painting', 'Tiling', 'Roofing', 'Masonry',
  'Landscaping', 'HVAC', 'Cleaning', 'Security',
  'IT Support', 'Networking', 'CCTV', 'Solar Panels',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder,
  multiline = false, keyboardType = 'default',
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

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.sectionLine} />
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const SkillChip: React.FC<SkillChipProps> = ({
  label, selected, onPress, onRemove, isCustom = false,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, selected && styles.chipSelected]}
    activeOpacity={0.75}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    {isCustom && selected && onRemove && (
      <TouchableOpacity onPress={onRemove} style={styles.chipRemove}>
        <AntDesign name="close" size={10} color="#fff" />
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

const WorkCard: React.FC<WorkCardProps> = ({ index, work, onChange, onRemove }) => {
  const handleAttachment = (): void => {
    Alert.alert(
      'Add Attachment',
      'Choose how to add your attachment',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert('Permission denied', 'Camera access is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              allowsEditing: false,
              quality: 0.85,
            });
            if (!result.canceled && result.assets.length > 0) {
              const file = result.assets[0];
              onChange(index, 'attachments', [
                ...work.attachments,
                { name: `photo_${Date.now()}.jpg`, uri: file.uri },
              ]);
            }
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
              Alert.alert('Permission denied', 'Media library access is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              allowsMultipleSelection: true,
              quality: 0.85,
            });
            if (!result.canceled) {
              const files: AttachmentFile[] = result.assets.map((a) => ({
                name: a.fileName ?? `image_${Date.now()}`,
                uri: a.uri,
              }));
              onChange(index, 'attachments', [...work.attachments, ...files]);
            }
          },
        },
        {
          text: 'Files / Documents',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                multiple: true,
                copyToCacheDirectory: true,
              });
              if (!result.canceled && result.assets) {
                const files: AttachmentFile[] = result.assets.map((a) => ({
                  name: a.name,
                  uri: a.uri,
                }));
                onChange(index, 'attachments', [...work.attachments, ...files]);
              }
            } catch {
              Alert.alert('Error', 'Could not open file picker.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.workCard}>
      <View style={styles.workCardHeader}>
        <Text style={styles.workCardTitle}>Work {index + 1}</Text>
        {index > 0 && (
          <TouchableOpacity onPress={() => onRemove(index)}>
            <Feather name="trash-2" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={work.name}
          onChangeText={(t) => onChange(index, 'name', t)}
          placeholder="Work Name"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <TouchableOpacity
        style={styles.attachmentField}
        onPress={handleAttachment}
        activeOpacity={0.8}
      >
        <View>
          <Text style={styles.attachmentLabel}>Attachments</Text>
          {work.attachments.length === 0 ? (
            <Text style={styles.attachmentPlaceholder}>Add Your Images / Videos / Files Here</Text>
          ) : (
            <Text style={styles.attachmentCount}>
              {work.attachments.length} file{work.attachments.length > 1 ? 's' : ''} attached
            </Text>
          )}
        </View>
        <Feather name="paperclip" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {work.attachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.attachmentPreviewRow}
        >
          {work.attachments.map((file, fi) => (
            <View key={fi} style={styles.attachmentChip}>
              <Feather name="file" size={12} color={COLORS.accentLight} />
              <Text style={styles.attachmentChipText} numberOfLines={1}>
                {file.name.length > 14 ? file.name.slice(0, 12) + '…' : file.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const updated = work.attachments.filter((_, i) => i !== fi);
                  onChange(index, 'attachments', updated);
                }}
              >
                <AntDesign name="close" size={10} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={work.description}
          onChangeText={(t) => onChange(index, 'description', t)}
          placeholder="Add A Description About Your Work"
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProviderProfiledit(): React.JSX.Element {
  const [name, setName]                 = useState<string>('');
  const [email, setEmail]               = useState<string>('');
  const [contact, setContact]           = useState<string>('');
  const [nic, setNic]                   = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [category, setCategory]                         = useState<string>('');
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  const [serviceDescription, setServiceDescription]     = useState<string>('');

  const [selectedSkills, setSelectedSkills]     = useState<string[]>([]);
  const [customSkills, setCustomSkills]         = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [showSkillInput, setShowSkillInput]     = useState<boolean>(false);

  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [brNumber, setBrNumber] = useState<string>('');

  const [works, setWorks] = useState<WorkItem[]>([
    { name: '', attachments: [], description: '' },
  ]);

  // ── Read LocationPicker result on focus ───────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(LOCATION_PICKER_RESULT_KEY);
          if (raw) {
            const parsed: SelectedLocation = JSON.parse(raw);
            setLocation(parsed);
            await AsyncStorage.removeItem(LOCATION_PICKER_RESULT_KEY);
          }
        } catch {
          // ignore
        }
      })();
    }, [])
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  const toggleSkill = (skill: string): void => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = (): void => {
    const trimmed = customSkillInput.trim();
    if (!trimmed || customSkills.includes(trimmed) || PREDEFINED_SKILLS.includes(trimmed)) return;
    setCustomSkills((prev) => [...prev, trimmed]);
    setSelectedSkills((prev) => [...prev, trimmed]);
    setCustomSkillInput('');
    setShowSkillInput(false);
  };

  const removeCustomSkill = (skill: string): void => {
    setCustomSkills((prev) => prev.filter((s) => s !== skill));
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleWorkChange = (index: number, field: keyof WorkItem, value: any): void => {
    setWorks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addWork  = (): void =>
    setWorks((prev) => [...prev, { name: '', attachments: [], description: '' }]);

  const removeWork = (index: number): void =>
    setWorks((prev) => prev.filter((_, i) => i !== index));

  const handleSave = (): void => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Info', 'Please fill in your name and email.');
      return;
    }
    Alert.alert('Profile Updated', 'Your provider profile has been saved successfully!');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={[COLORS.gradientTop, COLORS.gradientBot]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Provider+ logo — top left */}
          <Image
            source={require('../assets/images/provider-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          {/* Title */}
          <Text style={styles.headerTitle}>Provider Profile</Text>

          {/* ENG toggle — top right (unchanged) */}
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
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
            {/* ── Avatar ── */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickProfileImage}
              activeOpacity={0.85}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={38} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Feather name="camera" size={11} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* ── Personal Info ── */}
            <View style={styles.card}>
              <InputField label="Name" value={name} onChangeText={setName} />
              <View style={styles.divider} />
              <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <View style={styles.divider} />
              <InputField label="Contact No." value={contact} onChangeText={setContact} keyboardType="phone-pad" />
              <View style={styles.divider} />
              <InputField label="NIC" value={nic} onChangeText={setNic} />
            </View>

            {/* ── Service Information ── */}
            <SectionHeader title="Service Information" />

            {/* Category */}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={category ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {category || 'Category'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Service Description */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Service Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={serviceDescription}
                onChangeText={setServiceDescription}
                placeholder="Enter A Description About You"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* ── Skills — center aligned ── */}
            <View style={styles.card}>
              <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 14 }]}>
                Skills
              </Text>

              {/* Chips row — centered */}
              <View style={styles.chipsGrid}>
                {PREDEFINED_SKILLS.map((skill) => (
                  <SkillChip
                    key={skill}
                    label={skill}
                    selected={selectedSkills.includes(skill)}
                    onPress={() => toggleSkill(skill)}
                  />
                ))}
                {customSkills.map((skill) => (
                  <SkillChip
                    key={`custom-${skill}`}
                    label={skill}
                    selected={selectedSkills.includes(skill)}
                    onPress={() => toggleSkill(skill)}
                    onRemove={() => removeCustomSkill(skill)}
                    isCustom
                  />
                ))}
              </View>

              {/* Add custom skill */}
              {showSkillInput ? (
                <View style={styles.customSkillRow}>
                  <TextInput
                    style={styles.customSkillInput}
                    value={customSkillInput}
                    onChangeText={setCustomSkillInput}
                    placeholder="Enter skill name…"
                    placeholderTextColor={COLORS.textMuted}
                    autoFocus
                    onSubmitEditing={addCustomSkill}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.customSkillConfirm} onPress={addCustomSkill}>
                    <AntDesign name="check" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.customSkillCancel}
                    onPress={() => { setShowSkillInput(false); setCustomSkillInput(''); }}
                  >
                    <AntDesign name="close" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addSkillBtn}
                  onPress={() => setShowSkillInput(true)}
                >
                  <AntDesign name="pluscircleo" size={20} color={COLORS.accentLight} />
                  <Text style={styles.addSkillBtnText}>Add Custom Skill</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Company Location ── */}
            <TouchableOpacity
              style={styles.locationField}
              onPress={() => router.push('./LocationPicker')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color="rgba(255,255,255,0.7)"
                style={{ marginRight: 10 }}
              />
              <Text
                style={[styles.locationText, !location && styles.locationPlaceholder]}
                numberOfLines={1}
              >
                {location
                  ? (location.address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`)
                  : 'Tap to set your business location'
                }
              </Text>
              <Ionicons name="map-outline" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            {/* ── BR Number ── */}
            <View style={styles.card}>
              <InputField value={brNumber} onChangeText={setBrNumber} placeholder="BR Number" />
            </View>

            {/* ── Work Portfolio ── */}
            <SectionHeader title="Work Portfolio" />

            {works.map((work, index) => (
              <WorkCard
                key={index}
                index={index}
                work={work}
                onChange={handleWorkChange}
                onRemove={removeWork}
              />
            ))}

            {/* Add Another Works */}
            <TouchableOpacity style={styles.addWorkBtn} onPress={addWork} activeOpacity={0.8}>
              <Text style={styles.addWorkBtnText}>Add Another Works</Text>
              <AntDesign name="pluscircleo" size={18} color={COLORS.accentLight} />
            </TouchableOpacity>

            <Text style={styles.orText}>Or</Text>

            {/* Save button (replaces Edit Details) */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity
              style={styles.skipBtn}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Category Modal ── */}
        <Modal
          visible={categoryModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setCategoryModalVisible(false)}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Category</Text>
              <FlatList
                data={CATEGORIES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, category === item && styles.modalItemSelected]}
                    onPress={() => { setCategory(item); setCategoryModalVisible(false); }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      category === item && styles.modalItemTextSelected,
                    ]}>
                      {item}
                    </Text>
                    {category === item && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              />
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },

  // Header
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
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  headerTitle: {
    color: COLORS.text, fontSize: 17,
    fontWeight: '700', letterSpacing: 0.3,
  },
  headerLogo: {
    width: 90,
    height: 32,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langText: {
    color: COLORS.textSub, fontSize: 13, fontWeight: '600',
  },
  toggleOuter: {
    width: 40, height: 22, borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center', paddingHorizontal: 2, alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Avatar
  avatarWrapper: { alignSelf: 'center', marginBottom: 24 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gradientBot,
  },

  // Card
  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
  },

  // Section header — with side lines
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 18, gap: 10,
  },
  sectionLine: {
    flex: 1, height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionTitle: {
    color: COLORS.sectionTitle, fontSize: 15,
    fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Inputs
  inputWrapper: { marginBottom: 4 },
  inputLabel: {
    color: COLORS.textSub, fontSize: 12, fontWeight: '600',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  input: {
    color: COLORS.text, fontSize: 15, fontWeight: '500',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: COLORS.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.inputBorder, minHeight: 44,
  },
  inputMultiline: { minHeight: 90, paddingTop: 10 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 10 },

  // Dropdown
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
  },
  dropdownPlaceholder: { color: COLORS.textMuted, fontSize: 15 },
  dropdownValue: { color: COLORS.text, fontSize: 15, fontWeight: '600' },

  // Skills — center aligned
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',   // ← center alignment
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.chipBg,
    borderWidth: 1, borderColor: COLORS.chipBorder, gap: 5,
  },
  chipSelected: {
    backgroundColor: COLORS.chipSelected,
    borderColor: COLORS.chipSelected,
  },
  chipText: { color: COLORS.textSub, fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  chipRemove: { marginLeft: 2 },
  addSkillBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    gap: 8, paddingVertical: 6,
  },
  addSkillBtnText: { color: COLORS.accentLight, fontSize: 14, fontWeight: '600' },
  customSkillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  customSkillInput: {
    flex: 1, color: COLORS.text, fontSize: 14,
    backgroundColor: COLORS.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.inputBorder,
    paddingHorizontal: 12, paddingVertical: 8, height: 40,
  },
  customSkillConfirm: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  customSkillCancel: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },

  // Location
  locationField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14,
  },
  locationText: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  locationPlaceholder: { color: COLORS.textMuted, fontWeight: '400' },

  // Work card
  workCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16, marginBottom: 14,
  },
  workCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  workCardTitle: {
    color: COLORS.textSub, fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  attachmentField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.inputBorder,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  attachmentLabel: {
    color: COLORS.textSub, fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  attachmentPlaceholder: { color: COLORS.textMuted, fontSize: 13 },
  attachmentCount: { color: COLORS.accentLight, fontSize: 13, fontWeight: '600' },
  attachmentPreviewRow: { flexDirection: 'row', marginBottom: 8 },
  attachmentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', maxWidth: 140,
  },
  attachmentChipText: { color: COLORS.textSub, fontSize: 11, flex: 1 },

  // Add work
  addWorkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14, marginBottom: 12,
  },
  addWorkBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '700' },

  orText: {
    color: COLORS.textMuted, fontSize: 14,
    textAlign: 'center', marginBottom: 12,
  },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingVertical: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Skip button
  skipBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 13,
  },
  skipBtnText: { color: COLORS.textSub, fontSize: 15, fontWeight: '600' },

  // Category Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0A2060', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 34, paddingHorizontal: 20,
    maxHeight: '65%', borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.divider, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.text, fontSize: 17, fontWeight: '700',
    marginBottom: 16, textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  modalItemSelected: {
    backgroundColor: COLORS.accentGlow, borderRadius: 10,
    paddingHorizontal: 10, marginHorizontal: -10,
  },
  modalItemText: { color: COLORS.textSub, fontSize: 15 },
  modalItemTextSelected: { color: COLORS.text, fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: COLORS.divider },
});