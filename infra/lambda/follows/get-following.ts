import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser, getUserIdFromPath } from '../common/auth';
import { getItem, queryItems, batchGetItems, TABLES } from '../common/dynamodb';
import { success, notFound, unauthorized, forbidden, serverError } from '../common/response';

interface User {
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isPrivate: boolean;
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
          Key: { followerId: authUser.userId, followingId: targetUserId },
        });

        if (!follows) {
          return forbidden('This account is private');
        }
      }
    }

    // Get following
    const following = await queryItems<Follow>({
      TableName: TABLES.FOLLOWS,
      KeyConditionExpression: 'followerId = :userId',
      ExpressionAttributeValues: { ':userId': targetUserId },
      Limit: limit,
    });

    if (following.length === 0) {
      return success({ users: [] });
    }

    // Get user details
    const userIds = following.map((f) => f.followingId);
    const users = await batchGetItems<User>({
      RequestItems: {
        [TABLES.USERS]: {
          Keys: userIds.map((id) => ({ userId: id })),
          ProjectionExpression: 'userId, username, displayName, profileImageUrl',
        },
      },
    });

    // Check if current user follows each user
    const followChecks = await Promise.all(
      userIds.map((id) =>
        getItem<Follow>({
          TableName: TABLES.FOLLOWS,
          Key: { followerId: authUser.userId, followingId: id },
        })
      )
    );

    const followingMap = new Map(userIds.map((id, i) => [id, !!followChecks[i]]));

    const result = users.map((u) => ({
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      profileImageUrl: u.profileImageUrl || null,
      isFollowing: followingMap.get(u.userId) || false,
    }));

    return success({ users: result });
  } catch (err) {
    console.error('Get following error:', err);
    return serverError('Failed to get following');
  }
};
