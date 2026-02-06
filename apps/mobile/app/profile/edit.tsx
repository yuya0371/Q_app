import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/Colors';
import {
  useMyProfile,
  useUpdateProfile,
  useUpdateProfileImage,
  useDeleteProfileImage,
} from '../../src/hooks/api/useUsers';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: profile, isLoading } = useMyProfile();
  const updateProfileMutation = useUpdateProfile();
  const updateImageMutation = useUpdateProfileImage();
  const deleteImageMutation = useDeleteProfileImage();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert('エラー', getErrorMessage(err));
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', '画像を選択するにはカメラロールへのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
      try {
        await updateImageMutation.mutateAsync({ imageUri: result.assets[0].uri });
        Alert.alert('完了', 'プロフィール画像を更新しました');
      } catch (err) {
        setLocalImageUri(null);
        Alert.alert('エラー', getErrorMessage(err));
      }
    }
  };

  const handleDeleteImage = () => {
    Alert.alert(
      '画像を削除',
      'プロフィール画像を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteImageMutation.mutateAsync();
              setLocalImageUri(null);
            } catch (err) {
              Alert.alert('エラー', getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  const isSaving = updateProfileMutation.isPending;
  const isUploadingImage = updateImageMutation.isPending;
  const currentImageUri = localImageUri || profile?.profileImageUrl;
  const initial = (displayName || profile?.appId || 'U').charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Save button in header area */}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploadingImage}>
            {currentImageUri ? (
              <Image source={{ uri: currentImageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploadingImage}>
            <Text style={styles.changePhotoText}>写真を変更</Text>
          </TouchableOpacity>
          {currentImageUri && (
            <TouchableOpacity onPress={handleDeleteImage}>
              <Text style={styles.deletePhotoText}>写真を削除</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>表示名</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="表示名を入力"
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />
            <Text style={styles.charCount}>{displayName.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>アプリ内ID</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledText}>@{profile?.appId || 'unknown'}</Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
            <Text style={styles.hint}>IDは変更できません</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>自己紹介</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="自己紹介を入力"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 16,
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    cancelButton: {
      padding: 8,
    },
    cancelText: {
      color: colors.textMuted,
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: '600',
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    changePhotoText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 12,
    },
    deletePhotoText: {
      color: colors.danger,
      fontSize: 14,
      marginTop: 8,
    },
    form: {
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 100,
    },
    charCount: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'right',
    },
    disabledInput: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabledText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    lockIcon: {
      fontSize: 14,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });
