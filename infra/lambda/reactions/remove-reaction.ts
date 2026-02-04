import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { deleteItem, updateItem, queryItems, TABLES } from '../common/dynamodb';
import { success, validationError, notFound, unauthorized, serverError } from '../common/response';

interface Reaction {
  reactionId: string;
  userId: string;
  answerId: string;
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

    // Find user's reaction to this answer
    const reactions = await queryItems<Reaction>({
      TableName: TABLES.REACTIONS,
      IndexName: 'userId-answerId-index',
      KeyConditionExpression: 'userId = :userId AND answerId = :answerId',
      ExpressionAttributeValues: {
        ':userId': authUser.userId,
        ':answerId': answerId,
      },
    });

    if (reactions.length === 0) {
      return notFound('Reaction not found');
    }

    const reaction = reactions[0];

    // Delete the reaction
    await deleteItem({
      TableName: TABLES.REACTIONS,
      Key: { reactionId: reaction.reactionId },
    });

    // Decrement reaction count on answer
    await updateItem({
      TableName: TABLES.ANSWERS,
      Key: { answerId },
      UpdateExpression: 'SET reactionCount = reactionCount - :one',
      ConditionExpression: 'reactionCount > :zero',
      ExpressionAttributeValues: {
        ':one': 1,
        ':zero': 0,
      },
    });

    return success({
      message: 'Reaction removed successfully',
    });
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Reaction count was already 0, just ignore
      return success({
        message: 'Reaction removed successfully',
      });
    }
    console.error('Remove reaction error:', err);
    return serverError('Failed to remove reaction');
  }
};
