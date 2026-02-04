import { APIGatewayProxyHandler } from 'aws-lambda';
import { resendConfirmationCode } from '../common/cognito';
import { success, validationError, serverError } from '../common/response';

interface ResendCodeRequest {
  email: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: ResendCodeRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.email) {
      return validationError('email is required');
    }

    await resendConfirmationCode(body.email);

    return success({
      message: 'Confirmation code resent',
    });
  } catch (err: any) {
    console.error('Resend code error:', err);

    if (err.name === 'UserNotFoundException') {
      return validationError('User not found');
    }

    if (err.name === 'LimitExceededException') {
      return validationError('Too many requests, please try again later');
    }

    return serverError('Failed to resend code');
  }
};
