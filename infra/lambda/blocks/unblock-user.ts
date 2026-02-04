import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, deleteItem, TABLES } from '../common/dynamodb';
import { success, validationError, notFound, unauthorized, serverError } from '../common/response';

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

    // Check if blocked
    const existingBlock = await getItem<Block>({
      TableName: TABLES.BLOCKS,
      Key: { blockerId: authUser.userId, blockedId: targetUserId },
    });

    if (!existingBlock) {
      return notFound('User is not blocked');
    }

    // Delete block
    await deleteItem({
      TableName: TABLES.BLOCKS,
      Key: { blockerId: authUser.userId, blockedId: targetUserId },
    });

    return success({
      message: 'Successfully unblocked user',
    });
  } catch (err) {
    console.error('Unblock user error:', err);
    return serverError('Failed to unblock user');
  }
};
