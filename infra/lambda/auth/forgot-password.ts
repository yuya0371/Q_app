import { APIGatewayProxyHandler } from 'aws-lambda';
import { forgotPassword } from '../common/cognito';
import { success, validationError, serverError } from '../common/response';

interface ForgotPasswordRequest {
  email: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: ForgotPasswordRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.email) {
      return validationError('email is required');
    }

    await forgotPassword(body.email);

    return success({
      message: 'Password reset code sent to email',
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);

    if (err.name === 'UserNotFoundException') {
      // Don't reveal that the user doesn't exist
      return success({
        message: 'Password reset code sent to email',
      });
    }

    if (err.name === 'LimitExceededException') {
      return validationError('Too many requests, please try again later');
    }

    return serverError('Failed to send reset code');
  }
};
