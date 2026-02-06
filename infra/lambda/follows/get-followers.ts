import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser, getUserIdFromPath } from '../common/auth';
import { getItem, queryItems, batchGetItems, TABLES } from '../common/dynamodb';
import { success, notFound, unauthorized, forbidden, serverError } from '../common/response';

interface User {
  userId: string;
  appId?: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isPrivate: boolean;
}

interface Follow {
  followerId: string;
  followeeId: string;
  createdAt?: string;
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

    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '50'), 100);

    // Check if target user exists
    const targetUser = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: targetUserId },
    });

    if (!targetUser) {
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

      // Check private account
      if (targetUser.isPrivate) {
        const follows = await getItem<Follow>({
          TableName: TABLES.FOLLOWS,
          Key: { followerId: authUser.userId, followeeId: targetUserId },
        });

        if (!follows) {
          return forbidden('This account is private');
        }
      }
    }

    // Get followers using GSI
    const followers = await queryItems<Follow>({
      TableName: TABLES.FOLLOWS,
      IndexName: 'GSI1_Followers',
      KeyConditionExpression: 'followeeId = :userId',
      ExpressionAttributeValues: { ':userId': targetUserId },
      Limit: limit,
    });

    if (followers.length === 0) {
      return success({ items: [] });
    }

    // Get user details
    const userIds = followers.map((f) => f.followerId);
    const users = await batchGetItems<User>({
      RequestItems: {
        [TABLES.USERS]: {
          Keys: userIds.map((id) => ({ userId: id })),
          ProjectionExpression: 'userId, appId, username, displayName, profileImageUrl',
        },
      },
    });

    // Create a map for follow timestamps
    const followTimestampMap = new Map(followers.map((f) => [f.followerId, f.createdAt]));

    const result = users.map((u) => ({
      userId: u.userId,
      appId: u.appId || u.username,
      displayName: u.displayName,
      profileImageUrl: u.profileImageUrl || null,
      followedAt: followTimestampMap.get(u.userId) || new Date().toISOString(),
    }));

    return success({ items: result });
  } catch (err) {
    console.error('Get followers error:', err);
    return serverError('Failed to get followers');
  }
};
