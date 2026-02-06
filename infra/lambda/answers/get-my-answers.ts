import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { queryItems, batchGetItems, TABLES } from '../common/dynamodb';
import { success, unauthorized, serverError } from '../common/response';

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
  text: string;
  displayText?: string;
  date: string;
  isOnTime: boolean;
  lateMinutes: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

interface Question {
  questionId: string;
  text: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 50);
    const beforeDate = event.queryStringParameters?.cursor;

    // Get user's answers (include deleted ones for own profile)
    let answers: Answer[];

    if (beforeDate) {
      answers = await queryItems<Answer>({
        TableName: TABLES.ANSWERS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId AND #date < :beforeDate',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: {
          ':userId': authUser.userId,
          ':beforeDate': beforeDate,
        },
        ScanIndexForward: false,
        Limit: limit,
      });
    } else {
      answers = await queryItems<Answer>({
        TableName: TABLES.ANSWERS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': authUser.userId },
        ScanIndexForward: false,
        Limit: limit,
      });
    }

    if (answers.length === 0) {
      return success({ items: [], nextCursor: null });
    }

    // Get question details
    const questionIds = [...new Set(answers.map((a) => a.questionId))];
    const questions = await batchGetItems<Question>({
      RequestItems: {
        [TABLES.QUESTIONS]: {
          Keys: questionIds.map((id) => ({ questionId: id })),
        },
      },
    });
    const questionMap = new Map(questions.map((q) => [q.questionId, q]));

    // Build response
    const items = answers.map((a) => {
      const question = questionMap.get(a.questionId);
      return {
        answerId: a.answerId,
        date: a.date,
        questionText: question?.text || '',
        text: a.displayText || a.text, // マスク済みテキストを優先
        isOnTime: a.isOnTime ?? true,
        lateMinutes: a.lateMinutes ?? 0,
        isDeleted: a.isDeleted ?? false,
        deletedAt: a.deletedAt || null,
        createdAt: a.createdAt,
      };
    });

    return success({
      items,
      nextCursor: answers.length === limit ? answers[answers.length - 1].date : null,
    });
  } catch (err) {
    console.error('Get my answers error:', err);
    return serverError('Failed to get answers');
  }
};
