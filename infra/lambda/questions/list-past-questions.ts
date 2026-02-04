import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { queryItems, batchGetItems, TABLES, todayJST } from '../common/dynamodb';
import { success, unauthorized, serverError } from '../common/response';

interface DailyQuestion {
  date: string;
  questionId: string;
}

interface Question {
  questionId: string;
  text: string;
  category?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '30'), 100);
    const beforeDate = event.queryStringParameters?.before || todayJST();

    // Get past daily questions (before today)
    const dailyQuestions = await queryItems<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      KeyConditionExpression: '#date < :beforeDate',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':beforeDate': beforeDate },
      ScanIndexForward: false, // Descending order
      Limit: limit,
    });

    if (dailyQuestions.length === 0) {
      return success({ questions: [], hasMore: false });
    }

    // Get question details
    const questionIds = [...new Set(dailyQuestions.map((dq) => dq.questionId))];
    const questions = await batchGetItems<Question>({
      RequestItems: {
        [TABLES.QUESTIONS]: {
          Keys: questionIds.map((id) => ({ questionId: id })),
        },
      },
    });

    // Create a map for quick lookup
    const questionMap = new Map(questions.map((q) => [q.questionId, q]));

    // Build response
    const result = dailyQuestions.map((dq) => {
      const question = questionMap.get(dq.questionId);
      return {
        date: dq.date,
        questionId: dq.questionId,
        text: question?.text || '',
        category: question?.category || null,
      };
    });

    return success({
      questions: result,
      hasMore: dailyQuestions.length === limit,
      nextBefore: dailyQuestions.length > 0 ? dailyQuestions[dailyQuestions.length - 1].date : null,
    });
  } catch (err) {
    console.error('List past questions error:', err);
    return serverError('Failed to list past questions');
  }
};
