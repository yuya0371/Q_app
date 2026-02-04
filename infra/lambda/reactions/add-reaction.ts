import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, putItem, updateItem, queryItems, TABLES, now } from '../common/dynamodb';
import { success, validationError, notFound, conflict, unauthorized, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface Answer {
  answerId: string;
  userId: string;
  reactionCount: number;
}

interface Reaction {
  reactionId: string;
  userId: string;
  answerId: string;
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

    const answerId = event.pathParameters?.answerId;
    if (!answerId) {
      return validationError('answerId is required');
    }

    // Get the answer
    const answer = await getItem<Answer>({
      TableName: TABLES.ANSWERS,
      Key: { answerId },
    });

    if (!answer) {
      return notFound('Answer not found');
    }

    // Can't react to own answer
    if (answer.userId === authUser.userId) {
      return validationError('Cannot react to your own answer');
    }

    // Check if blocked
    const blocked = await getItem<Block>({
      TableName: TABLES.BLOCKS,
      Key: { blockerId: answer.userId, blockedId: authUser.userId },
    });

    if (blocked) {
      return notFound('Answer not found');
    }

    // Check if already reacted
    const existingReactions = await queryItems<Reaction>({
      TableName: TABLES.REACTIONS,
      IndexName: 'userId-answerId-index',
      KeyConditionExpression: 'userId = :userId AND answerId = :answerId',
      ExpressionAttributeValues: {
        ':userId': authUser.userId,
        ':answerId': answerId,
      },
    });

    if (existingReactions.length > 0) {
      return conflict('You have already reacted to this answer');
    }

    // Create reaction
    const reactionId = uuidv4();
    const timestamp = now();

    await putItem({
      TableName: TABLES.REACTIONS,
      Item: {
        reactionId,
        userId: authUser.userId,
        answerId,
        answerUserId: answer.userId,
        createdAt: timestamp,
      },
    });

    // Increment reaction count on answer
    await updateItem({
      TableName: TABLES.ANSWERS,
      Key: { answerId },
      UpdateExpression: 'SET reactionCount = if_not_exists(reactionCount, :zero) + :one',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1,
      },
    });

    return success({
      message: 'Reaction added successfully',
      reactionId,
    });
  } catch (err) {
    console.error('Add reaction error:', err);
    return serverError('Failed to add reaction');
  }
};
