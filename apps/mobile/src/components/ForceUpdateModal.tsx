import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';

interface VersionInfo {
  currentVersion: string;
  minimumVersion: string;
  latestVersion: string;
  updateRequired: boolean;
  updateAvailable: boolean;
  storeUrl: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://o3dlqyos71.execute-api.ap-northeast-1.amazonaws.com/v1';

export function useVersionCheck() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      setIsLoading(true);
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      const platform = Platform.OS;

      const response = await fetch(
        `${API_BASE_URL}/app/version?platform=${platform}&version=${currentVersion}`
      );

      if (!response.ok) {
        throw new Error('Failed to check version');
      }

      const data = await response.json();
      setVersionInfo(data);
    } catch (err) {
      console.error('Version check error:', err);
      setError('バージョン情報を取得できませんでした');
    } finally {
      setIsLoading(false);
    }
  };

  return { versionInfo, isLoading, error, checkVersion };
}

interface ForceUpdateModalProps {
  visible: boolean;
  versionInfo: VersionInfo;
  onDismiss?: () => void;
}

export function ForceUpdateModal({ visible, versionInfo, onDismiss }: ForceUpdateModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const handleUpdate = () => {
    if (versionInfo.storeUrl) {
      Linking.openURL(versionInfo.storeUrl);
    }
  };

  const styles = createStyles(colors);

  const isRequired = versionInfo.updateRequired;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isRequired ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {isRequired ? 'アップデートが必要です' : '新しいバージョンがあります'}
          </Text>

          <Text style={styles.message}>
            {isRequired
              ? 'アプリを継続してご利用いただくには、最新バージョンへのアップデートが必要です。'
              : '新しいバージョンが利用可能です。アップデートすることをお勧めします。'}
          </Text>

          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>
              現在のバージョン: {versionInfo.currentVersion}
            </Text>
            <Text style={styles.versionText}>
              最新バージョン: {versionInfo.latestVersion}
            </Text>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>アップデートする</Text>
          </TouchableOpacity>

          {!isRequired && onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>後で</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// 強制アップデートチェックを行うプロバイダーコンポーネント
export function ForceUpdateProvider({ children }: { children: React.ReactNode }) {
  const { versionInfo, isLoading } = useVersionCheck();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading) {
    return null; // ローディング中は子コンポーネントを表示しない場合
  }

  const showModal =
    versionInfo &&
    (versionInfo.updateRequired || (versionInfo.updateAvailable && !dismissed));

  return (
    <>
      {children}
      {versionInfo && showModal && (
        <ForceUpdateModal
          visible={true}
          versionInfo={versionInfo}
          onDismiss={versionInfo.updateRequired ? undefined : () => setDismissed(true)}
        />
      )}
    </>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modal: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 16,
    },
    versionInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    versionText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginVertical: 2,
    },
    updateButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    updateButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    dismissButton: {
      marginTop: 12,
      padding: 12,
      alignItems: 'center',
    },
    dismissButtonText: {
      color: colors.textMuted,
      fontSize: 14,
    },
  });
