import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, notFound, conflict, unauthorized, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface CreateReportRequest {
  targetType: 'user' | 'answer';
  targetId: string;
  reason: string;
  details?: string;
}

interface User {
  userId: string;
}

interface Answer {
  answerId: string;
  userId: string;
}

const VALID_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'inappropriate_content',
  'impersonation',
  'personal_info', // 個人情報の公開
  'other',
];

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const body: CreateReportRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.targetType || !body.targetId || !body.reason) {
      return validationError('targetType, targetId, and reason are required');
    }

    if (!['user', 'answer'].includes(body.targetType)) {
      return validationError('targetType must be "user" or "answer"');
    }

    if (!VALID_REASONS.includes(body.reason)) {
      return validationError(`reason must be one of: ${VALID_REASONS.join(', ')}`);
    }

    if (body.details && body.details.length > 1000) {
      return validationError('details must be 1000 characters or less');
    }

    let targetUserId: string;

    // Validate target exists and get owner
    if (body.targetType === 'user') {
      // Can't report yourself
      if (body.targetId === authUser.userId) {
        return validationError('Cannot report yourself');
      }

      const user = await getItem<User>({
        TableName: TABLES.USERS,
        Key: { userId: body.targetId },
      });

      if (!user) {
        return notFound('User not found');
      }

      targetUserId = body.targetId;
    } else {
      const answer = await getItem<Answer>({
        TableName: TABLES.ANSWERS,
        Key: { answerId: body.targetId },
      });

      if (!answer) {
        return notFound('Answer not found');
      }

      // Can't report own answer
      if (answer.userId === authUser.userId) {
        return validationError('Cannot report your own answer');
      }

      targetUserId = answer.userId;
    }

    // Create report
    const reportId = uuidv4();
    const timestamp = now();

    await putItem({
      TableName: TABLES.REPORTS,
      Item: {
        reportId,
        reporterId: authUser.userId,
        targetType: body.targetType,
        targetId: body.targetId,
        targetUserId,
        reason: body.reason,
        details: body.details || '',
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    return success({
      message: 'Report submitted successfully',
      reportId,
    });
  } catch (err) {
    console.error('Create report error:', err);
    return serverError('Failed to submit report');
  }
};
