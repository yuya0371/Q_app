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

export default function VerifyEmailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('6桁の確認コードを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement actual verification with Cognito
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to app ID setup
      router.replace('/(auth)/set-app-id');
    } catch (err) {
      setError('確認コードが正しくありません');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');

    try {
      // TODO: Implement resend code with Cognito
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Show success message
    } catch (err) {
      setError('コードの再送信に失敗しました');
    } finally {
      setIsResending(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉️</Text>
        </View>

        <Text style={styles.title}>メールを確認してください</Text>
        <Text style={styles.description}>
          登録したメールアドレスに確認コードを送信しました。{'\n'}
          6桁のコードを入力してください。
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>確認する</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={styles.resendText}>コードを再送信</Text>
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      marginBottom: 24,
    },
    icon: {
      fontSize: 64,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
      marginBottom: 16,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      letterSpacing: 8,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      width: '100%',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    resendButton: {
      marginTop: 16,
      padding: 12,
    },
    resendText: {
      color: colors.accent,
      fontSize: 14,
    },
  });
