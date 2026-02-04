import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, unauthorized, serverError } from '../common/response';

interface RegisterTokenRequest {
  token: string;
  platform: 'ios' | 'android';
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const body: RegisterTokenRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.token || !body.platform) {
      return validationError('token and platform are required');
    }

    if (!['ios', 'android'].includes(body.platform)) {
      return validationError('platform must be "ios" or "android"');
    }

    // Register/update push token
    const timestamp = now();

    await putItem({
      TableName: TABLES.PUSH_TOKENS,
      Item: {
        userId: authUser.userId,
        token: body.token,
        platform: body.platform,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    return success({
      message: 'Push token registered successfully',
    });
  } catch (err) {
    console.error('Register push token error:', err);
    return serverError('Failed to register push token');
  }
};
