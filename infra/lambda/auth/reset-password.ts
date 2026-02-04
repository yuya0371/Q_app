import { APIGatewayProxyHandler } from 'aws-lambda';
import { confirmForgotPassword } from '../common/cognito';
import { success, validationError, serverError } from '../common/response';

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: ResetPasswordRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.email || !body.code || !body.newPassword) {
      return validationError('email, code, and newPassword are required');
    }

    if (body.newPassword.length < 8) {
      return validationError('Password must be at least 8 characters');
    }

    await confirmForgotPassword(body.email, body.code, body.newPassword);

    return success({
      message: 'Password reset successfully',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);

    if (err.name === 'CodeMismatchException') {
      return validationError('Invalid reset code');
    }

    if (err.name === 'ExpiredCodeException') {
      return validationError('Reset code has expired');
    }

    if (err.name === 'InvalidPasswordException') {
      return validationError('Password does not meet requirements');
    }

    return serverError('Failed to reset password');
  }
};
