import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';

export default function SettingsLayout() {
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
      }}
    >
      <Stack.Screen
        name="visibility"
        options={{
          title: '回答の公開範囲',
        }}
      />
      <Stack.Screen
        name="blocked-users"
        options={{
          title: 'ブロックリスト',
        }}
      />
      <Stack.Screen
        name="delete-account"
        options={{
          title: 'アカウント削除',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: '通知設定',
        }}
      />
    </Stack>
  );
}
