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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useStyles } from '../../src/hooks/useStyles';
import { useForgotPassword, useResetPassword } from '../../src/hooks/api';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function ForgotPasswordScreen() {
  const { colors, spacing, fontSize, borderRadius } = useStyles();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  const handleSendCode = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    setError('');
    setSuccessMessage('');

    forgotPasswordMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setStep('reset');
          setSuccessMessage('確認コードを送信しました');
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      }
    );
  };

  const handleResetPassword = async () => {
    if (!code || code.length !== 6) {
      setError('6桁の確認コードを入力してください');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setError('');
    setSuccessMessage('');

    resetPasswordMutation.mutate(
      { email, code, newPassword },
      {
        onSuccess: () => {
          router.replace('/(auth)/login');
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      }
    );
  };

  const isLoading = forgotPasswordMutation.isPending || resetPasswordMutation.isPending;
  const styles = createStyles(colors, spacing, fontSize, borderRadius);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {step === 'email' ? (
            <>
              <Text style={styles.description}>
                登録したメールアドレスを入力してください。{'\n'}
                パスワードリセット用のコードを送信します。
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>メールアドレス</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>コードを送信</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.description}>
                メールに送信された6桁のコードと{'\n'}
                新しいパスワードを入力してください。
              </Text>

              {successMessage ? (
                <Text style={styles.successText}>{successMessage}</Text>
              ) : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>確認コード</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>新しいパスワード</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="8文字以上"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>パスワードを変更</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep('email');
                  setError('');
                  setSuccessMessage('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>メールアドレスを変更</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
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
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
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
      marginBottom: spacing.md,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    backButton: {
      alignItems: 'center',
      marginTop: spacing.md,
      padding: spacing.sm,
    },
    backButtonText: {
      color: colors.accent,
      fontSize: fontSize.sm,
    },
  });
