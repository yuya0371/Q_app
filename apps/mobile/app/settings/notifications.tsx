import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const {
    permissionStatus,
    registerForPushNotifications,
    unregisterPushNotifications,
    checkPermissions,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    const status = await checkPermissions();
    setNotificationsEnabled(status === 'granted');
  };

  const handleToggle = async (value: boolean) => {
    setIsLoading(true);
    try {
      if (value) {
        const token = await registerForPushNotifications();
        // 許可後に状態を再チェックして同期
        await checkPermissionStatus();
        if (token) {
          Alert.alert('完了', 'プッシュ通知を有効にしました');
        } else {
          // 権限が拒否された場合
          Alert.alert(
            '通知の許可が必要です',
            '設定アプリから通知を許可してください',
            [
              { text: 'キャンセル', style: 'cancel' },
              { text: '設定を開く', onPress: openSettings },
            ]
          );
        }
      } else {
        await unregisterPushNotifications();
        setNotificationsEnabled(false);
        Alert.alert('完了', 'プッシュ通知を無効にしました');
      }
    } catch (error) {
      Alert.alert('エラー', '設定の変更に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>プッシュ通知</Text>
              <Text style={styles.settingDescription}>
                今日の質問が公開されたときに通知を受け取ります
              </Text>
            </View>
            {isLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggle}
                trackColor={{ true: colors.accent }}
              />
            )}
          </View>
        </View>
      </View>

      {permissionStatus === 'denied' && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            通知がシステム設定でブロックされています。
            設定アプリから通知を許可してください。
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
            <Text style={styles.settingsButtonText}>設定を開く</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>通知について</Text>
        <Text style={styles.infoText}>
          • 今日の質問が届いたときに通知でお知らせします{'\n'}
          • 通知をタップするとアプリが開きます{'\n'}
          • いつでも設定を変更できます
        </Text>
      </View>
    </View>
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
      paddingVertical: 16,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.textMuted,
    },
    warningBox: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.warning + '20',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.warning + '40',
    },
    warningText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
    },
    settingsButton: {
      backgroundColor: colors.warning,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    settingsButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    infoBox: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 22,
    },
  });
