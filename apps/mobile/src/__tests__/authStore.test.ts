import { useAuthStore } from '../stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });

  describe('初期状態', () => {
    test('未認証状態で開始', () => {
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.hasCompletedOnboarding).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('setAuth', () => {
    test('ユーザー情報とトークンを設定', () => {
      const user = {
        userId: 'user-123',
        email: 'test@example.com',
        appId: 'testuser',
        displayName: 'テストユーザー',
      };
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-456';

      useAuthStore.getState().setAuth(user, accessToken, refreshToken);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
    });

    test('appIdがある場合はオンボーディング完了', () => {
      const user = {
        userId: 'user-123',
        email: 'test@example.com',
        appId: 'testuser',
      };

      useAuthStore.getState().setAuth(user, 'token', 'refresh');

      expect(useAuthStore.getState().hasCompletedOnboarding).toBe(true);
    });

    test('appIdがない場合はオンボーディング未完了', () => {
      const user = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      useAuthStore.getState().setAuth(user, 'token', 'refresh');

      expect(useAuthStore.getState().hasCompletedOnboarding).toBe(false);
    });
  });

  describe('setOnboardingComplete', () => {
    test('オンボーディング完了フラグを設定', () => {
      expect(useAuthStore.getState().hasCompletedOnboarding).toBe(false);

      useAuthStore.getState().setOnboardingComplete();

      expect(useAuthStore.getState().hasCompletedOnboarding).toBe(true);
    });
  });

  describe('updateUser', () => {
    test('ユーザー情報を部分更新', () => {
      const initialUser = {
        userId: 'user-123',
        email: 'test@example.com',
        displayName: '旧名前',
      };
      useAuthStore.getState().setAuth(initialUser, 'token', 'refresh');

      useAuthStore.getState().updateUser({ displayName: '新名前' });

      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('新名前');
      expect(state.user?.email).toBe('test@example.com'); // 他の値は保持
    });

    test('appIdを更新', () => {
      const initialUser = {
        userId: 'user-123',
        email: 'test@example.com',
      };
      useAuthStore.getState().setAuth(initialUser, 'token', 'refresh');

      useAuthStore.getState().updateUser({ appId: 'newappid' });

      expect(useAuthStore.getState().user?.appId).toBe('newappid');
    });

    test('profileImageUrlを更新', () => {
      const initialUser = {
        userId: 'user-123',
        email: 'test@example.com',
      };
      useAuthStore.getState().setAuth(initialUser, 'token', 'refresh');

      useAuthStore.getState().updateUser({
        profileImageUrl: 'https://example.com/image.jpg',
      });

      expect(useAuthStore.getState().user?.profileImageUrl).toBe(
        'https://example.com/image.jpg'
      );
    });

    test('userがnullの場合は何もしない', () => {
      useAuthStore.getState().updateUser({ displayName: '新名前' });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    test('全ての状態をリセット', () => {
      // First, set auth
      const user = {
        userId: 'user-123',
        email: 'test@example.com',
        appId: 'testuser',
      };
      useAuthStore.getState().setAuth(user, 'token', 'refresh');

      // Verify auth is set
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Logout
      useAuthStore.getState().logout();

      // Verify all state is reset
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.hasCompletedOnboarding).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });
});
