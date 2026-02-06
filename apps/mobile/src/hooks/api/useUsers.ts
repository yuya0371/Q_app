import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage } from '../../utils/errorHandler';

// Types
interface UserProfile {
  userId: string;
  appId?: string;
  username?: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  isPrivate?: boolean;
  followingCount?: number;
  followerCount?: number;
  createdAt?: string;
  // 他人のプロフィール取得時のみ
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  isBlockedBy?: boolean;
}

interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  isPrivate?: boolean;
}

interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
}

interface UploadUrlRequest {
  contentType: string;
  fileName: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  imageUrl: string;
  expiresIn: number;
}

interface UpdateProfileImageRequest {
  imageUri: string;
}

interface FollowUser {
  userId: string;
  appId: string;
  displayName?: string;
  profileImageUrl?: string;
  followedAt: string;
}

interface FollowListResponse {
  items: FollowUser[];
  nextCursor?: string;
}

interface FollowStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
}

interface OtherUserProfile {
  userId: string;
  appId: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  followingCount: number;
  followerCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBlocked: boolean;
  isBlockedBy: boolean;
}

// 検索結果のユーザー
interface SearchUser {
  userId: string;
  appId: string;
  displayName: string;
  profileImageUrl?: string | null;
  isPrivate: boolean;
}

interface SearchUsersResponse {
  users: SearchUser[];
  count: number;
}

// クエリキー
export const userKeys = {
  all: ['users'] as const,
  profiles: () => [...userKeys.all, 'profile'] as const,
  profile: (appId: string) => [...userKeys.profiles(), appId] as const,
  me: () => [...userKeys.all, 'me'] as const,
  following: () => [...userKeys.all, 'following'] as const,
  followers: () => [...userKeys.all, 'followers'] as const,
  followStatus: (userId: string) => [...userKeys.all, 'followStatus', userId] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
};

// 自分のプロフィール取得フック
export function useMyProfile() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>('/users/me');
      return response.data;
    },
  });
}

// ユーザープロフィール取得フック（appIdで）
export function useUserProfile(appId: string) {
  return useQuery({
    queryKey: userKeys.profile(appId),
    queryFn: async () => {
      const response = await apiClient.get<UserProfile>(`/users/${appId}`);
      return response.data;
    },
    enabled: !!appId,
  });
}

// プロフィール更新フック
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      // API GatewayではPUTメソッドで定義されている
      const response = await apiClient.put<UpdateProfileResponse>('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      // ローカルストアを更新
      updateUser({
        displayName: data.user.displayName,
        profileImageUrl: data.user.profileImageUrl,
      });
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      if (data.user.appId) {
        queryClient.invalidateQueries({ queryKey: userKeys.profile(data.user.appId) });
      }
    },
    onError: (error) => {
      console.error('Update profile error:', getErrorMessage(error));
    },
  });
}

// プロフィール画像アップロードURL取得フック
export function useGetProfileImageUploadUrl() {
  return useMutation({
    mutationFn: async (data: UploadUrlRequest) => {
      const response = await apiClient.post<UploadUrlResponse>(
        '/users/me/profile-image',
        data
      );
      return response.data;
    },
    onError: (error) => {
      console.error('Get upload URL error:', getErrorMessage(error));
    },
  });
}

// プロフィール画像更新フック（presigned URLを使用）
export function useUpdateProfileImage() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const getUploadUrl = useGetProfileImageUploadUrl();

  return useMutation({
    mutationFn: async (data: UpdateProfileImageRequest) => {
      const uri = data.imageUri;
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1].toLowerCase() : 'jpg';
      const contentType = extension === 'png' ? 'image/png' :
                          extension === 'webp' ? 'image/webp' : 'image/jpeg';

      // 1. presigned URLを取得
      const uploadUrlResponse = await getUploadUrl.mutateAsync({
        contentType,
        fileName: filename,
      });

      // 2. 画像ファイルを取得してS3にアップロード
      const response = await fetch(uri);
      const blob = await response.blob();

      await fetch(uploadUrlResponse.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: blob,
      });

      return { profileImageUrl: uploadUrlResponse.imageUrl };
    },
    onSuccess: (data) => {
      // ローカルストアを更新
      updateUser({ profileImageUrl: data.profileImageUrl });
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
    onError: (error) => {
      console.error('Update profile image error:', getErrorMessage(error));
    },
  });
}

// フォロー一覧取得フック
export function useFollowing() {
  return useInfiniteQuery({
    queryKey: userKeys.following(),
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {};
      const response = await apiClient.get<FollowListResponse>('/users/me/following', { params });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// フォロワー一覧取得フック
export function useFollowers() {
  return useInfiniteQuery({
    queryKey: userKeys.followers(),
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {};
      const response = await apiClient.get<FollowListResponse>('/users/me/followers', { params });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// フォロー状態取得フック
export function useFollowStatus(userId: string) {
  return useQuery({
    queryKey: userKeys.followStatus(userId),
    queryFn: async () => {
      const response = await apiClient.get<FollowStatusResponse>(`/users/${userId}/follow-status`);
      return response.data;
    },
    enabled: !!userId,
  });
}

// フォローフック
export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/users/${userId}/follow`);
      return response.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.followStatus(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.following() });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
    onError: (error) => {
      console.error('Follow error:', getErrorMessage(error));
    },
  });
}

// フォロー解除フック
export function useUnfollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/users/${userId}/follow`);
      return response.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.followStatus(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.following() });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
    onError: (error) => {
      console.error('Unfollow error:', getErrorMessage(error));
    },
  });
}

// プロフィール画像削除フック
export function useDeleteProfileImage() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/users/me/profile-image');
      return response.data;
    },
    onSuccess: () => {
      updateUser({ profileImageUrl: undefined });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
    onError: (error) => {
      console.error('Delete profile image error:', getErrorMessage(error));
    },
  });
}

// ユーザー検索フック
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: userKeys.search(query),
    queryFn: async () => {
      const response = await apiClient.get<SearchUsersResponse>('/users/search', {
        params: { q: query },
      });
      return response.data;
    },
    enabled: query.length >= 2,
  });
}

// ブロックユーザー
interface BlockedUser {
  userId: string;
  appId: string | null;
  displayName: string;
  profileImageUrl: string | null;
  blockedAt: string;
}

interface BlocksListResponse {
  items: BlockedUser[];
  nextCursor: string | null;
}

// ブロック一覧取得フック
export function useBlockedUsers() {
  return useInfiniteQuery({
    queryKey: [...userKeys.all, 'blocks'] as const,
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {};
      const response = await apiClient.get<BlocksListResponse>('/users/me/blocks', { params });
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// ブロックフック
export function useBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/users/${userId}/block`);
      return response.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'blocks'] });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
    onError: (error) => {
      console.error('Block error:', getErrorMessage(error));
    },
  });
}

// ブロック解除フック
export function useUnblock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/users/${userId}/block`);
      return response.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'blocks'] });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
    onError: (error) => {
      console.error('Unblock error:', getErrorMessage(error));
    },
  });
}

// アカウント削除フック
export function useDeleteAccount() {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/users/me', {
        data: { confirmation: 'DELETE' },
      });
      return response.data;
    },
    onSuccess: () => {
      logout();
    },
    onError: (error) => {
      console.error('Delete account error:', getErrorMessage(error));
    },
  });
}
