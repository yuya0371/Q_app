import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/Colors';
import { useAuthStore } from '../../src/stores/authStore';

export default function SetProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { updateUser, setOnboardingComplete } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('写真へのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement actual API call to save profile
      // Including image upload to S3
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateUser({
        displayName: displayName || undefined,
        profileImageUrl: profileImage || undefined,
      });
      setOnboardingComplete();

      router.replace('/(tabs)');
    } catch (err) {
      setError('設定に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setOnboardingComplete();
    router.replace('/(tabs)');
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>プロフィールを設定しましょう</Text>
        <Text style={styles.description}>
          あとからいつでも変更できます。
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>+</Text>
            </View>
          )}
          <Text style={styles.imageHint}>タップして写真を選択</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>表示名（任意）</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="表示名"
            placeholderTextColor={colors.textMuted}
            maxLength={20}
          />
          <Text style={styles.hint}>
            1〜20文字（設定しない場合はアプリ内IDが表示されます）
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>自己紹介（任意）</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="自己紹介を入力"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={150}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>{bio.length}/150</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>完了</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>
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
    scrollContent: {
      flexGrow: 1,
      padding: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: 16,
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    imagePlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePlaceholderText: {
      fontSize: 40,
      color: colors.textMuted,
    },
    imageHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
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
    bioInput: {
      height: 100,
      paddingTop: 16,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    spacer: {
      flex: 1,
      minHeight: 24,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    skipButton: {
      padding: 16,
      alignItems: 'center',
    },
    skipText: {
      color: colors.textMuted,
      fontSize: 14,
    },
  });
