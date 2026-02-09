import React from 'react';
import { renderWithProviders } from '../test-utils';

// --- Mocks ---

// useAuth hooks
const mockSetAppIdMutateAsync = jest.fn();
jest.mock('../../hooks/api/useAuth', () => ({
  useSetAppId: () => ({
    mutateAsync: mockSetAppIdMutateAsync,
    isPending: false,
  }),
}));

// useUsers hooks
const mockUpdateProfileMutateAsync = jest.fn();
const mockUpdateProfileImageMutateAsync = jest.fn();
jest.mock('../../hooks/api/useUsers', () => ({
  useUpdateProfile: () => ({
    mutateAsync: mockUpdateProfileMutateAsync,
    isPending: false,
  }),
  useUpdateProfileImage: () => ({
    mutateAsync: mockUpdateProfileImageMutateAsync,
    isPending: false,
  }),
  useSearchUsers: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
  })),
  useFollow: () => ({ mutateAsync: jest.fn() }),
  useUnfollow: () => ({ mutateAsync: jest.fn() }),
}));

// useQuestions hooks
jest.mock('../../hooks/api/useQuestions', () => ({
  useTodayQuestion: jest.fn(() => ({
    data: {
      date: '2025-01-01',
      question: { questionId: 'q1', text: '好きな食べ物は？' },
      hasAnswered: false,
      userAnswer: null,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  questionKeys: {
    all: ['questions'],
    today: () => ['questions', 'today'],
  },
  useSubmitQuestion: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

// useAnswers hooks
jest.mock('../../hooks/api/useAnswers', () => ({
  useCreateAnswer: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useTimeline: jest.fn(() => ({
    data: { items: [] },
    isLoading: false,
    refetch: jest.fn(),
  })),
  useAddReaction: () => ({ mutateAsync: jest.fn() }),
  useRemoveReaction: () => ({ mutateAsync: jest.fn() }),
  answerKeys: {
    all: ['answers'],
    timeline: (date: string) => ['answers', 'timeline', date],
  },
}));

// authStore
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = {
      setOnboardingComplete: jest.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// errorHandler
jest.mock('../../utils/errorHandler', () => ({
  getErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : 'エラーが発生しました',
}));

// expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true })
  ),
}));

// useSearchUsers from hooks/api (barrel)
jest.mock('../../hooks/api', () => ({
  useSearchUsers: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
  })),
  useFollow: () => ({ mutateAsync: jest.fn() }),
  useUnfollow: () => ({ mutateAsync: jest.fn() }),
}));

// useDebouncedValue
jest.mock('../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

// TimelineItem component
jest.mock('../../components/TimelineItem', () => ({
  TimelineItem: ({ item }: { item: { displayText: string } }) => {
    const { Text } = require('react-native');
    return <Text>{item.displayText}</Text>;
  },
}));

// SubmitQuestionModal component
jest.mock('../../components/SubmitQuestionModal', () => ({
  SubmitQuestionModal: () => null,
}));

// --- Import screens ---
import SetAppIdScreen from '../../../app/(auth)/set-app-id';
import SetProfileScreen from '../../../app/(auth)/set-profile';
import HomeScreen from '../../../app/(tabs)/index';
import SearchScreen from '../../../app/(tabs)/search';

import { screen } from '@testing-library/react-native';

// ======================
// SetAppIdScreen Tests
// ======================
describe('SetAppIdScreen', () => {
  it('画面がレンダリングされること', () => {
    renderWithProviders(<SetAppIdScreen />);
    expect(screen.getByText('アプリ内IDを決めましょう')).toBeTruthy();
  });

  it('ID入力フォームが表示されること', () => {
    renderWithProviders(<SetAppIdScreen />);
    expect(screen.getByPlaceholderText('your_id')).toBeTruthy();
    expect(screen.getByText('@')).toBeTruthy();
    expect(screen.getByText('アプリ内ID')).toBeTruthy();
  });

  it('バリデーションルールが表示されること', () => {
    renderWithProviders(<SetAppIdScreen />);
    expect(
      screen.getByText('3〜20文字の半角英数字とアンダースコア(_)のみ')
    ).toBeTruthy();
  });

  it('利用可能確認ボタンが表示されること', () => {
    renderWithProviders(<SetAppIdScreen />);
    expect(screen.getByText('利用可能か確認')).toBeTruthy();
  });

  it('次へボタンが表示されること', () => {
    renderWithProviders(<SetAppIdScreen />);
    expect(screen.getByText('次へ')).toBeTruthy();
  });

  it('説明文が表示されること', () => {
    renderWithProviders(<SetAppIdScreen />);
    expect(
      screen.getByText(/後から変更することはできません/)
    ).toBeTruthy();
  });
});

// ======================
// SetProfileScreen Tests
// ======================
describe('SetProfileScreen', () => {
  it('画面がレンダリングされること', () => {
    renderWithProviders(<SetProfileScreen />);
    expect(screen.getByText('プロフィールを設定しましょう')).toBeTruthy();
  });

  it('アイコン選択エリアが表示されること', () => {
    renderWithProviders(<SetProfileScreen />);
    expect(screen.getByText('+')).toBeTruthy();
    expect(screen.getByText('タップして写真を選択')).toBeTruthy();
  });

  it('表示名入力が表示されること', () => {
    renderWithProviders(<SetProfileScreen />);
    expect(screen.getByText('表示名（任意）')).toBeTruthy();
    expect(screen.getByPlaceholderText('表示名')).toBeTruthy();
  });

  it('自己紹介入力が表示されること', () => {
    renderWithProviders(<SetProfileScreen />);
    expect(screen.getByText('自己紹介（任意）')).toBeTruthy();
    expect(screen.getByPlaceholderText('自己紹介を入力')).toBeTruthy();
  });

  it('スキップリンクが表示されること', () => {
    renderWithProviders(<SetProfileScreen />);
    expect(screen.getByText('スキップ')).toBeTruthy();
  });

  it('完了ボタンが表示されること', () => {
    renderWithProviders(<SetProfileScreen />);
    expect(screen.getByText('完了')).toBeTruthy();
  });

  it('あとから変更できるという説明が表示されること', () => {
    renderWithProviders(<SetProfileScreen />);
    expect(
      screen.getByText('あとからいつでも変更できます。')
    ).toBeTruthy();
  });
});

// ======================
// HomeScreen Tests
// ======================
describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画面がレンダリングされること', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('今日の質問')).toBeTruthy();
  });

  it('質問カードが表示されること', () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('好きな食べ物は？')).toBeTruthy();
    expect(screen.getByText('2025-01-01')).toBeTruthy();
  });

  it('未回答時に回答入力エリアが表示されること', () => {
    renderWithProviders(<HomeScreen />);
    expect(
      screen.getByPlaceholderText('あなたの回答を入力...')
    ).toBeTruthy();
    expect(screen.getByText('投稿')).toBeTruthy();
    expect(screen.getByText('0/80')).toBeTruthy();
  });

  it('未回答時にロック表示がされること', () => {
    renderWithProviders(<HomeScreen />);
    expect(
      screen.getByText('回答するとみんなの回答が見れるようになります')
    ).toBeTruthy();
  });

  it('回答済み時にタイムラインが表示されること', () => {
    const { useTodayQuestion } = require('../../hooks/api/useQuestions');
    (useTodayQuestion as jest.Mock).mockReturnValue({
      data: {
        date: '2025-01-01',
        question: { questionId: 'q1', text: '好きな食べ物は？' },
        hasAnswered: true,
        userAnswer: { answerId: 'a1', text: 'ラーメン' },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('✓ 回答済み')).toBeTruthy();
    expect(screen.getByText('あなたの回答')).toBeTruthy();
    expect(screen.getByText('ラーメン')).toBeTruthy();
    expect(screen.getByText('みんなの回答')).toBeTruthy();
  });

  it('ローディング中の表示がされること', () => {
    const { useTodayQuestion } = require('../../hooks/api/useQuestions');
    (useTodayQuestion as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<HomeScreen />);
    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });
});

// ======================
// SearchScreen Tests
// ======================
describe('SearchScreen', () => {
  it('画面がレンダリングされること', () => {
    renderWithProviders(<SearchScreen />);
    expect(
      screen.getByPlaceholderText('ユーザーを検索...')
    ).toBeTruthy();
  });

  it('検索バーが表示されること', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByText('検索')).toBeTruthy();
    expect(
      screen.getByPlaceholderText('ユーザーを検索...')
    ).toBeTruthy();
  });

  it('初期状態のテキストが表示されること', () => {
    renderWithProviders(<SearchScreen />);
    expect(
      screen.getByText(/ユーザー名で検索できます/)
    ).toBeTruthy();
    expect(
      screen.getByText(/2文字以上入力してください/)
    ).toBeTruthy();
  });
});
