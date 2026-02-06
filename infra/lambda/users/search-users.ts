import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { scanItems, queryItems, TABLES } from '../common/dynamodb';
import { success, validationError, unauthorized, serverError } from '../common/response';

interface User {
  userId: string;
  username: string;
  appId?: string;
  displayName: string;
  profileImageUrl?: string;
  isPrivate: boolean;
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

    const query = event.queryStringParameters?.q?.toLowerCase();
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 50);

    if (!query || query.length < 2) {
      return validationError('Search query must be at least 2 characters');
    }

    // Get blocked users (both directions)
    const [blockedByMe, blockedMe] = await Promise.all([
      queryItems<Block>({
        TableName: TABLES.BLOCKS,
        KeyConditionExpression: 'blockerId = :userId',
        ExpressionAttributeValues: { ':userId': authUser.userId },
      }),
      queryItems<Block>({
        TableName: TABLES.BLOCKS,
        IndexName: 'blockedId-index',
        KeyConditionExpression: 'blockedId = :userId',
        ExpressionAttributeValues: { ':userId': authUser.userId },
      }),
    ]);

    const blockedUserIds = new Set([
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ]);

    // Scan users (for simple search - in production, use OpenSearch or similar)
    const allUsers = await scanItems<User>({
      TableName: TABLES.USERS,
      ProjectionExpression: 'userId, username, appId, displayName, profileImageUrl, isPrivate',
    });

    // Filter by query and exclude blocked users
    // Only include users who have appId set (completed onboarding)
    const matchedUsers = allUsers
      .filter((user) => {
        if (user.userId === authUser.userId) return false;
        if (blockedUserIds.has(user.userId)) return false;
        if (!user.appId) return false; // Skip users without appId

        const appId = user.appId.toLowerCase();
        const displayName = user.displayName.toLowerCase();

        return appId.includes(query) || displayName.includes(query);
      })
      .slice(0, limit)
      .map((user) => ({
        userId: user.userId,
        appId: user.appId!,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl || null,
        isPrivate: user.isPrivate,
      }));

    return success({
      users: matchedUsers,
      count: matchedUsers.length,
    });
  } catch (err) {
    console.error('Search users error:', err);
    return serverError('Failed to search users');
  }
};
