import { APIGatewayProxyHandler } from 'aws-lambda';
import { scanItems, batchGetItems, TABLES } from '../common/dynamodb';
import { success, serverError } from '../common/response';

interface Report {
  reportId: string;
  reporterId: string;
  targetType: 'user' | 'answer';
  targetId: string;
  targetUserId: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
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

    // Get reports
    const allReports = await scanItems<Report>({
      TableName: TABLES.REPORTS,
    });

    // Filter by status
    const filteredReports = allReports
      .filter((r) => status === 'all' || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    if (filteredReports.length === 0) {
      return success({ items: [] });
    }

    // Get user details for reporters and targets
    const userIds = [
      ...new Set([
        ...filteredReports.map((r) => r.reporterId),
        ...filteredReports.map((r) => r.targetUserId),
      ]),
    ];

    const users = await batchGetItems<User>({
      RequestItems: {
        [TABLES.USERS]: {
          Keys: userIds.map((id) => ({ userId: id })),
          ProjectionExpression: 'userId, username, displayName',
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.userId, u]));

    const result = filteredReports.map((r) => {
      const reporter = userMap.get(r.reporterId);
      const target = userMap.get(r.targetUserId);

      return {
        reportId: r.reportId,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt,
        reporter: reporter
          ? {
              userId: reporter.userId,
              username: reporter.username,
              displayName: reporter.displayName,
            }
          : null,
        targetUser: target
          ? {
              userId: target.userId,
              username: target.username,
              displayName: target.displayName,
            }
          : null,
      };
    });

    return success({ items: result });
  } catch (err) {
    console.error('List reports error:', err);
    return serverError('Failed to list reports');
  }
};
