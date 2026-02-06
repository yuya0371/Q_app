import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';

// Types
interface Question {
  questionId: string;
  userId: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  answerCount: number;
  user?: {
    appId: string;
    displayName?: string;
    profileImageUrl?: string;
  };
}

interface DailyQuestion {
  questionId: string;
  text: string;
  category: string | null;
}

interface UserAnswer {
  answerId: string;
  userId: string;
  questionId: string;
  text: string;
  createdAt: string;
}

interface TodayQuestionResponse {
  date: string;
  isPublished: boolean;
  publishedAt?: string;
  question: DailyQuestion | null;
  hasAnswered: boolean;
  userAnswer: UserAnswer | null;
}

interface QuestionsResponse {
  questions: Question[];
  nextCursor?: string;
  hasMore: boolean;
}

interface CreateQuestionRequest {
  content: string;
}

// クエリキー
export const questionKeys = {
  all: ['questions'] as const,
  today: () => [...questionKeys.all, 'today'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...questionKeys.lists(), filters] as const,
  details: () => [...questionKeys.all, 'detail'] as const,
  detail: (id: string) => [...questionKeys.details(), id] as const,
  feed: () => [...questionKeys.all, 'feed'] as const,
  myQuestions: () => [...questionKeys.all, 'my'] as const,
};

// 今日の質問取得フック
export function useTodayQuestion() {
  return useQuery({
    queryKey: questionKeys.today(),
    queryFn: async () => {
      const response = await apiClient.get<TodayQuestionResponse>('/questions/today');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5分
  });
}

// フィード（タイムライン）取得フック
export function useQuestionsFeed() {
  return useInfiniteQuery({
    queryKey: questionKeys.feed(),
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {};
      const response = await apiClient.get<QuestionsResponse>('/questions/feed', { params });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 1000 * 60 * 2, // 2分
  });
}

// 自分の質問一覧取得フック
export function useMyQuestions() {
  return useInfiniteQuery({
    queryKey: questionKeys.myQuestions(),
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {};
      const response = await apiClient.get<QuestionsResponse>('/questions/me', { params });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
  });
}

// 質問詳細取得フック
export function useQuestion(questionId: string) {
  return useQuery({
    queryKey: questionKeys.detail(questionId),
    queryFn: async () => {
      const response = await apiClient.get<Question>(`/questions/${questionId}`);
      return response.data;
    },
    enabled: !!questionId,
  });
}

// 質問作成フック
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuestionRequest) => {
      const response = await apiClient.post<Question>('/questions', data);
      return response.data;
    },
    onSuccess: () => {
      // フィードと自分の質問をキャッシュ無効化
      queryClient.invalidateQueries({ queryKey: questionKeys.feed() });
      queryClient.invalidateQueries({ queryKey: questionKeys.myQuestions() });
    },
    onError: (error) => {
      console.error('Create question error:', getErrorMessage(error));
    },
  });
}

// 質問削除フック
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      await apiClient.delete(`/questions/${questionId}`);
      return questionId;
    },
    onSuccess: (questionId) => {
      // 詳細キャッシュを削除
      queryClient.removeQueries({ queryKey: questionKeys.detail(questionId) });
      // リストを無効化
      queryClient.invalidateQueries({ queryKey: questionKeys.feed() });
      queryClient.invalidateQueries({ queryKey: questionKeys.myQuestions() });
    },
    onError: (error) => {
      console.error('Delete question error:', getErrorMessage(error));
    },
  });
}

// お題提案フック
export function useSubmitQuestion() {
  return useMutation({
    mutationFn: async (text: string) => {
      const response = await apiClient.post('/questions/submit', { text });
      return response.data;
    },
    onError: (error) => {
      console.error('Submit question error:', getErrorMessage(error));
    },
  });
}
