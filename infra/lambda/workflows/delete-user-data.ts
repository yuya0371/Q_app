import { Handler } from 'aws-lambda';
import { queryItems, deleteItem, batchWriteItems, TABLES } from '../common/dynamodb';

interface DeleteUserDataEvent {
  userId: string;
}

interface DeleteUserDataResult {
  userId: string;
  deletedAnswers: number;
  deletedReactions: number;
  deletedFollows: number;
  deletedBlocks: number;
  deletedReports: number;
  deletedPushTokens: number;
}

export const handler: Handler<DeleteUserDataEvent, DeleteUserDataResult> = async (event) => {
  const { userId } = event;
  console.log(`Deleting user data for: ${userId}`);

  let deletedAnswers = 0;
  let deletedReactions = 0;
  let deletedFollows = 0;
  let deletedBlocks = 0;
  let deletedReports = 0;
  let deletedPushTokens = 0;

  // Delete answers
  const answers = await queryItems<{ answerId: string }>({
    TableName: TABLES.ANSWERS,
    IndexName: 'userId-date-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ProjectionExpression: 'answerId',
  });

  for (const answer of answers) {
    await deleteItem({
      TableName: TABLES.ANSWERS,
      Key: { answerId: answer.answerId },
    });
    deletedAnswers++;
  }

  // Delete reactions made by user
  const reactions = await queryItems<{ reactionId: string }>({
    TableName: TABLES.REACTIONS,
    IndexName: 'userId-answerId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ProjectionExpression: 'reactionId',
  });

  for (const reaction of reactions) {
    await deleteItem({
      TableName: TABLES.REACTIONS,
      Key: { reactionId: reaction.reactionId },
    });
    deletedReactions++;
  }

  // Delete follows (both directions)
  const following = await queryItems<{ followerId: string; followeeId: string }>({
    TableName: TABLES.FOLLOWS,
    KeyConditionExpression: 'followerId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  });

  for (const follow of following) {
    await deleteItem({
      TableName: TABLES.FOLLOWS,
      Key: { followerId: follow.followerId, followeeId: follow.followeeId },
    });
    deletedFollows++;
  }

  const followers = await queryItems<{ followerId: string; followeeId: string }>({
    TableName: TABLES.FOLLOWS,
    IndexName: 'GSI1_Followers',
    KeyConditionExpression: 'followeeId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  });

  for (const follow of followers) {
    await deleteItem({
      TableName: TABLES.FOLLOWS,
      Key: { followerId: follow.followerId, followeeId: follow.followeeId },
    });
    deletedFollows++;
  }

  // Delete blocks (both directions)
  const blockedByMe = await queryItems<{ blockerId: string; blockedId: string }>({
    TableName: TABLES.BLOCKS,
    KeyConditionExpression: 'blockerId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  });

  for (const block of blockedByMe) {
    await deleteItem({
      TableName: TABLES.BLOCKS,
      Key: { blockerId: block.blockerId, blockedId: block.blockedId },
    });
    deletedBlocks++;
  }

  const blockedMe = await queryItems<{ blockerId: string; blockedId: string }>({
    TableName: TABLES.BLOCKS,
    IndexName: 'blockedId-index',
    KeyConditionExpression: 'blockedId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  });

  for (const block of blockedMe) {
    await deleteItem({
      TableName: TABLES.BLOCKS,
      Key: { blockerId: block.blockerId, blockedId: block.blockedId },
    });
    deletedBlocks++;
  }

  // Delete push tokens
  const pushToken = await queryItems<{ userId: string }>({
    TableName: TABLES.PUSH_TOKENS,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  });

  for (const token of pushToken) {
    await deleteItem({
      TableName: TABLES.PUSH_TOKENS,
      Key: { userId: token.userId },
    });
    deletedPushTokens++;
  }

  // Delete user record
  await deleteItem({
    TableName: TABLES.USERS,
    Key: { userId },
  });

  console.log(`User data deleted: answers=${deletedAnswers}, reactions=${deletedReactions}, follows=${deletedFollows}, blocks=${deletedBlocks}`);

  return {
    userId,
    deletedAnswers,
    deletedReactions,
    deletedFollows,
    deletedBlocks,
    deletedReports,
    deletedPushTokens,
  };
};
