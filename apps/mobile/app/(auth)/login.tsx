import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useStyles } from '../../src/hooks/useStyles';
import { useLogin } from '../../src/hooks/api';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function LoginScreen() {
  const { colors, spacing, fontSize, borderRadius } = useStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useLogin();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setError('');

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          // オンボーディング完了済みならホームへ、未完了ならアプリID設定へ
          if (data.user?.appId) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/set-app-id');
          }
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      }
    );
  };

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
        <View style={styles.header}>
          <Text style={styles.logo}>Q.</Text>
          <Text style={styles.subtitle}>毎日ひとつの質問に答えよう</Text>
        </View>

        <View style={styles.form}>
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
              editable={!loginMutation.isPending}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>パスワード</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="パスワード"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!loginMutation.isPending}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loginMutation.isPending && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>ログイン</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>パスワードをお忘れの方</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>アカウントをお持ちでない方</Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>新規登録</Text>
            </TouchableOpacity>
          </Link>
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
      justifyContent: 'center',
      padding: spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    logo: {
      fontSize: 64,
      fontWeight: '700',
      color: colors.accent,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    form: {
      width: '100%',
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
    linkButton: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    linkText: {
      color: colors.accent,
      fontSize: fontSize.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
    },
    footerLink: {
      color: colors.accent,
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
  });
