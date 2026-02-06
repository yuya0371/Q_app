import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { queryItems, batchGetItems, TABLES } from '../common/dynamodb';
import { success, unauthorized, serverError } from '../common/response';

interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

interface User {
  userId: string;
  appId?: string;
  displayName: string;
  profileImageUrl?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100);
    const cursor = event.queryStringParameters?.cursor;

    // Get blocked users
    const blocks = await queryItems<Block>({
      TableName: TABLES.BLOCKS,
      KeyConditionExpression: 'blockerId = :userId',
      ExpressionAttributeValues: { ':userId': authUser.userId },
      Limit: limit + 1,
      ...(cursor && { ExclusiveStartKey: JSON.parse(Buffer.from(cursor, 'base64').toString()) }),
    });

    const hasMore = blocks.length > limit;
    const blocksToReturn = hasMore ? blocks.slice(0, limit) : blocks;

    if (blocksToReturn.length === 0) {
      return success({
        items: [],
        nextCursor: null,
      });
    }

    // Get user info for blocked users
    const userIds = blocksToReturn.map((b) => b.blockedId);
    const users = await batchGetItems<User>({
      TableName: TABLES.USERS,
      Keys: userIds.map((userId) => ({ userId })),
      ProjectionExpression: 'userId, appId, displayName, profileImageUrl',
    });

    const userMap = new Map(users.map((u) => [u.userId, u]));

    const items = blocksToReturn.map((block) => {
      const user = userMap.get(block.blockedId);
      return {
        userId: block.blockedId,
        appId: user?.appId || null,
        displayName: user?.displayName || 'Unknown User',
        profileImageUrl: user?.profileImageUrl || null,
        blockedAt: block.createdAt,
      };
    });

    // Create next cursor
    let nextCursor: string | null = null;
    if (hasMore) {
      const lastBlock = blocksToReturn[blocksToReturn.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          blockerId: lastBlock.blockerId,
          blockedId: lastBlock.blockedId,
        })
      ).toString('base64');
    }

    return success({
      items,
      nextCursor,
    });
  } catch (err) {
    console.error('Get blocks error:', err);
    return serverError('Failed to get blocked users');
  }
};
