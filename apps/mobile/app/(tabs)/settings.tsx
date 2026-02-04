import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useAuthStore } from '../../src/stores/authStore';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { logout } = useAuthStore();

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('確認', '本当に削除しますか？', [
              { text: 'キャンセル', style: 'cancel' },
              {
                text: '削除',
                style: 'destructive',
                onPress: () => {
                  // TODO: Call API to delete account
                },
              },
            ]);
          },
        },
      ]
    );
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

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="メールアドレスの変更"
            onPress={() => {
              // TODO: Navigate to email change screen
            }}
          />
          <SettingItem
            title="パスワードの変更"
            onPress={() => {
              // TODO: Navigate to password change screen
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
            subtitle="相互フォローのみ"
            onPress={() => {
              // TODO: Navigate to visibility settings
            }}
          />
          <SettingItem
            title="ブロックリスト"
            onPress={() => {
              // TODO: Navigate to block list
            }}
          />
        </View>
      </View>

      {/* Notification Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="今日の質問通知"
            showArrow={false}
            rightElement={
              <Switch
                value={true}
                onValueChange={() => {
                  // TODO: Toggle notification
                }}
                trackColor={{ true: colors.accent }}
              />
            }
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>サポート</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            title="利用規約"
            onPress={() => {
              // TODO: Open terms
            }}
          />
          <SettingItem
            title="プライバシーポリシー"
            onPress={() => {
              // TODO: Open privacy policy
            }}
          />
          <SettingItem
            title="お問い合わせ"
            onPress={() => {
              // TODO: Open contact
            }}
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
            rightElement={<Text style={styles.versionText}>1.0.0</Text>}
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
            onPress={handleDeleteAccount}
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
