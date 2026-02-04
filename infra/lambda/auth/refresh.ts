import { APIGatewayProxyHandler } from 'aws-lambda';
import { refreshTokens } from '../common/cognito';
import { success, validationError, unauthorized, serverError } from '../common/response';

interface RefreshRequest {
  refreshToken: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: RefreshRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.refreshToken) {
      return validationError('refreshToken is required');
    }

    const authResult = await refreshTokens(body.refreshToken);

    return success({
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      idToken: authResult.idToken,
      expiresIn: authResult.expiresIn,
    });
  } catch (err: any) {
    console.error('Refresh error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('Invalid or expired refresh token');
    }

    return serverError('Failed to refresh tokens');
  }
};
