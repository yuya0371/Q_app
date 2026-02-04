import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerBackTitle: '戻る',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'ログイン',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: '新規登録',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'パスワードをお忘れの方',
        }}
      />
      <Stack.Screen
        name="verify-email"
        options={{
          title: 'メール確認',
        }}
      />
      <Stack.Screen
        name="set-app-id"
        options={{
          title: 'アプリIDの設定',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="set-profile"
        options={{
          title: 'プロフィールの設定',
        }}
      />
    </Stack>
  );
}
