import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';

// ============ Types ============

// NGワード
interface NgWord {
  wordId: string;
  word: string;
  createdAt: string;
}

interface NgWordsResponse {
  items: NgWord[];
}

// お題
interface Question {
  questionId: string;
  text: string;
  source: 'official' | 'user';
  createdAt: string;
  usedAt?: string;
}

interface QuestionsResponse {
  items: Question[];
  nextCursor?: string;
}

// 通報
interface Report {
  reportId: string;
  reporterId: string;
  targetType: 'user' | 'answer';
  targetId: string;
  category: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reporter?: {
    appId: string;
    displayName?: string;
  };
}

interface ReportsResponse {
  items: Report[];
  nextCursor?: string;
}

// ユーザー提案お題
interface QuestionSubmission {
  submissionId: string;
  userId: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  user?: {
    appId: string;
    displayName?: string;
  };
}

interface SubmissionsResponse {
  items: QuestionSubmission[];
  nextCursor?: string;
}

// ユーザー
interface AdminUser {
  userId: string;
  appId?: string;
  email?: string;
  displayName?: string;
  status: 'active' | 'banned';
  createdAt: string;
  answersCount?: number;
}

interface UsersResponse {
  items: AdminUser[];
  nextCursor?: string;
}

// フラグ付き投稿
interface FlaggedPost {
  answerId: string;
  userId: string;
  userAppId: string;
  date: string;
  text: string;
  displayText: string;
  flagReason: string;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'removed';
}

interface FlaggedPostsResponse {
  items: FlaggedPost[];
  nextCursor?: string;
}

// 監査ログ
interface AdminLog {
  logId: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

interface AdminLogsResponse {
  items: AdminLog[];
  nextCursor?: string;
}

// ダッシュボード統計
interface DashboardStats {
  totalUsers: number;
  todayAnswers: number;
  pendingReports: number;
  pendingSubmissions: number;
}

interface RecentReport {
  reportId: string;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: {
    appId: string;
    displayName?: string;
  } | null;
}

interface TodayQuestion {
  questionId: string;
  text: string;
  answerCount: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentReports: RecentReport[];
  todayQuestion: TodayQuestion | null;
  date: string;
}

// ============ Query Keys ============

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  ngWords: () => [...adminKeys.all, 'ng-words'] as const,
  questions: () => [...adminKeys.all, 'questions'] as const,
  reports: (status?: string) => [...adminKeys.all, 'reports', status] as const,
  submissions: (status?: string) => [...adminKeys.all, 'submissions', status] as const,
  users: (query?: string) => [...adminKeys.all, 'users', query] as const,
  flaggedPosts: (status?: string) => [...adminKeys.all, 'flagged-posts', status] as const,
  logs: (action?: string) => [...adminKeys.all, 'logs', action] as const,
};

// ============ ダッシュボード ============

export function useDashboardStats() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: async () => {
      const response = await apiClient.get<DashboardResponse>('/admin/dashboard');
      return response.data;
    },
    refetchInterval: 60000, // 1分ごとに自動更新
  });
}

// ============ NGワード ============

export function useNgWords() {
  return useQuery({
    queryKey: adminKeys.ngWords(),
    queryFn: async () => {
      const response = await apiClient.get<NgWordsResponse>('/admin/ng-words');
      return response.data;
    },
  });
}

export function useAddNgWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: string) => {
      const response = await apiClient.post('/admin/ng-words', { word });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ngWords() });
    },
  });
}

export function useDeleteNgWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wordId: string) => {
      await apiClient.delete(`/admin/ng-words/${encodeURIComponent(wordId)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ngWords() });
    },
  });
}

// ============ お題管理 ============

export function useQuestions() {
  return useQuery({
    queryKey: adminKeys.questions(),
    queryFn: async () => {
      const response = await apiClient.get<QuestionsResponse>('/admin/questions');
      return response.data;
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const response = await apiClient.post('/admin/questions', { text });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.questions() });
    },
  });
}

export function useSetDailyQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, date }: { questionId: string; date: string }) => {
      const response = await apiClient.post('/admin/daily-question', { questionId, date });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.questions() });
    },
  });
}

// ============ 通報管理 ============

export function useReports(status?: string) {
  return useQuery({
    queryKey: adminKeys.reports(status),
    queryFn: async () => {
      const params = status && status !== 'all' ? { status } : {};
      const response = await apiClient.get<ReportsResponse>('/admin/reports', { params });
      return response.data;
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const response = await apiClient.put(`/admin/reports/${reportId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

// ============ ユーザー提案お題 ============

export function useQuestionSubmissions(status?: string) {
  return useQuery({
    queryKey: adminKeys.submissions(status),
    queryFn: async () => {
      const params = status && status !== 'all' ? { status } : {};
      const response = await apiClient.get<SubmissionsResponse>('/admin/submissions', { params });
      return response.data;
    },
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      status,
    }: {
      submissionId: string;
      status: 'approved' | 'rejected';
    }) => {
      const response = await apiClient.put(`/admin/submissions/${submissionId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.submissions() });
    },
  });
}

// ============ ユーザー管理 ============

export function useAdminUsers(query?: string) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: async () => {
      const params = query ? { q: query } : {};
      const response = await apiClient.get<UsersResponse>('/admin/users', { params });
      return response.data;
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/admin/users/${userId}/ban`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/admin/users/${userId}/ban`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

// ============ フラグ付き投稿 ============

export function useFlaggedPosts(status?: string) {
  return useQuery({
    queryKey: adminKeys.flaggedPosts(status),
    queryFn: async () => {
      const params = status && status !== 'all' ? { status } : {};
      const response = await apiClient.get<FlaggedPostsResponse>('/admin/flagged-posts', { params });
      return response.data;
    },
  });
}

export function useReviewFlaggedPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      answerId,
      status,
    }: {
      answerId: string;
      status: 'approved' | 'removed';
    }) => {
      const response = await apiClient.put(`/admin/flagged-posts/${answerId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.flaggedPosts() });
    },
  });
}

// ============ 監査ログ ============

export function useAdminLogs(action?: string) {
  return useQuery({
    queryKey: adminKeys.logs(action),
    queryFn: async () => {
      const params = action && action !== 'all' ? { action } : {};
      const response = await apiClient.get<AdminLogsResponse>('/admin/logs', { params });
      return response.data;
    },
  });
}
