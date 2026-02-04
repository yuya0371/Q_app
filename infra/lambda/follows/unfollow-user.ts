import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, deleteItem, TABLES } from '../common/dynamodb';
import { success, validationError, notFound, unauthorized, serverError } from '../common/response';

interface Follow {
  followerId: string;
  followingId: string;
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

    // Check if following
    const existingFollow = await getItem<Follow>({
      TableName: TABLES.FOLLOWS,
      Key: { followerId: authUser.userId, followingId: targetUserId },
    });

    if (!existingFollow) {
      return notFound('Not following this user');
    }

    // Delete follow
    await deleteItem({
      TableName: TABLES.FOLLOWS,
      Key: { followerId: authUser.userId, followingId: targetUserId },
    });

    return success({
      message: 'Successfully unfollowed user',
    });
  } catch (err) {
    console.error('Unfollow user error:', err);
    return serverError('Failed to unfollow user');
  }
};
