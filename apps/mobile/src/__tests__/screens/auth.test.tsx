import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { useLocalSearchParams } from 'expo-router';

import LoginScreen from '../../../app/(auth)/login';
import SignupScreen from '../../../app/(auth)/signup';
import VerifyEmailScreen from '../../../app/(auth)/verify-email';
import ForgotPasswordScreen from '../../../app/(auth)/forgot-password';

// API hooks mock
const mockLoginMutate = jest.fn();
const mockSignupMutate = jest.fn();
const mockConfirmEmailMutate = jest.fn();
const mockResendCodeMutate = jest.fn();
const mockForgotPasswordMutate = jest.fn();
const mockResetPasswordMutate = jest.fn();

const mockLoginIsPending = { value: false };
const mockSignupIsPending = { value: false };
const mockConfirmEmailIsPending = { value: false };
const mockForgotPasswordIsPending = { value: false };
const mockResetPasswordIsPending = { value: false };

jest.mock('../../hooks/api', () => ({
  useLogin: () => ({
    mutate: mockLoginMutate,
    get isPending() { return mockLoginIsPending.value; },
  }),
  useSignup: () => ({
    mutate: mockSignupMutate,
    get isPending() { return mockSignupIsPending.value; },
  }),
  useConfirmEmail: () => ({
    mutate: mockConfirmEmailMutate,
    get isPending() { return mockConfirmEmailIsPending.value; },
  }),
  useResendCode: () => ({
    mutate: mockResendCodeMutate,
    isPending: false,
  }),
  useForgotPassword: () => ({
    mutate: mockForgotPasswordMutate,
    get isPending() { return mockForgotPasswordIsPending.value; },
  }),
  useResetPassword: () => ({
    mutate: mockResetPasswordMutate,
    get isPending() { return mockResetPasswordIsPending.value; },
  }),
}));

jest.mock('../../utils/errorHandler', () => ({
  getErrorMessage: (err: unknown) => (err instanceof Error ? err.message : 'エラーが発生しました'),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLoginIsPending.value = false;
  mockSignupIsPending.value = false;
  mockConfirmEmailIsPending.value = false;
  mockForgotPasswordIsPending.value = false;
  mockResetPasswordIsPending.value = false;
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
});

// ===== ログイン画面 =====
describe('LoginScreen', () => {
  it('画面がレンダリングされる', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Q.')).toBeTruthy();
    expect(getByText('毎日ひとつの質問に答えよう')).toBeTruthy();
  });

  it('主要UI要素が表示される', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    expect(getByText('メールアドレス')).toBeTruthy();
    expect(getByText('パスワード')).toBeTruthy();
    expect(getByPlaceholderText('example@email.com')).toBeTruthy();
    expect(getByPlaceholderText('パスワード')).toBeTruthy();
    expect(getByText('ログイン')).toBeTruthy();
    expect(getByText('パスワードをお忘れの方')).toBeTruthy();
    expect(getByText('新規登録')).toBeTruthy();
  });

  it('空入力でエラーが表示される', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('ログイン'));
    expect(getByText('メールアドレスとパスワードを入力してください')).toBeTruthy();
    expect(mockLoginMutate).not.toHaveBeenCalled();
  });

  it('入力後にログインボタンでmutationが呼ばれる', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('パスワード'), 'password123');
    fireEvent.press(getByText('ログイン'));
    expect(mockLoginMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('ローディング中はボタンテキストが非表示になる', () => {
    mockLoginIsPending.value = true;
    const { queryByText } = renderWithProviders(<LoginScreen />);
    expect(queryByText('ログイン')).toBeNull();
  });
});

// ===== サインアップ画面 =====
describe('SignupScreen', () => {
  it('画面がレンダリングされる', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<SignupScreen />);
    expect(getByText('メールアドレス')).toBeTruthy();
    expect(getByPlaceholderText('example@email.com')).toBeTruthy();
  });

  it('主要UI要素が表示される', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<SignupScreen />);
    expect(getByText('パスワード')).toBeTruthy();
    expect(getByText('パスワード（確認）')).toBeTruthy();
    expect(getByText('生年月日')).toBeTruthy();
    expect(getByPlaceholderText('8文字以上')).toBeTruthy();
    expect(getByPlaceholderText('パスワードを再入力')).toBeTruthy();
    expect(getByPlaceholderText('20010101 または 2001/01/01')).toBeTruthy();
    expect(getByText('登録する')).toBeTruthy();
  });

  it('空入力でエラーが表示される', () => {
    const { getByText } = renderWithProviders(<SignupScreen />);
    fireEvent.press(getByText('登録する'));
    expect(getByText('すべての項目を入力してください')).toBeTruthy();
    expect(mockSignupMutate).not.toHaveBeenCalled();
  });

  it('パスワード不一致でエラーが表示される', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<SignupScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('8文字以上'), 'password123');
    fireEvent.changeText(getByPlaceholderText('パスワードを再入力'), 'different123');
    fireEvent.changeText(getByPlaceholderText('20010101 または 2001/01/01'), '20000101');
    fireEvent.press(getByText('登録する'));
    expect(getByText('パスワードが一致しません')).toBeTruthy();
  });

  it('パスワードが短すぎるとエラーが表示される', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<SignupScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('8文字以上'), 'short');
    fireEvent.changeText(getByPlaceholderText('パスワードを再入力'), 'short');
    fireEvent.changeText(getByPlaceholderText('20010101 または 2001/01/01'), '20000101');
    fireEvent.press(getByText('登録する'));
    expect(getByText('パスワードは8文字以上で入力してください')).toBeTruthy();
  });

  it('有効な入力でmutationが呼ばれる', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<SignupScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('8文字以上'), 'password123');
    fireEvent.changeText(getByPlaceholderText('パスワードを再入力'), 'password123');
    fireEvent.changeText(getByPlaceholderText('20010101 または 2001/01/01'), '20000101');
    fireEvent.press(getByText('登録する'));
    expect(mockSignupMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123', birthDate: '2000-01-01' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('ローディング中はボタンテキストが非表示になる', () => {
    mockSignupIsPending.value = true;
    const { queryByText } = renderWithProviders(<SignupScreen />);
    expect(queryByText('登録する')).toBeNull();
  });
});

