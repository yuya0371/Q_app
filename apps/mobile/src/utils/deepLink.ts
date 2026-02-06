import * as Linking from 'expo-linking';

// アプリのスキーム
const APP_SCHEME = 'q-app';

// Webのベースドメイン
const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://q-app.example.com';

/**
 * ディープリンクのパスを生成
 */
export const deepLink = {
  /**
   * ユーザープロフィールへのディープリンク
   */
  userProfile: (appId: string): string => {
    return Linking.createURL(`user/${appId}`, { scheme: APP_SCHEME });
  },

  /**
   * 質問詳細へのディープリンク
   */
  question: (questionId: string): string => {
    return Linking.createURL(`question/${questionId}`, { scheme: APP_SCHEME });
  },

  /**
   * 回答詳細へのディープリンク
   */
  answer: (answerId: string): string => {
    return Linking.createURL(`answer/${answerId}`, { scheme: APP_SCHEME });
  },
};

/**
 * Web共有用のURLを生成
 */
export const webLink = {
  /**
   * ユーザープロフィールへのWebリンク
   */
  userProfile: (appId: string): string => {
    return `${WEB_BASE_URL}/${appId}`;
  },

  /**
   * 質問詳細へのWebリンク
   */
  question: (questionId: string): string => {
    return `${WEB_BASE_URL}/q/${questionId}`;
  },
};

/**
 * ディープリンクをパースしてルートとパラメータを取得
 */
export interface ParsedDeepLink {
  route: 'user' | 'question' | 'answer' | 'unknown';
  params: Record<string, string>;
}

export const parseDeepLink = (url: string): ParsedDeepLink => {
  const parsed = Linking.parse(url);

  if (!parsed.path) {
    return { route: 'unknown', params: {} };
  }

  const pathParts = parsed.path.split('/').filter(Boolean);

  if (pathParts[0] === 'user' && pathParts[1]) {
    return { route: 'user', params: { appId: pathParts[1] } };
  }

  if (pathParts[0] === 'question' && pathParts[1]) {
    return { route: 'question', params: { questionId: pathParts[1] } };
  }

  if (pathParts[0] === 'answer' && pathParts[1]) {
    return { route: 'answer', params: { answerId: pathParts[1] } };
  }

  return { route: 'unknown', params: {} };
};
