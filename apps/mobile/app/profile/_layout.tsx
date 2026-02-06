import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';

export default function ProfileLayout() {
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
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="edit"
        options={{
          title: 'プロフィール編集',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="following"
        options={{
          title: 'フォロー中',
        }}
      />
      <Stack.Screen
        name="followers"
        options={{
          title: 'フォロワー',
        }}
      />
      <Stack.Screen
        name="answers"
        options={{
          title: '過去の回答',
        }}
      />
      <Stack.Screen
        name="share"
        options={{
          title: 'プロフィール共有',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
