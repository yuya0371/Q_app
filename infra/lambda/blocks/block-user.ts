import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, putItem, deleteItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, notFound, conflict, unauthorized, serverError } from '../common/response';

interface User {
  userId: string;
}

interface Block {
  blockerId: string;
  blockedId: string;
}

interface Follow {
  followerId: string;
  followeeId: string;
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

    // Can't block yourself
    if (targetUserId === authUser.userId) {
      return validationError('Cannot block yourself');
    }

    // Check if target user exists
    const targetUser = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: targetUserId },
    });

    if (!targetUser) {
      return notFound('User not found');
    }

    // Check if already blocked
    const existingBlock = await getItem<Block>({
      TableName: TABLES.BLOCKS,
      Key: { blockerId: authUser.userId, blockedId: targetUserId },
    });

    if (existingBlock) {
      return conflict('Already blocked this user');
    }

    // Create block
    const timestamp = now();

    await putItem({
      TableName: TABLES.BLOCKS,
      Item: {
        blockerId: authUser.userId,
        blockedId: targetUserId,
        createdAt: timestamp,
      },
    });

    // Remove any follow relationships
    await Promise.all([
      deleteItem({
        TableName: TABLES.FOLLOWS,
        Key: { followerId: authUser.userId, followeeId: targetUserId },
      }).catch(() => {}), // Ignore if not exists
      deleteItem({
        TableName: TABLES.FOLLOWS,
        Key: { followerId: targetUserId, followeeId: authUser.userId },
      }).catch(() => {}), // Ignore if not exists
    ]);

    return success({
      message: 'Successfully blocked user',
    });
  } catch (err) {
    console.error('Block user error:', err);
    return serverError('Failed to block user');
  }
};
