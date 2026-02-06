import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, updateItem, TABLES, now } from '../common/dynamodb';
import { success, notFound, unauthorized, forbidden, conflict, serverError } from '../common/response';

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
  isDeleted?: boolean;
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
      return notFound('回答が見つかりません');
    }

    // Check ownership
    if (answer.userId !== authUser.userId) {
      return forbidden('自分の回答のみ削除できます');
    }

    // Check if already deleted
    if (answer.isDeleted) {
      return conflict('この回答は既に削除されています');
    }

    // 論理削除（isDeleted = true）
    const timestamp = now();
    await updateItem({
      TableName: TABLES.ANSWERS,
      Key: { answerId },
      UpdateExpression: 'SET isDeleted = :isDeleted, deletedAt = :deletedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':deletedAt': timestamp,
        ':updatedAt': timestamp,
      },
    });

    return success({
      message: '回答を削除しました',
    });
  } catch (err) {
    console.error('Delete answer error:', err);
    return serverError('Failed to delete answer');
  }
};
