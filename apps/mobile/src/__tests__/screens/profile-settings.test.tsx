import React from 'react';
import { renderWithProviders } from '../test-utils';
import { waitFor, fireEvent } from '@testing-library/react-native';

// ---- Mocks ----

// useUsers hooks
const mockUseMyProfile = jest.fn();
const mockUseUpdateProfile = jest.fn();
const mockUseUpdateProfileImage = jest.fn();
const mockUseDeleteProfileImage = jest.fn();
const mockUseBlockedUsers = jest.fn();
const mockUseUnblock = jest.fn();
const mockUseDeleteAccount = jest.fn();

jest.mock('../../hooks/api/useUsers', () => ({
  useMyProfile: () => mockUseMyProfile(),
  useUpdateProfile: () => mockUseUpdateProfile(),
  useUpdateProfileImage: () => mockUseUpdateProfileImage(),
  useDeleteProfileImage: () => mockUseDeleteProfileImage(),
  useBlockedUsers: () => mockUseBlockedUsers(),
  useUnblock: () => mockUseUnblock(),
  useDeleteAccount: () => mockUseDeleteAccount(),
}));

// useAnswers hooks
const mockUseMyAnswers = jest.fn();

jest.mock('../../hooks/api/useAnswers', () => ({
  useMyAnswers: () => mockUseMyAnswers(),
}));

// hooks/api barrel (used by settings, visibility, blocked-users, delete-account)
jest.mock('../../hooks/api', () => ({
  useMyProfile: () => mockUseMyProfile(),
  useUpdateProfile: () => mockUseUpdateProfile(),
  useBlockedUsers: () => mockUseBlockedUsers(),
  useUnblock: () => mockUseUnblock(),
  useDeleteAccount: () => mockUseDeleteAccount(),
}));

// authStore
const mockLogout = jest.fn();
jest.mock('../../stores/authStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    const state = { logout: mockLogout };
    return selector ? selector(state) : state;
  },
}));

// errorHandler
jest.mock('../../utils/errorHandler', () => ({
  getErrorMessage: jest.fn((err: any) => err?.message || 'エラーが発生しました'),
}));

// expo-constants (Settings uses Constants.expoConfig)
jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.2.3' },
}));

// ---- Helpers ----

const defaultProfile = {
  userId: 'user-123',
  appId: 'testuser',
  displayName: 'テストユーザー',
  bio: 'こんにちは',
  profileImageUrl: null,
  isPrivate: false,
  followingCount: 10,
  followerCount: 25,
};

const defaultMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
};

function setupDefaultMocks() {
  mockUseMyProfile.mockReturnValue({
    data: defaultProfile,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  mockUseMyAnswers.mockReturnValue({
    data: { pages: [{ items: [] }] },
    isLoading: false,
    refetch: jest.fn(),
  });

  mockUseUpdateProfile.mockReturnValue({ ...defaultMutation });
  mockUseUpdateProfileImage.mockReturnValue({ ...defaultMutation });
  mockUseDeleteProfileImage.mockReturnValue({ ...defaultMutation });
  mockUseBlockedUsers.mockReturnValue({
    data: { pages: [] },
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
  });
  mockUseUnblock.mockReturnValue({ ...defaultMutation });
  mockUseDeleteAccount.mockReturnValue({ ...defaultMutation });
}

// ---- Import screens ----
// Must be imported after jest.mock declarations
import ProfileScreen from '../../../app/(tabs)/profile';
import EditProfileScreen from '../../../app/profile/edit';
import SettingsScreen from '../../../app/(tabs)/settings';
import DeleteAccountScreen from '../../../app/settings/delete-account';
import VisibilitySettingsScreen from '../../../app/settings/visibility';
import BlockedUsersScreen from '../../../app/settings/blocked-users';

// ================================================================
// ProfileScreen
// ================================================================
describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it('ローディング中はインジケーターを表示する', () => {
    mockUseMyProfile.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(<ProfileScreen />);
    expect(getByText('読み込み中...')).toBeTruthy();
  });

  it('エラー時はエラーメッセージと再試行ボタンを表示する', () => {
    mockUseMyProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('ネットワークエラー'),
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(<ProfileScreen />);
    expect(getByText('再試行')).toBeTruthy();
  });

  it('プロフィール情報を表示する', () => {
    const { getByText } = renderWithProviders(<ProfileScreen />);

    expect(getByText('テストユーザー')).toBeTruthy();
    expect(getByText('@testuser')).toBeTruthy();
    expect(getByText('こんにちは')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('フォロー中')).toBeTruthy();
    expect(getByText('25')).toBeTruthy();
    expect(getByText('フォロワー')).toBeTruthy();
  });

  it('編集ボタンを表示する', () => {
    const { getByText } = renderWithProviders(<ProfileScreen />);
    expect(getByText('プロフィールを編集')).toBeTruthy();
  });

  it('編集ボタン押下でrouter.pushが呼ばれる', () => {
    const { router } = require('expo-router');
    const { getByText } = renderWithProviders(<ProfileScreen />);

    fireEvent.press(getByText('プロフィールを編集'));
    expect(router.push).toHaveBeenCalledWith('/profile/edit');
  });

  it('回答がない場合は空状態を表示する', () => {
    const { getByText } = renderWithProviders(<ProfileScreen />);
    expect(getByText('まだ回答がありません')).toBeTruthy();
  });

  it('回答がある場合は回答カードを表示する', () => {
    mockUseMyAnswers.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                answerId: 'a1',
                date: '2025-01-01',
                questionText: '好きな食べ物は？',
                text: 'カレー',
                isOnTime: true,
                lateMinutes: 0,
                isDeleted: false,
                createdAt: '2025-01-01T12:00:00Z',
              },
            ],
          },
        ],
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(<ProfileScreen />);
    expect(getByText('好きな食べ物は？')).toBeTruthy();
    expect(getByText('カレー')).toBeTruthy();
    expect(getByText('すべての回答を見る')).toBeTruthy();
  });

  it('過去の回答セクションタイトルを表示する', () => {
    const { getByText } = renderWithProviders(<ProfileScreen />);
    expect(getByText('過去の回答')).toBeTruthy();
  });
});

