import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useTheme } from '../src/hooks/useTheme';
import { useAuthHydration } from '../src/hooks/useAuthHydration';
import { useDeepLinking } from '../src/hooks/useDeepLinking';
import { initSentry } from '../src/services/sentry';
import { createPersistedQueryClient, persistOptions } from '../src/services/queryPersister';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { ForceUpdateProvider } from '../src/components/ForceUpdateModal';

// Initialize Sentry
initSentry();

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create persisted query client
const queryClient = createPersistedQueryClient();

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const isHydrated = useAuthHydration();

  // ディープリンク処理
  useDeepLinking();

  useEffect(() => {
    // 認証状態のハイドレーションが完了したらスプラッシュ画面を非表示
    if (isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  // ハイドレーション完了まではローディング表示
  if (!isHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ForceUpdateProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OfflineBanner />
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
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ForceUpdateProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
