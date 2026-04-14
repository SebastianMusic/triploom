import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GeneralCamera from '@/components/camera/general-camera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type EditProfileScreenProps = {
  avatarUrl: string;
  fullName: string;
  mobileNumber: string;
  onAvatarUrlChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onMobileNumberChange: (value: string) => void;
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
  errorMessage?: string | null;
};

type AvatarModal = 'none' | 'menu' | 'camera' | 'view';

export default function EditProfileScreen({
  avatarUrl,
  fullName,
  mobileNumber,
  onAvatarUrlChange,
  onFullNameChange,
  onMobileNumberChange,
  onBack,
  onSave,
  isSaving = false,
  errorMessage,
}: EditProfileScreenProps) {
  const [activeModal, setActiveModal] = useState<AvatarModal>('none');
  const insets = useSafeAreaInsets();

  const initials =
    fullName
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join('') || 'U';

  function handlePhotoTaken(uri: string) {
    onAvatarUrlChange(uri);
    setActiveModal('none');
  }

  async function handlePickFromLibrary() {
    // Hide the overlay synchronously — it's a plain View, not a Modal,
    // so there is no native ViewController/Activity to wait for.
    // The image picker can open immediately and reliably on both platforms.
    setActiveModal('none');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onAvatarUrlChange(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.root}>
      {/* ── Camera ── */}
      <Modal
        visible={activeModal === 'camera'}
        animationType="slide"
        onRequestClose={() => setActiveModal('none')}
      >
        <GeneralCamera
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setActiveModal('none')}
        />
      </Modal>

      {/* ── Full-screen photo viewer ── */}
      <Modal
        visible={activeModal === 'view'}
        animationType="fade"
        onRequestClose={() => setActiveModal('none')}
      >
        <View style={styles.viewer}>
          <Image source={{ uri: avatarUrl }} style={styles.viewerImage} resizeMode="contain" />
          <Pressable
            style={[styles.viewerClose, { top: insets.top + 12 }]}
            onPress={() => setActiveModal('none')}
            hitSlop={12}
          >
            <ThemedText style={styles.viewerCloseText}>✕</ThemedText>
          </Pressable>
        </View>
      </Modal>

      {/* ── Main form ── */}
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Edit Profile</ThemedText>
        <ThemedText style={styles.subtitle}>
          Update your profile picture and full name.
        </ThemedText>

        <ThemedView style={styles.card}>
          <View style={styles.avatarWrapper}>
            <Pressable
              style={({ pressed }) => [styles.avatarPressable, pressed && styles.buttonPressed]}
              onPress={() => setActiveModal('menu')}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarText}>{initials}</ThemedText>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <ThemedText style={styles.cameraBadgeText}>📷</ThemedText>
              </View>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold">Full Name</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={onFullNameChange}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText type="defaultSemiBold">Mobile Number</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your mobile number"
              value={mobileNumber}
              onChangeText={onMobileNumberChange}
              keyboardType="phone-pad"
            />
          </View>

          {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}
        </ThemedView>

        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={onBack}
            disabled={isSaving}
          >
            <ThemedText style={styles.secondaryButtonText}>Back</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Save Changes</ThemedText>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Bottom-sheet menu — AFTER ScrollView so it renders on top (React Native
          paints later siblings on top). Plain View overlay instead of Modal so the
          image picker can open immediately without waiting for a native ViewController
          to dismiss. ── */}
      {activeModal === 'menu' && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={() => setActiveModal('none')}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.sheetHandle} />

            <ThemedText style={styles.sheetTitle}>Profile photo</ThemedText>

            {avatarUrl ? (
              <Pressable
                style={styles.sheetOption}
                onPress={() => setActiveModal('view')}
              >
                <ThemedText style={styles.sheetOptionText}>View profile picture</ThemedText>
              </Pressable>
            ) : null}

            <View style={styles.sheetDivider} />

            <Pressable
              style={styles.sheetOption}
              onPress={() => setActiveModal('camera')}
            >
              <ThemedText style={styles.sheetOptionText}>Take photo</ThemedText>
            </Pressable>

            <View style={styles.sheetDivider} />

            <Pressable
              style={styles.sheetOption}
              onPress={handlePickFromLibrary}
            >
              <ThemedText style={styles.sheetOptionText}>Choose from library</ThemedText>
            </Pressable>

            <View style={styles.sheetDivider} />

            <Pressable
              style={styles.sheetOption}
              onPress={() => setActiveModal('none')}
            >
              <ThemedText style={styles.sheetCancelText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  subtitle: {
    color: '#6b7280',
    marginTop: -4,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeText: {
    fontSize: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },

  /* Bottom-sheet */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    marginBottom: 16,
  },
  sheetTitle: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
    color: '#6b7280',
    paddingBottom: 12,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
  },
  sheetOption: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sheetOptionText: {
    fontSize: 17,
    color: '#111827',
  },
  sheetCancelText: {
    fontSize: 17,
    color: '#6b7280',
  },

  /* Full-screen photo viewer */
  viewer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerClose: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