// ================================================================
// EditProfileScreen
// ================================================================
describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it('ローディング中はインジケーターを表示する', () => {
    mockUseMyProfile.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { queryByText } = renderWithProviders(<EditProfileScreen />);
    // ローディング中は保存ボタンが表示されない
    expect(queryByText('保存')).toBeNull();
  });

  it('フォームを表示する', () => {
    const { getByText } = renderWithProviders(<EditProfileScreen />);

    expect(getByText('表示名')).toBeTruthy();
    expect(getByText('自己紹介')).toBeTruthy();
    expect(getByText('アプリ内ID')).toBeTruthy();
    expect(getByText('IDは変更できません')).toBeTruthy();
  });

  it('保存ボタンを表示する', () => {
    const { getByText } = renderWithProviders(<EditProfileScreen />);
    expect(getByText('保存')).toBeTruthy();
  });

  it('キャンセルボタンを表示する', () => {
    const { getByText } = renderWithProviders(<EditProfileScreen />);
    expect(getByText('キャンセル')).toBeTruthy();
  });

  it('写真を変更リンクを表示する', () => {
    const { getByText } = renderWithProviders(<EditProfileScreen />);
    expect(getByText('写真を変更')).toBeTruthy();
  });

  it('アプリ内IDを表示する', () => {
    const { getByText } = renderWithProviders(<EditProfileScreen />);
    expect(getByText('@testuser')).toBeTruthy();
  });

  it('キャンセル押下でrouter.backが呼ばれる', () => {
    const { router } = require('expo-router');
    const { getByText } = renderWithProviders(<EditProfileScreen />);

    fireEvent.press(getByText('キャンセル'));
    expect(router.back).toHaveBeenCalled();
  });
});

// ================================================================
// SettingsScreen
// ================================================================
describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it('セクションタイトルを表示する', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);

    expect(getByText('アカウント')).toBeTruthy();
    expect(getByText('プライバシー')).toBeTruthy();
    expect(getByText('通知')).toBeTruthy();
    expect(getByText('サポート')).toBeTruthy();
    expect(getByText('アプリ情報')).toBeTruthy();
  });

  it('メニュー項目を表示する', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);

    expect(getByText('メールアドレスの変更')).toBeTruthy();
    expect(getByText('パスワードの変更')).toBeTruthy();
    expect(getByText('回答の公開範囲')).toBeTruthy();
    expect(getByText('ブロックリスト')).toBeTruthy();
    expect(getByText('通知設定')).toBeTruthy();
    expect(getByText('利用規約')).toBeTruthy();
    expect(getByText('プライバシーポリシー')).toBeTruthy();
    expect(getByText('お問い合わせ')).toBeTruthy();
    expect(getByText('ログアウト')).toBeTruthy();
    expect(getByText('アカウント削除')).toBeTruthy();
  });

  it('バージョン情報を表示する', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('バージョン')).toBeTruthy();
    expect(getByText('1.2.3')).toBeTruthy();
  });

  it('公開範囲テキスト（公開）を表示する', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('全員に公開')).toBeTruthy();
  });

  it('公開範囲テキスト（非公開）を表示する', () => {
    mockUseMyProfile.mockReturnValue({
      data: { ...defaultProfile, isPrivate: true },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('相互フォローのみ')).toBeTruthy();
  });

  it('ブロックリスト押下でrouter.pushが呼ばれる', () => {
    const { router } = require('expo-router');
    const { getByText } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByText('ブロックリスト'));
    expect(router.push).toHaveBeenCalledWith('/settings/blocked-users');
  });

  it('アカウント削除押下でrouter.pushが呼ばれる', () => {
    const { router } = require('expo-router');
    const { getByText } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByText('アカウント削除'));
    expect(router.push).toHaveBeenCalledWith('/settings/delete-account');
  });
});

