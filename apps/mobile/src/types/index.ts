// User types
export interface User {
  userId: string;
  email: string;
  appId: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  birthDate: string;
  visibilitySetting: VisibilitySetting;
  createdAt: string;
  updatedAt: string;
}

export type VisibilitySetting = 'everyone' | 'followers' | 'mutual';

// Question types
export interface Question {
  questionId: string;
  text: string;
  source: 'official' | 'user';
  publishedAt: string;
}

// Answer types
export interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
  answerText: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  user?: UserSummary;
  reactions?: ReactionSummary;
}

export interface UserSummary {
  userId: string;
  appId: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface ReactionSummary {
  [emoji: string]: number;
}

// Reaction types
export type ReactionEmoji = '❤️' | '🔥' | '😂' | '🤔' | '👀';

export interface Reaction {
  reactionId: string;
  answerId: string;
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

// Follow types
export interface Follow {
  followId: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface FollowSummary {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

// Block types
export interface Block {
  blockId: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

// Report types
export type ReportCategory =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'impersonation'
  | 'privacy'
  | 'other';

export interface Report {
  reportId: string;
  reporterId: string;
  targetType: 'user' | 'answer';
  targetId: string;
  category: ReportCategory;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

// API request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  birthDate: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  visibilitySetting?: VisibilitySetting;
}

export interface PostAnswerRequest {
  questionId: string;
  answerText: string;
}

export interface AddReactionRequest {
  answerId: string;
  emoji: ReactionEmoji;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}
