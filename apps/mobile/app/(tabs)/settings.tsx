import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '../../src/constants/Colors';
import { useAuthStore } from '../../src/stores/authStore';
import { useMyProfile } from '../../src/hooks/api';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { logout } = useAuthStore();
  const { data: profile } = useMyProfile();

  // 公開範囲のテキストを取得
  const getVisibilityText = () => {
    if (!profile) return '読み込み中...';
    return profile.isPrivate ? '相互フォローのみ' : '全員に公開';
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('エラー', 'リンクを開けませんでした');
    });
  };

  const handleContact = () => {
    // お問い合わせ用のメールアドレスまたはフォームURL
    const contactEmail = 'support@example.com';
    Linking.openURL(`mailto:${contactEmail}?subject=お問い合わせ`).catch(() => {
      Alert.alert('エラー', 'メールアプリを開けませんでした');
    });
  };

  const styles = createStyles(colors);

  const SettingItem = ({
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false,
    rightElement,
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showArrow && onPress && <Text style={styles.arrow}>›</Text>)}
    </TouchableOpacity>
  );

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="メールアドレスの変更"
            onPress={() => {
              Alert.alert('準備中', 'この機能は準備中です');
            }}
          />
          <SettingItem
            title="パスワードの変更"
            onPress={() => {
              Alert.alert('準備中', 'この機能は準備中です');
            }}
          />
        </View>
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>プライバシー</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="回答の公開範囲"
            subtitle={getVisibilityText()}
            onPress={() => router.push('/settings/visibility')}
          />
          <SettingItem
            title="ブロックリスト"
            onPress={() => router.push('/settings/blocked-users')}
          />
        </View>
      </View>

      {/* Notification Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="通知設定"
            subtitle="プッシュ通知の設定"
            onPress={() => router.push('/settings/notifications')}
          />
        </View>
      </View>

      {/* Share Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>共有</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="プロフィールを共有"
            subtitle="QRコード・リンクで共有"
            onPress={() => router.push('/share-profile')}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>サポート</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="利用規約"
            onPress={() => handleOpenLink('https://example.com/terms')}
          />
          <SettingItem
            title="プライバシーポリシー"
            onPress={() => handleOpenLink('https://example.com/privacy')}
          />
          <SettingItem
            title="お問い合わせ"
            onPress={handleContact}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="バージョン"
            showArrow={false}
            rightElement={<Text style={styles.versionText}>{appVersion}</Text>}
          />
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <SettingItem
            title="ログアウト"
            onPress={handleLogout}
            showArrow={false}
          />
          <SettingItem
            title="アカウント削除"
            onPress={() => router.push('/settings/delete-account')}
            showArrow={false}
            danger
          />
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      paddingHorizontal: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    sectionContent: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.text,
    },
    settingSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    arrow: {
      fontSize: 20,
      color: colors.textMuted,
      marginLeft: 8,
    },
    dangerText: {
      color: colors.danger,
    },
    versionText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    footer: {
      height: 40,
    },
  });