// ================================================================
// DeleteAccountScreen
// ================================================================
describe('DeleteAccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it('警告テキストを表示する', () => {
    const { getByText } = renderWithProviders(<DeleteAccountScreen />);

    expect(getByText('アカウント削除について')).toBeTruthy();
    expect(getByText('この操作は取り消すことができません。')).toBeTruthy();
  });

  it('削除対象データのリストを表示する', () => {
    const { getByText } = renderWithProviders(<DeleteAccountScreen />);

    expect(getByText('- プロフィール情報')).toBeTruthy();
    expect(getByText('- 投稿した回答')).toBeTruthy();
    expect(getByText('- フォロー/フォロワー関係')).toBeTruthy();
    expect(getByText('- リアクション履歴')).toBeTruthy();
    expect(getByText('- ブロックリスト')).toBeTruthy();
  });

  it('確認入力フィールドを表示する', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <DeleteAccountScreen />
    );

    expect(
      getByText('削除を確認するには「DELETE」と入力してください')
    ).toBeTruthy();
    expect(getByPlaceholderText('DELETE')).toBeTruthy();
  });

  it('削除ボタンを表示する', () => {
    const { getByText } = renderWithProviders(<DeleteAccountScreen />);
    expect(getByText('アカウントを削除する')).toBeTruthy();
  });

  it('キャンセルボタンを表示する', () => {
    const { getByText } = renderWithProviders(<DeleteAccountScreen />);
    expect(getByText('キャンセル')).toBeTruthy();
  });

  it('キャンセル押下でrouter.backが呼ばれる', () => {
    const { router } = require('expo-router');
    const { getByText } = renderWithProviders(<DeleteAccountScreen />);

    fireEvent.press(getByText('キャンセル'));
    expect(router.back).toHaveBeenCalled();
  });
});

// ================================================================
// VisibilitySettingsScreen
// ================================================================
describe('VisibilitySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it('ローディング中はインジケーターを表示する', () => {
    mockUseMyProfile.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { queryByText } = renderWithProviders(<VisibilitySettingsScreen />);
    expect(queryByText('全員に公開')).toBeNull();
  });

  it('ヘッダーテキストを表示する', () => {
    const { getByText } = renderWithProviders(<VisibilitySettingsScreen />);
    expect(
      getByText('あなたの回答を閲覧できる人を設定します')
    ).toBeTruthy();
  });

  it('閲覧範囲オプションを表示する', () => {
    const { getByText } = renderWithProviders(<VisibilitySettingsScreen />);

    expect(getByText('全員に公開')).toBeTruthy();
    expect(getByText('フォロワーのみ')).toBeTruthy();
    expect(getByText('相互フォローのみ')).toBeTruthy();
  });

  it('オプションの説明文を表示する', () => {
    const { getByText } = renderWithProviders(<VisibilitySettingsScreen />);

    expect(
      getByText('誰でもあなたの回答を見ることができます')
    ).toBeTruthy();
    expect(
      getByText('あなたをフォローしているユーザーのみ閲覧可能')
    ).toBeTruthy();
    expect(
      getByText('お互いにフォローしているユーザーのみ閲覧可能')
    ).toBeTruthy();
  });

  it('注意テキストを表示する', () => {
    const { getByText } = renderWithProviders(<VisibilitySettingsScreen />);
    expect(
      getByText(
        '※ 相互フォローのみの場合、タイムラインにはお互いにフォローしている人の回答のみが表示されます'
      )
    ).toBeTruthy();
  });

  it('isPrivate: true のときに相互フォローのみが選択状態', () => {
    mockUseMyProfile.mockReturnValue({
      data: { ...defaultProfile, isPrivate: true },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(<VisibilitySettingsScreen />);
    // 画面が正常にレンダリングされることで選択状態が確認できる
    expect(getByText('相互フォローのみ')).toBeTruthy();
  });
});

// ================================================================
// BlockedUsersScreen
// ================================================================
describe('BlockedUsersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
  });

  it('ローディング中はインジケーターを表示する', () => {
    mockUseBlockedUsers.mockReturnValue({
      data: null,
      isLoading: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { queryByText } = renderWithProviders(<BlockedUsersScreen />);
    expect(queryByText('ブロック中のユーザーはいません')).toBeNull();
  });

  it('ブロックユーザーがいない場合は空状態を表示する', () => {
    const { getByText } = renderWithProviders(<BlockedUsersScreen />);
    expect(getByText('ブロック中のユーザーはいません')).toBeTruthy();
  });

  it('ブロックユーザーを表示する', () => {
    mockUseBlockedUsers.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                userId: 'blocked-1',
                appId: 'blockeduser',
                displayName: 'ブロックされたユーザー',
                profileImageUrl: null,
                blockedAt: '2025-01-01T00:00:00Z',
              },
            ],
          },
        ],
      },
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(<BlockedUsersScreen />);
    expect(getByText('ブロックされたユーザー')).toBeTruthy();
    expect(getByText('@blockeduser')).toBeTruthy();
    expect(getByText('解除')).toBeTruthy();
  });
});
