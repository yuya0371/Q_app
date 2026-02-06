import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser, getUserIdFromPath } from '../common/auth';
import { getItem, queryItems, queryCount, TABLES } from '../common/dynamodb';
import { success, notFound, unauthorized, serverError } from '../common/response';

interface User {
  userId: string;
  appId?: string;
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
  followeeId: string;
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

    const pathParam = event.pathParameters?.userId;
    if (!pathParam) {
      return notFound('User not found');
    }

    let user: User | null = null;
    let targetUserId: string;

    if (pathParam === 'me') {
      // Get own profile by userId
      targetUserId = authUser.userId;
      user = await getItem<User>({
        TableName: TABLES.USERS,
        Key: { userId: targetUserId },
      });
    } else {
      // Get other user's profile by appId
      const users = await queryItems<User>({
        TableName: TABLES.USERS,
        IndexName: 'GSI1_AppId',
        KeyConditionExpression: 'appId = :appId',
        ExpressionAttributeValues: { ':appId': pathParam },
        Limit: 1,
      });
      user = users.length > 0 ? users[0] : null;
      targetUserId = user?.userId || '';
    }

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
    const [followerCount, followingCount] = await Promise.all([
      queryCount({
        TableName: TABLES.FOLLOWS,
        IndexName: 'GSI1_Followers',
        KeyConditionExpression: 'followeeId = :userId',
        ExpressionAttributeValues: { ':userId': targetUserId },
      }),
      queryCount({
        TableName: TABLES.FOLLOWS,
        KeyConditionExpression: 'followerId = :userId',
        ExpressionAttributeValues: { ':userId': targetUserId },
      }),
    ]);

    // Check if current user follows this user
    let isFollowing = false;
    let isFollowedBy = false;

    if (!isOwnProfile) {
      const [followsTarget, targetFollows] = await Promise.all([
        getItem<Follow>({
          TableName: TABLES.FOLLOWS,
          Key: { followerId: authUser.userId, followeeId: targetUserId },
        }),
        getItem<Follow>({
          TableName: TABLES.FOLLOWS,
          Key: { followerId: targetUserId, followeeId: authUser.userId },
        }),
      ]);

      isFollowing = !!followsTarget;
      isFollowedBy = !!targetFollows;
    }

    // Build response
    const profile: Record<string, unknown> = {
      userId: user.userId,
      appId: user.appId || null,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio || '',
      profileImageUrl: user.profileImageUrl || null,
      isPrivate: user.isPrivate,
      followerCount,
      followingCount,
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

    return success(profile);
  } catch (err) {
    console.error('Get profile error:', err);
    return serverError('Failed to get profile');
  }
};
