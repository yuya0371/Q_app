import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';
import { questionKeys } from './useQuestions';

// Types
interface Answer {
  answerId: string;
  questionId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    appId: string;
    displayName?: string;
    profileImageUrl?: string;
  };
}

interface TimelineUser {
  userId: string;
  appId: string;
  displayName?: string;
  profileImageUrl?: string;
}

interface TimelineItem {
  answerId: string;
  user: TimelineUser;
  text: string;
  displayText: string;
  isOnTime: boolean;
  lateMinutes: number;
  createdAt: string;
  myReaction: string | null;
}

interface TimelineResponse {
  date: string;
  questionText: string;
  hasAnswered: boolean;
  items: TimelineItem[];
}

interface AnswersResponse {
  answers: Answer[];
  nextCursor?: string;
  hasMore: boolean;
}

interface MyAnswerItem {
  answerId: string;
  date: string;
  questionText: string;
  text: string;
  isOnTime: boolean;
  lateMinutes: number;
  isDeleted: boolean;
  createdAt: string;
  deletedAt?: string;
}

interface MyAnswersResponse {
  items: MyAnswerItem[];
  nextCursor?: string;
}

interface CreateAnswerRequest {
  questionId: string;
  content: string;
}

// クエリキー
export const answerKeys = {
  all: ['answers'] as const,
  lists: () => [...answerKeys.all, 'list'] as const,
  byQuestion: (questionId: string) => [...answerKeys.lists(), { questionId }] as const,
  details: () => [...answerKeys.all, 'detail'] as const,
  detail: (id: string) => [...answerKeys.details(), id] as const,
  myAnswers: () => [...answerKeys.all, 'my'] as const,
  timeline: (date: string) => [...answerKeys.all, 'timeline', date] as const,
};

// 質問に対する回答一覧取得フック
export function useAnswersByQuestion(questionId: string) {
  return useInfiniteQuery({
    queryKey: answerKeys.byQuestion(questionId),
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {};
      const response = await apiClient.get<AnswersResponse>(`/questions/${questionId}/answers`, {
        params,
      });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!questionId,
  });
}

// 自分の回答一覧取得フック
export function useMyAnswers() {
  return useInfiniteQuery({
    queryKey: answerKeys.myAnswers(),
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {};
      const response = await apiClient.get<MyAnswersResponse>('/answers/me', { params });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// 回答詳細取得フック
export function useAnswer(answerId: string) {
  return useQuery({
    queryKey: answerKeys.detail(answerId),
    queryFn: async () => {
      const response = await apiClient.get<Answer>(`/answers/${answerId}`);
      return response.data;
    },
    enabled: !!answerId,
  });
}

// 回答作成フック
export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAnswerRequest) => {
      const response = await apiClient.post<Answer>(`/questions/${data.questionId}/answers`, {
        content: data.content,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // 質問の回答リストを無効化
      queryClient.invalidateQueries({ queryKey: answerKeys.byQuestion(data.questionId) });
      // 質問の詳細を無効化（回答数更新のため）
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(data.questionId) });
      // 自分の回答リストを無効化
      queryClient.invalidateQueries({ queryKey: answerKeys.myAnswers() });
    },
    onError: (error) => {
      console.error('Create answer error:', getErrorMessage(error));
    },
  });
}

// 回答削除フック
export function useDeleteAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ answerId, questionId }: { answerId: string; questionId: string }) => {
      await apiClient.delete(`/answers/${answerId}`);
      return { answerId, questionId };
    },
    onSuccess: ({ answerId, questionId }) => {
      // 詳細キャッシュを削除
      queryClient.removeQueries({ queryKey: answerKeys.detail(answerId) });
      // 質問の回答リストを無効化
      queryClient.invalidateQueries({ queryKey: answerKeys.byQuestion(questionId) });
      // 質問の詳細を無効化（回答数更新のため）
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(questionId) });
      // 自分の回答リストを無効化
      queryClient.invalidateQueries({ queryKey: answerKeys.myAnswers() });
    },
    onError: (error) => {
      console.error('Delete answer error:', getErrorMessage(error));
    },
  });
}

// タイムライン取得フック
export function useTimeline(date: string) {
  return useQuery({
    queryKey: answerKeys.timeline(date),
    queryFn: async () => {
      const response = await apiClient.get<TimelineResponse>('/answers/timeline', {
        params: { date },
      });
      return response.data;
    },
    enabled: !!date,
    staleTime: 1000 * 60 * 2, // 2分
  });
}

// リアクション付与フック
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ answerId, reactionType }: { answerId: string; reactionType: string }) => {
      const response = await apiClient.put(`/answers/${answerId}/reactions`, { reactionType });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // タイムラインキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: answerKeys.all });
    },
    onError: (error) => {
      console.error('Add reaction error:', getErrorMessage(error));
    },
  });
}

// リアクション解除フック
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answerId: string) => {
      await apiClient.delete(`/answers/${answerId}/reactions`);
      return answerId;
    },
    onSuccess: () => {
      // タイムラインキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: answerKeys.all });
    },
    onError: (error) => {
      console.error('Remove reaction error:', getErrorMessage(error));
    },
  });
}

// 回答復活フック
export function useRestoreAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answerId: string) => {
      const response = await apiClient.post(`/answers/${answerId}/restore`);
      return response.data;
    },
    onSuccess: () => {
      // 自分の回答リストを無効化
      queryClient.invalidateQueries({ queryKey: answerKeys.myAnswers() });
      // タイムラインも無効化（復活した回答が表示されるように）
      queryClient.invalidateQueries({ queryKey: answerKeys.all });
    },
    onError: (error) => {
      console.error('Restore answer error:', getErrorMessage(error));
    },
  });
}
