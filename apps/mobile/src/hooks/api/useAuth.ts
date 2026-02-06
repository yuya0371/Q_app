import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage } from '../../utils/errorHandler';

// Types
interface SignupRequest {
  email: string;
  password: string;
  birthDate: string;
}

interface SignupResponse {
  userId: string;
  email: string;
}

interface ConfirmEmailRequest {
  email: string;
  code: string;
}

interface ConfirmEmailResponse {
  message: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    userId: string;
    email: string;
    appId?: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

interface ResendCodeRequest {
  email: string;
}

interface SetAppIdRequest {
  appId: string;
}

// サインアップフック
export function useSignup() {
  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      const response = await apiClient.post<SignupResponse>('/auth/signup', data);
      return response.data;
    },
    onError: (error) => {
      console.error('Signup error:', getErrorMessage(error));
    },
  });
}

// メール確認フック
export function useConfirmEmail() {
  return useMutation({
    mutationFn: async (data: ConfirmEmailRequest) => {
      const response = await apiClient.post<ConfirmEmailResponse>('/auth/confirm', data);
      return response.data;
    },
    onError: (error) => {
      console.error('Confirm email error:', getErrorMessage(error));
    },
  });
}

// 確認コード再送信フック
export function useResendCode() {
  return useMutation({
    mutationFn: async (data: ResendCodeRequest) => {
      await apiClient.post('/auth/resend-code', data);
    },
    onError: (error) => {
      console.error('Resend code error:', getErrorMessage(error));
    },
  });
}

// ログインフック
export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('[Auth] Login success, user:', data.user);
      console.log('[Auth] idToken exists:', !!data.idToken, 'length:', data.idToken?.length);
      // API GatewayのCognitoUserPoolsAuthorizerはID Tokenを期待するため、idTokenを使用
      setAuth(data.user, data.idToken, data.refreshToken);
    },
    onError: (error) => {
      console.error('Login error:', getErrorMessage(error));
    },
  });
}

// パスワードリセット開始フック
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      await apiClient.post('/auth/forgot-password', data);
    },
    onError: (error) => {
      console.error('Forgot password error:', getErrorMessage(error));
    },
  });
}

// パスワードリセット実行フック
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      await apiClient.post('/auth/reset-password', data);
    },
    onError: (error) => {
      console.error('Reset password error:', getErrorMessage(error));
    },
  });
}

// ログアウトフック
export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      // 成功・失敗に関わらずローカル状態をクリア
      logout();
      queryClient.clear();
    },
  });
}

// App ID設定フック
export function useSetAppId() {
  const updateUser = useAuthStore((state) => state.updateUser);
  const setOnboardingComplete = useAuthStore((state) => state.setOnboardingComplete);

  return useMutation({
    mutationFn: async (data: SetAppIdRequest) => {
      const response = await apiClient.put<{ appId: string }>('/users/me/app-id', data);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser({ appId: data.appId });
      setOnboardingComplete();
    },
    onError: (error) => {
      console.error('Set App ID error:', getErrorMessage(error));
    },
  });
}

// App ID利用可能チェックフック
export function useCheckAppIdAvailability() {
  return useMutation({
    mutationFn: async (appId: string) => {
      const response = await apiClient.get<{ available: boolean }>(`/users/check-app-id/${appId}`);
      return response.data;
    },
  });
}
