import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, updateItem, TABLES, now } from '../common/dynamodb';
import { success, notFound, unauthorized, forbidden, conflict, serverError } from '../common/response';

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
  text: string;
  date: string;
  isOnTime: boolean;
  lateMinutes: number;
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
      return forbidden('自分の回答のみ復活できます');
    }

    // Check if deleted
    if (!answer.isDeleted) {
      return conflict('この回答は削除されていません');
    }

    // 復活（isDeleted = false）
    const timestamp = now();
    await updateItem({
      TableName: TABLES.ANSWERS,
      Key: { answerId },
      UpdateExpression: 'SET isDeleted = :isDeleted, updatedAt = :updatedAt REMOVE deletedAt',
      ExpressionAttributeValues: {
        ':isDeleted': false,
        ':updatedAt': timestamp,
      },
    });

    return success({
      message: '回答を復活しました',
      answer: {
        answerId: answer.answerId,
        text: answer.text,
        date: answer.date,
        isOnTime: answer.isOnTime,
        lateMinutes: answer.lateMinutes,
      },
    });
  } catch (err) {
    console.error('Restore answer error:', err);
    return serverError('Failed to restore answer');
  }
};
