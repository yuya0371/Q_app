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
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useSetAppId } from '../../src/hooks/api/useAuth';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function SetAppIdScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const setAppIdMutation = useSetAppId();

  const [appId, setAppId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Validate app ID format
  const validateAppId = (id: string) => {
    // 3-20 characters, alphanumeric and underscore only
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(id);
  };

  const handleAppIdChange = (value: string) => {
    // Only allow alphanumeric and underscore
    const filtered = value.replace(/[^a-zA-Z0-9_]/g, '');
    setAppId(filtered);
    setError('');
    setIsAvailable(null);
  };

  const checkAvailability = async () => {
    if (!validateAppId(appId)) {
      setError('3〜20文字の半角英数字とアンダースコアのみ使用できます');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      // TODO: Implement actual availability check via API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate check (in real app, this would be an API call)
      const available = !['admin', 'test', 'user'].includes(appId.toLowerCase());
      setIsAvailable(available);

      if (!available) {
        setError('このIDは既に使用されています');
      }
    } catch (err) {
      setError('確認中にエラーが発生しました');
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinue = async () => {
    if (!validateAppId(appId)) {
      setError('3〜20文字の半角英数字とアンダースコアのみ使用できます');
      return;
    }

    if (isAvailable !== true) {
      setError('IDの利用可能確認を行ってください');
      return;
    }

    setError('');

    try {
      await setAppIdMutation.mutateAsync({ appId });
      router.push('/(auth)/set-profile');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      if (message.includes('already taken') || message.includes('既に使用')) {
        setError('このIDは既に使用されています');
        setIsAvailable(false);
      } else if (message.includes('already set') || message.includes('変更できません')) {
        setError('IDは既に設定済みです');
      } else {
        setError('設定に失敗しました。もう一度お試しください。');
      }
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>アプリ内IDを決めましょう</Text>
        <Text style={styles.description}>
          このIDはあなたのプロフィールURLに使用されます。{'\n'}
          後から変更することはできません。
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>アプリ内ID</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.prefix}>@</Text>
            <TextInput
              style={styles.input}
              value={appId}
              onChangeText={handleAppIdChange}
              placeholder="your_id"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {isAvailable === true && (
              <Text style={styles.checkMark}>✓</Text>
            )}
          </View>
          <Text style={styles.hint}>
            3〜20文字の半角英数字とアンダースコア(_)のみ
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkButton,
            (isChecking || appId.length < 3) && styles.buttonDisabled,
          ]}
          onPress={checkAvailability}
          disabled={isChecking || appId.length < 3}
        >
          {isChecking ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={styles.checkButtonText}>利用可能か確認</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[
            styles.button,
            (setAppIdMutation.isPending || isAvailable !== true) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={setAppIdMutation.isPending || isAvailable !== true}
        >
          {setAppIdMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>次へ</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
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
      lineHeight: 22,
      marginBottom: 32,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: 16,
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
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    prefix: {
      fontSize: 16,
      color: colors.textMuted,
      paddingLeft: 16,
    },
    input: {
      flex: 1,
      padding: 16,
      paddingLeft: 4,
      fontSize: 16,
      color: colors.text,
    },
    checkMark: {
      fontSize: 18,
      color: colors.success,
      paddingRight: 16,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    checkButton: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    checkButtonText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '500',
    },
    spacer: {
      flex: 1,
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
  });
