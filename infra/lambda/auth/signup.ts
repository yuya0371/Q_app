import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { signUp } from '../common/cognito';
import { success, validationError, serverError } from '../common/response';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const USERS_TABLE = process.env.USERS_TABLE!;

interface SignUpRequest {
  email: string;
  password: string;
  birthDate: string; // YYYY-MM-DD
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: SignUpRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.email || !body.password || !body.birthDate) {
      return validationError('email, password, birthDate are required');
    }

    if (body.password.length < 8) {
      return validationError('Password must be at least 8 characters');
    }

    // Validate birth date format
    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthDateRegex.test(body.birthDate)) {
      return validationError('birthDate must be in YYYY-MM-DD format');
    }

    // Sign up with Cognito
    const userId = await signUp({
      email: body.email,
      password: body.password,
      birthDate: body.birthDate,
    });

    // Create user record in DynamoDB
    const now = new Date().toISOString();
    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          userId,
          email: body.email,
          birthDate: body.birthDate,
          visibilitySetting: 'mutual', // Default: mutual followers only
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    return success({
      userId,
      message: 'Confirmation code sent to email',
    }, 201);
  } catch (err: any) {
    console.error('Signup error:', err);

    if (err.name === 'UsernameExistsException') {
      return validationError('Email already registered');
    }

    if (err.name === 'InvalidPasswordException') {
      return validationError('Password does not meet requirements');
    }

    return serverError('Failed to sign up');
  }
};
