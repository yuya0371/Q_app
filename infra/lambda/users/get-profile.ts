import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser, getUserIdFromPath } from '../common/auth';
import { getItem, queryItems, TABLES } from '../common/dynamodb';
import { success, notFound, unauthorized, serverError } from '../common/response';

interface User {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  birthDate: string;
  profileImageUrl?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Follow {
  followerId: string;
  followingId: string;
}

interface Block {
  blockerId: string;
  blockedId: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const targetUserId = getUserIdFromPath(event);
    if (!targetUserId) {
      return notFound('User not found');
    }

    // Get user profile
    const user = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: targetUserId },
    });

    if (!user) {
      return notFound('User not found');
    }

    // Check if blocked
    if (targetUserId !== authUser.userId) {
      const blocked = await getItem<Block>({
        TableName: TABLES.BLOCKS,
        Key: { blockerId: targetUserId, blockedId: authUser.userId },
      });

      if (blocked) {
        return notFound('User not found');
      }
    }

    // Determine if viewing own profile
    const isOwnProfile = targetUserId === authUser.userId;

    // Get follow/follower counts
    const [followers, following] = await Promise.all([
      queryItems<Follow>({
        TableName: TABLES.FOLLOWS,
        IndexName: 'followingId-index',
        KeyConditionExpression: 'followingId = :userId',
        ExpressionAttributeValues: { ':userId': targetUserId },
        Select: 'COUNT',
      }),
      queryItems<Follow>({
        TableName: TABLES.FOLLOWS,
        KeyConditionExpression: 'followerId = :userId',
        ExpressionAttributeValues: { ':userId': targetUserId },
        Select: 'COUNT',
      }),
    ]);

    // Check if current user follows this user
    let isFollowing = false;
    let isFollowedBy = false;

    if (!isOwnProfile) {
      const [followsTarget, targetFollows] = await Promise.all([
        getItem<Follow>({
          TableName: TABLES.FOLLOWS,
          Key: { followerId: authUser.userId, followingId: targetUserId },
        }),
        getItem<Follow>({
          TableName: TABLES.FOLLOWS,
          Key: { followerId: targetUserId, followingId: authUser.userId },
        }),
      ]);

      isFollowing = !!followsTarget;
      isFollowedBy = !!targetFollows;
    }

    // Build response
    const profile: Record<string, unknown> = {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio || '',
      profileImageUrl: user.profileImageUrl || null,
      isPrivate: user.isPrivate,
      followerCount: followers.length,
      followingCount: following.length,
      createdAt: user.createdAt,
    };

    // Add additional fields for own profile
    if (isOwnProfile) {
      profile.email = user.email;
      profile.birthDate = user.birthDate;
    } else {
      profile.isFollowing = isFollowing;
      profile.isFollowedBy = isFollowedBy;
    }

    return success({ user: profile });
  } catch (err) {
    console.error('Get profile error:', err);
    return serverError('Failed to get profile');
  }
};
