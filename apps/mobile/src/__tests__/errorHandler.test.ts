import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { handleApiError, getErrorMessage } from '../utils/errorHandler';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

const createAxiosError = (
  status?: number,
  errorCode?: string,
  code?: string
): AxiosError => {
  const config: InternalAxiosRequestConfig = {
    url: '/test',
    method: 'get',
    headers: new AxiosHeaders(),
  };

  const response: AxiosResponse | undefined = status
    ? {
        data: errorCode ? { code: errorCode } : {},
        status,
        statusText: 'Error',
        headers: {},
        config,
      }
    : undefined;

  const error = new AxiosError('Test error', code || 'ERR_BAD_REQUEST', config, null, response);
  return error;
};

describe('handleApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AxiosError handling', () => {
    test('ネットワークエラー', () => {
      const error = new AxiosError(
        'Network Error',
        'ERR_NETWORK',
        { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
      );
      const result = handleApiError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toBe('ネットワーク接続を確認してください。');
    });

    test('タイムアウトエラー', () => {
      const error = new AxiosError(
        'Timeout',
        'ECONNABORTED',
        { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
      );
      const result = handleApiError(error);

      expect(result.code).toBe('TIMEOUT');
      expect(result.message).toBe('リクエストがタイムアウトしました。再度お試しください。');
    });

    test('401 Unauthorized', () => {
      const error = createAxiosError(401);
      const result = handleApiError(error);

      expect(result.code).toBe('HTTP_401');
      expect(result.message).toBe('認証が必要です。再度ログインしてください。');
    });

    test('403 Forbidden', () => {
      const error = createAxiosError(403);
      const result = handleApiError(error);

      expect(result.code).toBe('HTTP_403');
      expect(result.message).toBe('この操作を行う権限がありません。');
    });

    test('404 Not Found', () => {
      const error = createAxiosError(404);
      const result = handleApiError(error);

      expect(result.code).toBe('HTTP_404');
      expect(result.message).toBe('リソースが見つかりませんでした。');
    });

    test('500 Internal Server Error', () => {
      const error = createAxiosError(500);
      const result = handleApiError(error);

      expect(result.code).toBe('HTTP_500');
      expect(result.message).toBe('サーバーエラーが発生しました。しばらくしてから再度お試しください。');
    });

    test('503 Service Unavailable', () => {
      const error = createAxiosError(503);
      const result = handleApiError(error);

      expect(result.code).toBe('HTTP_503');
      expect(result.message).toBe('サービスが一時的に利用できません。しばらくしてから再度お試しください。');
    });

    test('サーバーからのエラーコードがある場合', () => {
      const error = createAxiosError(400, 'VALIDATION_ERROR');
      const result = handleApiError(error);

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('入力内容に誤りがあります。');
    });

    test('USER_NOT_FOUNDエラー', () => {
      const error = createAxiosError(404, 'USER_NOT_FOUND');
      const result = handleApiError(error);

      expect(result.code).toBe('USER_NOT_FOUND');
      expect(result.message).toBe('ユーザーが見つかりませんでした。');
    });
  });

  describe('通常のError handling', () => {
    test('通常のErrorオブジェクト', () => {
      const error = new Error('Something went wrong');
      const result = handleApiError(error);

      expect(result.code).toBe('UNKNOWN');
      expect(result.message).toBe('Something went wrong');
      expect(result.originalError).toBe(error);
    });
  });

  describe('その他のエラー', () => {
    test('文字列エラー', () => {
      const result = handleApiError('string error');

      expect(result.code).toBe('UNKNOWN');
      expect(result.message).toBe('予期せぬエラーが発生しました。');
    });

    test('nullエラー', () => {
      const result = handleApiError(null);

      expect(result.code).toBe('UNKNOWN');
      expect(result.message).toBe('予期せぬエラーが発生しました。');
    });

    test('undefinedエラー', () => {
      const result = handleApiError(undefined);

      expect(result.code).toBe('UNKNOWN');
      expect(result.message).toBe('予期せぬエラーが発生しました。');
    });
  });
});

describe('getErrorMessage', () => {
  test('AxiosErrorからメッセージを取得', () => {
    const error = createAxiosError(404);
    const message = getErrorMessage(error);

    expect(message).toBe('リソースが見つかりませんでした。');
  });

  test('通常のErrorからメッセージを取得', () => {
    const error = new Error('Test error message');
    const message = getErrorMessage(error);

    expect(message).toBe('Test error message');
  });
});
