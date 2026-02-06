import { AxiosError } from 'axios';
import * as Sentry from '@sentry/react-native';

// APIエラーコードと日本語メッセージのマッピング
const ERROR_MESSAGES: Record<string, string> = {
  // 認証エラー
  UNAUTHORIZED: '認証が必要です。再度ログインしてください。',
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません。',
  TOKEN_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください。',

  // バリデーションエラー
  VALIDATION_ERROR: '入力内容に誤りがあります。',
  INVALID_EMAIL: '有効なメールアドレスを入力してください。',
  INVALID_APP_ID: 'このApp IDは既に使用されているか、使用できない形式です。',

  // リソースエラー
  NOT_FOUND: 'リソースが見つかりませんでした。',
  USER_NOT_FOUND: 'ユーザーが見つかりませんでした。',
  QUESTION_NOT_FOUND: '質問が見つかりませんでした。',

  // 権限エラー
  FORBIDDEN: 'この操作を行う権限がありません。',

  // サーバーエラー
  INTERNAL_ERROR: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。',
  SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません。しばらくしてから再度お試しください。',

  // ネットワークエラー
  NETWORK_ERROR: 'ネットワーク接続を確認してください。',
  TIMEOUT: 'リクエストがタイムアウトしました。再度お試しください。',

  // デフォルト
  DEFAULT: '予期せぬエラーが発生しました。',
};

export interface AppError {
  code: string;
  message: string;
  originalError?: Error;
}

// HTTPステータスコードから日本語メッセージを取得
const getMessageFromStatus = (status: number): string => {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 408:
      return ERROR_MESSAGES.TIMEOUT;
    case 500:
      return ERROR_MESSAGES.INTERNAL_ERROR;
    case 503:
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    default:
      return ERROR_MESSAGES.DEFAULT;
  }
};

// AxiosエラーをAppErrorに変換
export const handleApiError = (error: unknown): AppError => {
  // Axiosエラーの場合
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const errorCode = error.response?.data?.code as string | undefined;

    // Sentryにエラーを報告（401は除外）
    if (status !== 401) {
      Sentry.captureException(error, {
        extra: {
          status,
          errorCode,
          url: error.config?.url,
          method: error.config?.method,
        },
      });
    }

    // ネットワークエラー
    if (error.code === 'ERR_NETWORK') {
      return {
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK_ERROR,
        originalError: error,
      };
    }

    // タイムアウトエラー
    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: ERROR_MESSAGES.TIMEOUT,
        originalError: error,
      };
    }

    // サーバーからのエラーコードがある場合
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return {
        code: errorCode,
        message: ERROR_MESSAGES[errorCode],
        originalError: error,
      };
    }

    // HTTPステータスコードからメッセージを取得
    if (status) {
      return {
        code: `HTTP_${status}`,
        message: getMessageFromStatus(status),
        originalError: error,
      };
    }

    return {
      code: 'UNKNOWN',
      message: ERROR_MESSAGES.DEFAULT,
      originalError: error,
    };
  }

  // 通常のエラーの場合
  if (error instanceof Error) {
    Sentry.captureException(error);
    return {
      code: 'UNKNOWN',
      message: error.message || ERROR_MESSAGES.DEFAULT,
      originalError: error,
    };
  }

  // その他の場合
  return {
    code: 'UNKNOWN',
    message: ERROR_MESSAGES.DEFAULT,
  };
};

// エラーメッセージを取得するヘルパー
export const getErrorMessage = (error: unknown): string => {
  return handleApiError(error).message;
};
