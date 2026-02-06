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
import { router, useLocalSearchParams } from 'expo-router';
import { useStyles } from '../../src/hooks/useStyles';
import { useConfirmEmail, useResendCode } from '../../src/hooks/api';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function VerifyEmailScreen() {
  const { colors, spacing, fontSize, borderRadius } = useStyles();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const confirmEmailMutation = useConfirmEmail();
  const resendCodeMutation = useResendCode();

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('6桁の確認コードを入力してください');
      return;
    }

    if (!email) {
      setError('メールアドレスが見つかりません。もう一度登録してください。');
      return;
    }

    setError('');
    setSuccessMessage('');

    confirmEmailMutation.mutate(
      { email, code },
      {
        onSuccess: () => {
          // メール確認完了、ログイン画面へ誘導
          setSuccessMessage('メール確認が完了しました。ログインしてください。');
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 1500);
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      }
    );
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('メールアドレスが見つかりません。もう一度登録してください。');
      return;
    }

    setError('');
    setSuccessMessage('');

    resendCodeMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setSuccessMessage('確認コードを再送信しました');
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      }
    );
  };

  const isLoading = confirmEmailMutation.isPending;
  const styles = createStyles(colors, spacing, fontSize, borderRadius);

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
          {email ? `${email} に` : '登録したメールアドレスに'}
          確認コードを送信しました。{'\n'}
          6桁のコードを入力してください。
        </Text>

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}
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
            editable={!isLoading}
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
          disabled={resendCodeMutation.isPending}
        >
          {resendCodeMutation.isPending ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={styles.resendText}>コードを再送信</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useStyles>['colors'],
  spacing: ReturnType<typeof useStyles>['spacing'],
  fontSize: ReturnType<typeof useStyles>['fontSize'],
  borderRadius: ReturnType<typeof useStyles>['borderRadius']
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      marginBottom: spacing.lg,
    },
    icon: {
      fontSize: 64,
    },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    description: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    successText: {
      color: colors.success,
      fontSize: fontSize.sm,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    errorText: {
      color: colors.danger,
      fontSize: fontSize.sm,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    inputContainer: {
      width: '100%',
      marginBottom: spacing.md,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      fontSize: fontSize.xxl,
      fontWeight: '600',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      letterSpacing: 8,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      width: '100%',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    resendButton: {
      marginTop: spacing.md,
      padding: spacing.sm,
    },
    resendText: {
      color: colors.accent,
      fontSize: fontSize.sm,
    },
  });