// ===== メール確認画面 =====
describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ email: 'test@example.com' });
  });

  it('画面がレンダリングされる', () => {
    const { getByText } = renderWithProviders(<VerifyEmailScreen />);
    expect(getByText('メールを確認してください')).toBeTruthy();
  });

  it('主要UI要素が表示される', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<VerifyEmailScreen />);
    expect(getByPlaceholderText('000000')).toBeTruthy();
    expect(getByText('確認する')).toBeTruthy();
    expect(getByText('コードを再送信')).toBeTruthy();
  });

  it('空のコードでエラーが表示される', () => {
    const { getByText } = renderWithProviders(<VerifyEmailScreen />);
    fireEvent.press(getByText('確認する'));
    expect(getByText('6桁の確認コードを入力してください')).toBeTruthy();
  });

  it('6桁未満のコードでエラーが表示される', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<VerifyEmailScreen />);
    fireEvent.changeText(getByPlaceholderText('000000'), '123');
    fireEvent.press(getByText('確認する'));
    expect(getByText('6桁の確認コードを入力してください')).toBeTruthy();
  });

  it('6桁のコードでmutationが呼ばれる', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<VerifyEmailScreen />);
    fireEvent.changeText(getByPlaceholderText('000000'), '123456');
    fireEvent.press(getByText('確認する'));
    expect(mockConfirmEmailMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', code: '123456' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('コード再送信ボタンでmutationが呼ばれる', () => {
    const { getByText } = renderWithProviders(<VerifyEmailScreen />);
    fireEvent.press(getByText('コードを再送信'));
    expect(mockResendCodeMutate).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('ローディング中はボタンテキストが非表示になる', () => {
    mockConfirmEmailIsPending.value = true;
    const { queryByText } = renderWithProviders(<VerifyEmailScreen />);
    expect(queryByText('確認する')).toBeNull();
  });
});

// ===== パスワードリセット画面 =====
describe('ForgotPasswordScreen', () => {
  it('画面がレンダリングされる（メール入力ステップ）', () => {
    const { getByText } = renderWithProviders(<ForgotPasswordScreen />);
    expect(getByText('メールアドレス')).toBeTruthy();
    expect(getByText('コードを送信')).toBeTruthy();
  });

  it('主要UI要素が表示される', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<ForgotPasswordScreen />);
    expect(getByPlaceholderText('example@email.com')).toBeTruthy();
    expect(getByText('コードを送信')).toBeTruthy();
  });

  it('空のメールアドレスでエラーが表示される', () => {
    const { getByText } = renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.press(getByText('コードを送信'));
    expect(getByText('メールアドレスを入力してください')).toBeTruthy();
    expect(mockForgotPasswordMutate).not.toHaveBeenCalled();
  });

  it('メールアドレス入力後にmutationが呼ばれる', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.press(getByText('コードを送信'));
    expect(mockForgotPasswordMutate).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('リセットステップに遷移後、UI要素が表示される', () => {
    mockForgotPasswordMutate.mockImplementation((_data: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.press(getByText('コードを送信'));

    expect(getByText('確認コード')).toBeTruthy();
    expect(getByText('新しいパスワード')).toBeTruthy();
    expect(getByText('パスワードを変更')).toBeTruthy();
    expect(getByText('メールアドレスを変更')).toBeTruthy();
  });

  it('リセットステップで空コードのバリデーション', () => {
    mockForgotPasswordMutate.mockImplementation((_data: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.press(getByText('コードを送信'));

    fireEvent.press(getByText('パスワードを変更'));
    expect(getByText('6桁の確認コードを入力してください')).toBeTruthy();
  });

  it('リセットステップでパスワード短すぎのバリデーション', () => {
    mockForgotPasswordMutate.mockImplementation((_data: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.press(getByText('コードを送信'));

    fireEvent.changeText(getByPlaceholderText('000000'), '123456');
    fireEvent.changeText(getByPlaceholderText('8文字以上'), 'short');
    fireEvent.press(getByText('パスワードを変更'));
    expect(getByText('パスワードは8文字以上で入力してください')).toBeTruthy();
  });

  it('リセットステップで有効な入力でmutationが呼ばれる', () => {
    mockForgotPasswordMutate.mockImplementation((_data: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.press(getByText('コードを送信'));

    fireEvent.changeText(getByPlaceholderText('000000'), '123456');
    fireEvent.changeText(getByPlaceholderText('8文字以上'), 'newpassword123');
    fireEvent.press(getByText('パスワードを変更'));
    expect(mockResetPasswordMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', code: '123456', newPassword: 'newpassword123' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it('ローディング中はボタンテキストが非表示になる', () => {
    mockForgotPasswordIsPending.value = true;
    const { queryByText } = renderWithProviders(<ForgotPasswordScreen />);
    expect(queryByText('コードを送信')).toBeNull();
  });
});
