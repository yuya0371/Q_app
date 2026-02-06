import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiClient } from '../services/api';

// 通知の表示設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    checkPermissions();

    // 通知受信時のリスナー
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // 通知タップ時のリスナー
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // ここでディープリンク処理などを行う
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    return status;
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert('注意', 'プッシュ通知は実機でのみ利用できます');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus);

    if (finalStatus !== 'granted') {
      return false;
    }

    return true;
  };

  const registerForPushNotifications = async (): Promise<string | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return null;
    }

    try {
      // Expo Push Tokenを取得
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setExpoPushToken(token.data);

      // Android用のチャンネル設定
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // サーバーにトークンを登録
      await registerTokenWithServer(token.data);

      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  };

  const registerTokenWithServer = async (token: string) => {
    try {
      await apiClient.post('/push-tokens', {
        token,
        deviceType: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register token with server:', error);
    }
  };

  const unregisterPushNotifications = async () => {
    if (expoPushToken) {
      try {
        await apiClient.delete('/push-tokens', {
          data: { token: expoPushToken },
        });
        setExpoPushToken(null);
      } catch (error) {
        console.error('Failed to unregister token:', error);
      }
    }
  };

  return {
    expoPushToken,
    permissionStatus,
    requestPermissions,
    registerForPushNotifications,
    unregisterPushNotifications,
    checkPermissions,
  };
}
