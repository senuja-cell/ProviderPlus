import React, { useState, useCallback, useEffect } from 'react';
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
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_PICKER_RESULT_KEY } from './LocationPicker';
import {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  uploadPortfolioImages,
  uploadIdentityDocument,
} from './services/providerProfileService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentFile {
  name: string;
  uri: string;
  mimeType?: string;
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

interface CategoryOption {
  id: string;
  name: string;
}

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  editable?: boolean;
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

// ─── Static Skills List ───────────────────────────────────────────────────────

const PREDEFINED_SKILLS: string[] = [
  'Plumbing', 'Electrical', 'Welding', 'Carpentry',
  'Painting', 'Tiling', 'Roofing', 'Masonry',
  'Landscaping', 'HVAC', 'Cleaning', 'Security',
  'IT Support', 'Networking', 'CCTV', 'Solar Panels',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder,
  multiline = false, keyboardType = 'default', editable = true,
}) => (
  <View style={styles.inputWrapper}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? label}
      placeholderTextColor={COLORS.textMuted}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      keyboardType={keyboardType}
      textAlignVertical={multiline ? 'top' : 'center'}
      editable={editable}
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
                { name: `photo_${Date.now()}.jpg`, uri: file.uri, mimeType: 'image/jpeg' },
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
                name: a.fileName ?? `image_${Date.now()}.jpg`,
                uri: a.uri,
                mimeType: a.mimeType ?? 'image/jpeg',
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
                  mimeType: a.mimeType ?? 'application/octet-stream',
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

      <TouchableOpacity style={styles.attachmentField} onPress={handleAttachment} activeOpacity={0.8}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentPreviewRow}>
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

