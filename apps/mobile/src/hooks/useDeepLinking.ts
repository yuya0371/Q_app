import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

// URLスキーム: q-app://
// Universal Links: https://q-app.example.com/

interface DeepLinkRoute {
  pattern: RegExp;
  handler: (matches: RegExpMatchArray) => void;
}

const routes: DeepLinkRoute[] = [
  // ユーザープロフィール: /user/{appId}
  {
    pattern: /\/user\/([^\/]+)/,
    handler: (matches) => {
      const appId = matches[1];
      router.push(`/user/${appId}`);
    },
  },
  // 回答: /answer/{answerId}
  {
    pattern: /\/answer\/([^\/]+)/,
    handler: (matches) => {
      // 回答詳細画面があれば遷移
      // 現状はホーム画面に遷移
      router.push('/(tabs)');
    },
  },
];

const handleDeepLink = (url: string) => {
  console.log('Deep link received:', url);

  // URLからパスを抽出
  let path = '';

  // カスタムスキーム (q-app://user/xxx)
  if (url.startsWith('q-app://')) {
    path = '/' + url.replace('q-app://', '');
  }
  // Universal Link (https://q-app.example.com/user/xxx)
  else if (url.includes('q-app.example.com')) {
    const urlObj = new URL(url);
    path = urlObj.pathname;
  }

  if (!path) return;

  // ルートマッチング
  for (const route of routes) {
    const matches = path.match(route.pattern);
    if (matches) {
      route.handler(matches);
      return;
    }
  }

  // マッチしない場合はホーム画面へ
  router.push('/(tabs)');
};

export function useDeepLinking() {
  useEffect(() => {
    // アプリが起動された時のディープリンク処理
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };
    getInitialURL();

    // アプリがバックグラウンドから復帰した時のディープリンク処理
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // プッシュ通知からのディープリンク処理
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.url) {
          handleDeepLink(data.url as string);
        }
      }
    );

    return () => {
      subscription.remove();
      notificationSubscription.remove();
    };
  }, []);
}

// ディープリンクURLを生成するヘルパー
export const createDeepLink = {
  user: (appId: string) => `q-app://user/${appId}`,
  home: () => 'q-app://home',
};

// Universal LinkのURLを生成
export const createUniversalLink = {
  user: (appId: string) => `https://q-app.example.com/user/${appId}`,
};
