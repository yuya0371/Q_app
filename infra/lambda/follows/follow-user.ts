import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, notFound, conflict, unauthorized, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface User {
  userId: string;
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

    const targetUserId = event.pathParameters?.userId;
    if (!targetUserId) {
      return validationError('userId is required');
    }

    // Can't follow yourself
    if (targetUserId === authUser.userId) {
      return validationError('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: targetUserId },
    });

    if (!targetUser) {
      return notFound('User not found');
    }

    // Check if blocked (either direction)
    const [blockedByTarget, blockedByMe] = await Promise.all([
      getItem<Block>({
        TableName: TABLES.BLOCKS,
        Key: { blockerId: targetUserId, blockedId: authUser.userId },
      }),
      getItem<Block>({
        TableName: TABLES.BLOCKS,
        Key: { blockerId: authUser.userId, blockedId: targetUserId },
      }),
    ]);

    if (blockedByTarget || blockedByMe) {
      return notFound('User not found');
    }

    // Check if already following
    const existingFollow = await getItem<Follow>({
      TableName: TABLES.FOLLOWS,
      Key: { followerId: authUser.userId, followeeId: targetUserId },
    });

    if (existingFollow) {
      return conflict('Already following this user');
    }

    // Create follow
    const timestamp = now();

    await putItem({
      TableName: TABLES.FOLLOWS,
      Item: {
        followerId: authUser.userId,
        followeeId: targetUserId,
        createdAt: timestamp,
      },
    });

    return success({
      message: 'Successfully followed user',
    });
  } catch (err) {
    console.error('Follow user error:', err);
    return serverError('Failed to follow user');
  }
};