export default function ProviderProfileEdit(): React.JSX.Element {
  // ── Screen-level state ────────────────────────────────────────────────────
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isSaving, setIsSaving]                 = useState<boolean>(false);

  // ── Personal Info ─────────────────────────────────────────────────────────
  const [name, setName]                 = useState<string>('');
  const [email, setEmail]               = useState<string>('');  // display only — not editable
  const [contact, setContact]           = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageChanged, setProfileImageChanged] = useState<boolean>(false);

  // NIC — attachment only
  const [nicAttachments, setNicAttachments] = useState<AttachmentFile[]>([]);

  // ── Service Info ──────────────────────────────────────────────────────────
  // category stores the display name; categoryId stores the actual MongoDB ObjectId
  const [category, setCategory]         = useState<string>('');
  const [categoryId, setCategoryId]     = useState<string>('');
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  // Categories fetched from the backend — falls back to empty until loaded
  const [categories, setCategories]     = useState<CategoryOption[]>([]);
  const [serviceDescription, setServiceDescription] = useState<string>('');

  // ── Skills ────────────────────────────────────────────────────────────────
  const [selectedSkills, setSelectedSkills]     = useState<string[]>([]);
  const [customSkills, setCustomSkills]         = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [showSkillInput, setShowSkillInput]     = useState<boolean>(false);

  // ── Location + BR cert ────────────────────────────────────────────────────
  const [location, setLocation]                 = useState<SelectedLocation | null>(null);
  const [brCertAttachments, setBrCertAttachments] = useState<AttachmentFile[]>([]);

  // ── Portfolio ─────────────────────────────────────────────────────────────
  const [works, setWorks] = useState<WorkItem[]>([
    { name: '', attachments: [], description: '' },
  ]);

  // ── Validation errors ─────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Language toggle ───────────────────────────────────────────────────────
  const [isSinhala, setIsSinhala] = useState<boolean>(false);

  // ── STEP 1: Load existing profile on mount ────────────────────────────────
  // Calls GET /api/provider/me/profile and pre-fills all fields
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();

        // Personal info
        setName(data.name);
        setEmail(data.email);
        setContact(data.phone_number);
        if (data.profile_image) setProfileImage(data.profile_image);

        // Category
        setCategory(data.category.name);
        setCategoryId(data.category.id);

        // Service description
        setServiceDescription(data.description);

        // Skills — split tags into predefined and custom
        const predefinedSet = new Set(PREDEFINED_SKILLS);
        const existingPredefined = data.tags.filter(t => predefinedSet.has(t));
        const existingCustom     = data.tags.filter(t => !predefinedSet.has(t));
        setSelectedSkills(existingPredefined);
        setCustomSkills(existingCustom);

        // Location
        if (data.location?.coordinates) {
          const [lng, lat] = data.location.coordinates;
          setLocation({ latitude: lat, longitude: lng, address: '' });
        }

      } catch (e: any) {
        Alert.alert(
          'Could not load profile',
          e?.response?.data?.detail ?? e?.message ?? 'Please check your connection and try again.',
        );
      } finally {
        setIsLoadingProfile(false);
      }
    })();
  }, []);

  // ── STEP 2: Fetch categories from backend for the dropdown ────────────────
  useEffect(() => {
    (async () => {
      try {
        const { default: apiClient } = await import('./services/apiClient');
        const res = await apiClient.get('category-search/categories');
        // res.data is an array of { id, name, slug, ... }
        setCategories(
          res.data.map((c: any) => ({ id: String(c.id ?? c._id), name: c.name }))
        );
      } catch {
        // Silent — the modal will be empty, provider can still see their existing category
      }
    })();
  }, []);

  // ── Read LocationPicker result when screen comes back into focus ───────────
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(LOCATION_PICKER_RESULT_KEY);
          if (raw) {
            const parsed: SelectedLocation = JSON.parse(raw);
            setLocation(parsed);
            setErrors(e => ({ ...e, location: '' }));
            await AsyncStorage.removeItem(LOCATION_PICKER_RESULT_KEY);
          }
        } catch {
          // ignore
        }
      })();
    }, [])
  );

  // ── Profile image picker ──────────────────────────────────────────────────

  const handlePickProfileImage = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setProfileImageChanged(true);   // flag so we know to upload it on save
    }
  };

  // ── Skills helpers ────────────────────────────────────────────────────────

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

  // ── Work portfolio helpers ────────────────────────────────────────────────

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

  // ── NIC attachment picker ─────────────────────────────────────────────────

  const handleNicAttachment = (): void => {
    Alert.alert(
      'Attach NIC',
      'Choose how to add your NIC',
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
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.9,
            });
            if (!result.canceled && result.assets.length > 0) {
              const file = result.assets[0];
              setNicAttachments(prev => [
                ...prev,
                { name: `nic_${Date.now()}.jpg`, uri: file.uri, mimeType: 'image/jpeg' },
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
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              quality: 0.9,
            });
            if (!result.canceled) {
              const files: AttachmentFile[] = result.assets.map((a) => ({
                name: a.fileName ?? `nic_${Date.now()}.jpg`,
                uri: a.uri,
                mimeType: a.mimeType ?? 'image/jpeg',
              }));
              setNicAttachments(prev => [...prev, ...files]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // ── BR Certificate attachment picker ─────────────────────────────────────

  const handleBrCertAttachment = (): void => {
    Alert.alert(
      'Attach BR Certificate',
      'Choose how to add your document',
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
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.9,
            });
            if (!result.canceled && result.assets.length > 0) {
              const file = result.assets[0];
              setBrCertAttachments(prev => [
                ...prev,
                { name: `br_cert_${Date.now()}.jpg`, uri: file.uri, mimeType: 'image/jpeg' },
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
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              quality: 0.9,
            });
            if (!result.canceled) {
              const files: AttachmentFile[] = result.assets.map((a) => ({
                name: a.fileName ?? `br_cert_${Date.now()}.jpg`,
                uri: a.uri,
                mimeType: a.mimeType ?? 'image/jpeg',
              }));
              setBrCertAttachments(prev => [...prev, ...files]);
            }
          },
        },
        {
          text: 'Files / Documents',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                multiple: true,
                copyToCacheDirectory: true,
              });
              if (!result.canceled && result.assets) {
                const files: AttachmentFile[] = result.assets.map((a) => ({
                  name: a.name,
                  uri: a.uri,
                  mimeType: a.mimeType ?? 'application/pdf',
                }));
                setBrCertAttachments(prev => [...prev, ...files]);
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

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{7,15}$/;

    // Only validate format if the user has actually typed something
    if (email.trim() && !emailRegex.test(email))
      newErrors.email = 'Invalid email format';

    if (contact.trim() && !phoneRegex.test(contact.trim()))
      newErrors.contact = 'Enter a valid contact number (7–15 digits)';

    if (serviceDescription.trim() && serviceDescription.trim().length < 20)
      newErrors.serviceDescription = 'Description too short (min 20 characters)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const err = (field: string) =>
    errors[field]
      ? <Text style={styles.errorText}>{errors[field]}</Text>
      : null;

  // ── STEP 3: Save — calls the API in sequence ──────────────────────────────

  const handleSave = async (): Promise<void> => {
        console.log('SAVE PRESSED - errors will show below');
        console.log('name:', name, '| email:', email, '| contact:', contact);
        console.log('category:', category, '| categoryId:', categoryId);
        console.log('description length:', serviceDescription.length);
        console.log('location:', location);

    if (!validate()) return;

    setIsSaving(true);
    try {
        console.log('Saving profile with:', {
          name: name.trim(),
          phone_number: contact.trim(),
          description: serviceDescription.trim(),
          category_id: categoryId || undefined,
          tags: [...selectedSkills, ...customSkills],
          latitude: location?.latitude,
          longitude: location?.longitude,
        });
      // 1. Save all text fields
      await updateMyProfile({
        name:         name.trim(),
        phone_number: contact.trim(),
        description:  serviceDescription.trim(),
        category_id:  categoryId || undefined,
        tags:         [...selectedSkills, ...customSkills],
        latitude:     location?.latitude,
        longitude:    location?.longitude,
      });

      // 2. Upload profile image if it was changed
      if (profileImageChanged && profileImage) {
        await uploadProfileImage(profileImage);
      }

      // 3. Upload NIC images if any were attached
      if (nicAttachments.length > 0) {
        await uploadIdentityDocument(
          'nic',
          nicAttachments.map(f => ({
            uri:      f.uri,
            name:     f.name,
            mimeType: f.mimeType ?? 'image/jpeg',
          }))
        );
      }

      // 4. Upload BR certificate files if any were attached
      if (brCertAttachments.length > 0) {
        await uploadIdentityDocument(
          'br_certificate',
          brCertAttachments.map(f => ({
            uri:      f.uri,
            name:     f.name,
            mimeType: f.mimeType ?? 'image/jpeg',
          }))
        );
      }

      // 5. Upload portfolio work images
      const allPortfolioImages = works
        .flatMap(w => w.attachments)
        .filter(a => (a.mimeType ?? '').startsWith('image/'))
        .map(a => a.uri);

      if (allPortfolioImages.length > 0) {
        await uploadPortfolioImages(allPortfolioImages);
      }

      Alert.alert('Profile Updated', 'Your provider profile has been saved successfully!');

      // Reset one-time flags
      setProfileImageChanged(false);
      setNicAttachments([]);
      setBrCertAttachments([]);

    } catch (e: any) {
      Alert.alert(
        'Save Failed',
        e?.response?.data?.detail ?? e?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading screen while profile data is being fetched ────────────────────

  if (isLoadingProfile) {
    return (
      <LinearGradient
        colors={[COLORS.gradientTop, COLORS.gradientBot]}
        style={[styles.gradient, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: COLORS.textSub, marginTop: 14, fontSize: 15, fontWeight: '600' }}>
          Loading your profile…
        </Text>
      </LinearGradient>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={[COLORS.gradientTop, COLORS.gradientBot]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Image
              source={require('../assets/images/provider-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.headerTitle}>Provider Profile</Text>

          <View style={styles.languageToggle}>
            <Text style={[styles.langLabel, !isSinhala && styles.langLabelActive]}>ENG</Text>
            <Text style={styles.langDivider}>|</Text>
            <Text style={[styles.langLabel, isSinhala && styles.langLabelActive]}>සිං</Text>
            <Switch
              value={isSinhala}
              onValueChange={() => setIsSinhala(v => !v)}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#FF6B35' }}
              thumbColor={isSinhala ? '#fff' : '#f0f0f0'}
              ios_backgroundColor="rgba(255,255,255,0.3)"
              style={styles.switchStyle}
            />
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
              <InputField
                label="Name"
                value={name}
                onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
              />
              {err('name')}
              <View style={styles.divider} />

              {/* Email is read-only — shown for reference but cannot be changed */}
              <InputField
                label="Email"
                value={email}
                onChangeText={() => {}}
                editable={false}
              />
              <View style={styles.divider} />

              <InputField
                label="Contact No."
                value={contact}
                onChangeText={(t) => { setContact(t); setErrors(e => ({ ...e, contact: '' })); }}
                keyboardType="phone-pad"
              />
              {err('contact')}

              <View style={styles.divider} />

              {/* NIC — attachment only */}
              <Text style={styles.inputLabel}>NIC</Text>
              <TouchableOpacity
                style={styles.brCertField}
                onPress={handleNicAttachment}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.attachmentLabel}>Attachments</Text>
                  {nicAttachments.length === 0 ? (
                    <Text style={styles.attachmentPlaceholder}>
                      Attach front &amp; back photos of your NIC
                    </Text>
                  ) : (
                    <Text style={styles.attachmentCount}>
                      {nicAttachments.length} photo{nicAttachments.length > 1 ? 's' : ''} attached
                    </Text>
                  )}
                </View>
                <Feather name="id-card" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              {nicAttachments.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentPreviewRow}>
                  {nicAttachments.map((file, fi) => (
                    <View key={fi} style={styles.attachmentChip}>
                      <Feather name="image" size={12} color={COLORS.accentLight} />
                      <Text style={styles.attachmentChipText} numberOfLines={1}>
                        {file.name.length > 14 ? file.name.slice(0, 12) + '…' : file.name}
                      </Text>
                      <TouchableOpacity onPress={() => setNicAttachments(prev => prev.filter((_, i) => i !== fi))}>
                        <AntDesign name="close" size={10} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* ── Service Information ── */}
            <SectionHeader title="Service Information" />

            {/* Category */}
            <TouchableOpacity
              style={[styles.dropdown, errors.category ? styles.inputError : null]}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={category ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {category || 'Category'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
            {err('category')}

            {/* Service Description */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Service Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, errors.serviceDescription ? styles.inputError : null]}
                value={serviceDescription}
                onChangeText={(t) => { setServiceDescription(t); setErrors(e => ({ ...e, serviceDescription: '' })); }}
                placeholder="Enter A Description About You"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {err('serviceDescription')}
            </View>

            {/* ── Skills ── */}
            <View style={styles.card}>
              <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 14 }]}>
                Skills
              </Text>
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
                <TouchableOpacity style={styles.addSkillBtn} onPress={() => setShowSkillInput(true)}>
                  <AntDesign name="plus-circle" size={20} color={COLORS.accentLight} />
                  <Text style={styles.addSkillBtnText}>Add Custom Skill</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Company Location ── */}
            <TouchableOpacity
              style={[styles.locationField, errors.location ? styles.inputError : null]}
              onPress={() => router.push('./LocationPicker')}
              activeOpacity={0.8}
            >
              <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.7)" style={{ marginRight: 10 }} />
              <Text style={[styles.locationText, !location && styles.locationPlaceholder]} numberOfLines={1}>
                {location
                  ? (location.address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`)
                  : 'Tap to set your business location'
                }
              </Text>
              <Ionicons name="map-outline" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            {err('location')}

            {/* ── BR Certificate ── */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>BR Certificate</Text>
              <TouchableOpacity style={styles.brCertField} onPress={handleBrCertAttachment} activeOpacity={0.8}>
                <View>
                  <Text style={styles.attachmentLabel}>Attachments</Text>
                  {brCertAttachments.length === 0 ? (
                    <Text style={styles.attachmentPlaceholder}>
                      Attach photos or PDF of your BR certificate
                    </Text>
                  ) : (
                    <Text style={styles.attachmentCount}>
                      {brCertAttachments.length} file{brCertAttachments.length > 1 ? 's' : ''} attached
                    </Text>
                  )}
                </View>
                <Feather name="paperclip" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              {brCertAttachments.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentPreviewRow}>
                  {brCertAttachments.map((file, fi) => (
                    <View key={fi} style={styles.attachmentChip}>
                      <Feather name="file" size={12} color={COLORS.accentLight} />
                      <Text style={styles.attachmentChipText} numberOfLines={1}>
                        {file.name.length > 14 ? file.name.slice(0, 12) + '…' : file.name}
                      </Text>
                      <TouchableOpacity onPress={() => setBrCertAttachments(prev => prev.filter((_, i) => i !== fi))}>
                        <AntDesign name="close" size={10} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
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

            <TouchableOpacity style={styles.addWorkBtn} onPress={addWork} activeOpacity={0.8}>
              <Text style={styles.addWorkBtnText}>Add Another Works</Text>
              <AntDesign name="plus-circle" size={18} color={COLORS.accentLight} />
            </TouchableOpacity>

            <Text style={styles.orText}>Or</Text>

            {/* Skip */}
            <TouchableOpacity style={styles.skipBtn} activeOpacity={0.8} onPress={() => router.back()}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>

            <View style={{ height: 16 }} />

            {/* Save Profile */}
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Category Modal — shows categories from backend ── */}
        <Modal
          visible={categoryModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Category</Text>
              {categories.length === 0 ? (
                <ActivityIndicator color={COLORS.accentLight} style={{ marginTop: 20 }} />
              ) : (
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalItem, category === item.name && styles.modalItemSelected]}
                      onPress={() => {
                        setCategory(item.name);
                        setCategoryId(item.id);
                        setCategoryModalVisible(false);
                        setErrors(e => ({ ...e, category: '' }));
                      }}
                    >
                      <Text style={[
                        styles.modalItemText,
                        category === item.name && styles.modalItemTextSelected,
                      ]}>
                        {item.name}
                      </Text>
                      {category === item.name && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
                />
              )}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBack: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  headerLogo: { width: 80, height: 28 },
  languageToggle: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  langLabel: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13, marginHorizontal: 3 },
  langLabelActive: { color: 'white' },
  langDivider: { color: 'rgba(255,255,255,0.4)', marginHorizontal: 2 },
  switchStyle: { marginLeft: 6, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  avatarWrapper: { alignSelf: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1A6BFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#022373',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  inputWrapper: { marginBottom: 4 },
  inputLabel: {
    color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: '600',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  input: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '500',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', minHeight: 44,
  },
  inputMultiline: { minHeight: 90, paddingTop: 10 },
  inputDisabled: { opacity: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 10 },
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
  },
  dropdownPlaceholder: { color: 'rgba(255,255,255,0.45)', fontSize: 15 },
  dropdownValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  chipsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8, marginBottom: 14,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', gap: 5,
  },
  chipSelected: { backgroundColor: '#1A6BFF', borderColor: '#1A6BFF' },
  chipText: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  chipRemove: { marginLeft: 2 },
  addSkillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  addSkillBtnText: { color: '#4DA3FF', fontSize: 14, fontWeight: '600' },
  customSkillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  customSkillInput: {
    flex: 1, color: '#FFFFFF', fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12, paddingVertical: 8, height: 40,
  },
  customSkillConfirm: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1A6BFF', alignItems: 'center', justifyContent: 'center',
  },
  customSkillCancel: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  brCertField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, marginTop: 6,
  },
  locationField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14,
  },
  locationText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  locationPlaceholder: { color: 'rgba(255,255,255,0.45)', fontWeight: '400' },
  workCard: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    padding: 16, marginBottom: 14,
  },
  workCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  workCardTitle: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  attachmentField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  attachmentLabel: { color: 'rgba(255,255,255,0.70)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  attachmentPlaceholder: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  attachmentCount: { color: '#4DA3FF', fontSize: 13, fontWeight: '600' },
  attachmentPreviewRow: { flexDirection: 'row', marginBottom: 8 },
  attachmentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', maxWidth: 140,
  },
  attachmentChipText: { color: 'rgba(255,255,255,0.70)', fontSize: 11, flex: 1 },
  addWorkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14, marginBottom: 12,
  },
  addWorkBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  orText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  skipBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 13,
  },
  skipBtnText: { color: 'rgba(255,255,255,0.70)', fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingVertical: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12,
    minHeight: 54,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  errorText: { color: '#FFD700', fontSize: 12, fontWeight: '600', marginLeft: 4, marginTop: 4, marginBottom: 4 },
  inputError: { borderColor: '#FFD700', borderWidth: 1.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0A2060', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 34, paddingHorizontal: 20,
    maxHeight: '65%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(26,107,255,0.25)', borderRadius: 10,
    paddingHorizontal: 10, marginHorizontal: -10,
  },
  modalItemText: { color: 'rgba(255,255,255,0.70)', fontSize: 15 },
  modalItemTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
});
