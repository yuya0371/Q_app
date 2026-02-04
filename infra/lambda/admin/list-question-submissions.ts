import { APIGatewayProxyHandler } from 'aws-lambda';
import { scanItems, batchGetItems, TABLES } from '../common/dynamodb';
import { success, serverError } from '../common/response';

interface QuestionSubmission {
  submissionId: string;
  userId: string;
  text: string;
  category?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface User {
  userId: string;
  username: string;
  displayName: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const status = event.queryStringParameters?.status || 'pending';
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '50'), 100);

    // Get submissions
    const allSubmissions = await scanItems<QuestionSubmission>({
      TableName: TABLES.USER_QUESTION_SUBMISSIONS,
    });

    // Filter by status
    const filteredSubmissions = allSubmissions
      .filter((s) => status === 'all' || s.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    if (filteredSubmissions.length === 0) {
      return success({ submissions: [] });
    }

    // Get user details
    const userIds = [...new Set(filteredSubmissions.map((s) => s.userId))];
    const users = await batchGetItems<User>({
      RequestItems: {
        [TABLES.USERS]: {
          Keys: userIds.map((id) => ({ userId: id })),
          ProjectionExpression: 'userId, username, displayName',
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.userId, u]));

    const result = filteredSubmissions.map((s) => {
      const user = userMap.get(s.userId);
      return {
        submissionId: s.submissionId,
        text: s.text,
        category: s.category || null,
        status: s.status,
        createdAt: s.createdAt,
        user: user
          ? {
              userId: user.userId,
              username: user.username,
              displayName: user.displayName,
            }
          : null,
      };
    });

    return success({ submissions: result });
  } catch (err) {
    console.error('List question submissions error:', err);
    return serverError('Failed to list question submissions');
  }
};
