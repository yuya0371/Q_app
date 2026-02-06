import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../src/constants/Colors';
import { useMyProfile } from '../../src/hooks/api/useUsers';
import { shareProfile, copyProfileUrl, getProfileUrl } from '../../src/utils/sharing';

export default function ShareProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: profile, isLoading } = useMyProfile();
  const [isSharing, setIsSharing] = useState(false);

  const appId = profile?.appId;
  const displayName = profile?.displayName || appId || 'User';
  const profileUrl = appId ? getProfileUrl(appId) : '';

  const handleShare = async () => {
    if (!appId) return;
    setIsSharing(true);
    try {
      await shareProfile(appId, displayName);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!appId) return;
    const copied = await copyProfileUrl(appId);
    if (copied) {
      Alert.alert('コピーしました', 'プロフィールリンクをクリップボードにコピーしました');
    } else {
      Alert.alert('エラー', 'コピーに失敗しました');
    }
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!appId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>プロフィールを取得できませんでした</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'プロフィールを共有',
          headerBackTitle: '戻る',
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* QRコード */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={profileUrl}
                size={180}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.appId}>@{appId}</Text>

          <Text style={styles.urlText}>{profileUrl}</Text>

          {/* アクションボタン */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.shareButtonText}>共有する</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
            >
              <Text style={styles.copyButtonText}>リンクをコピー</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hintText}>
            QRコードをスキャンするか、リンクを共有してプロフィールを見せましょう
          </Text>
        </View>
      </View>
    </>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      padding: 24,
      paddingTop: 40,
    },
    qrContainer: {
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    qrWrapper: {
      backgroundColor: '#FFFFFF',
      padding: 16,
      borderRadius: 12,
    },
    displayName: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    appId: {
      fontSize: 16,
      color: colors.textMuted,
      marginBottom: 16,
    },
    urlText: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 32,
      textAlign: 'center',
    },
    actions: {
      width: '100%',
      gap: 12,
    },
    shareButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    shareButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    copyButton: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    copyButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    hintText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 24,
      lineHeight: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.danger,
      marginBottom: 16,
    },
    backButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
