import { APIGatewayProxyHandler } from 'aws-lambda';
import { confirmSignUp } from '../common/cognito';
import { success, validationError, serverError } from '../common/response';

interface ConfirmRequest {
  email: string;
  code: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: ConfirmRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.email || !body.code) {
      return validationError('email and code are required');
    }

    await confirmSignUp(body.email, body.code);

    return success({
      message: 'Email confirmed successfully',
    });
  } catch (err: any) {
    console.error('Confirm error:', err);

    if (err.name === 'CodeMismatchException') {
      return validationError('Invalid confirmation code');
    }

    if (err.name === 'ExpiredCodeException') {
      return validationError('Confirmation code has expired');
    }

    if (err.name === 'UserNotFoundException') {
      return validationError('User not found');
    }

    return serverError('Failed to confirm email');
  }
};
