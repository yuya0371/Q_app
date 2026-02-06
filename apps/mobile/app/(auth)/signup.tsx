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
import { router } from 'expo-router';
import { useStyles } from '../../src/hooks/useStyles';
import { useSignup } from '../../src/hooks/api';
import { getErrorMessage } from '../../src/utils/errorHandler';

export default function SignupScreen() {
  const { colors, spacing, fontSize, borderRadius } = useStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');

  const signupMutation = useSignup();

  const parseBirthDate = (date: string): { year: number; month: number; day: number } | null => {
    // YYYYMMDD形式（8桁）
    if (/^\d{8}$/.test(date)) {
      return {
        year: parseInt(date.slice(0, 4), 10),
        month: parseInt(date.slice(4, 6), 10),
        day: parseInt(date.slice(6, 8), 10),
      };
    }
    // YYYY/MM/DD または YYYY-MM-DD形式
    const match = date.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
        day: parseInt(match[3], 10),
      };
    }
    return null;
  };

  // API送信用にYYYY-MM-DD形式に変換
  const formatBirthDateForApi = (date: string): string | null => {
    const parsed = parseBirthDate(date);
    if (!parsed) return null;
    const { year, month, day } = parsed;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const validateBirthDate = (date: string): boolean => {
    const parsed = parseBirthDate(date);
    if (!parsed) return false;

    const { year, month, day } = parsed;
    const dateObj = new Date(year, month - 1, day);

    // 有効な日付かチェック
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      return false;
    }

    // 13歳以上かチェック
    const today = new Date();
    const age = today.getFullYear() - year;
    if (age < 13 || (age === 13 && today < new Date(today.getFullYear(), month - 1, day))) {
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !birthDate) {
      setError('すべての項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (!validateBirthDate(birthDate)) {
      setError('有効な生年月日を入力してください（13歳以上）');
      return;
    }

    const formattedBirthDate = formatBirthDateForApi(birthDate);
    if (!formattedBirthDate) {
      setError('生年月日の形式が正しくありません');
      return;
    }

    setError('');

    signupMutation.mutate(
      { email, password, birthDate: formattedBirthDate },
      {
        onSuccess: () => {
          // メール確認画面へ遷移（emailを渡す）
          router.push({
            pathname: '/(auth)/verify-email',
            params: { email },
          });
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
              editable={!signupMutation.isPending}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>パスワード</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="8文字以上"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!signupMutation.isPending}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>パスワード（確認）</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="パスワードを再入力"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!signupMutation.isPending}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>生年月日</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="20010101 または 2001/01/01"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              editable={!signupMutation.isPending}
            />
            <Text style={styles.hint}>
              年齢確認のために使用します。公開されません。
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, signupMutation.isPending && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>登録する</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            登録することで、
            <Text style={styles.termsLink}>利用規約</Text>
            および
            <Text style={styles.termsLink}>プライバシーポリシー</Text>
            に同意したものとみなされます。
          </Text>
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
      padding: spacing.lg,
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
    hint: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: spacing.xs,
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
    terms: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 18,
    },
    termsLink: {
      color: colors.accent,
    },
  });
