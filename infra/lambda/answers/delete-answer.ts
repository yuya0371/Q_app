import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, deleteItem, TABLES } from '../common/dynamodb';
import { success, notFound, unauthorized, forbidden, serverError } from '../common/response';

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const answerId = event.pathParameters?.answerId;
    if (!answerId) {
      return notFound('Answer not found');
    }

    // Get the answer
    const answer = await getItem<Answer>({
      TableName: TABLES.ANSWERS,
      Key: { answerId },
    });

    if (!answer) {
      return notFound('Answer not found');
    }

    // Check ownership
    if (answer.userId !== authUser.userId) {
      return forbidden('You can only delete your own answers');
    }

    // Delete the answer
    await deleteItem({
      TableName: TABLES.ANSWERS,
      Key: { answerId },
    });

    return success({
      message: 'Answer deleted successfully',
    });
  } catch (err) {
    console.error('Delete answer error:', err);
    return serverError('Failed to delete answer');
  }
};
