import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { login } from '../common/cognito';
import { success, validationError, unauthorized, serverError } from '../common/response';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const USERS_TABLE = process.env.USERS_TABLE!;

interface LoginRequest {
  email: string;
  password: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: LoginRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.email || !body.password) {
      return validationError('email and password are required');
    }

    // Authenticate with Cognito
    const authResult = await login(body.email, body.password);

    // Get user from DynamoDB
    const userResult = await docClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': body.email,
        },
        Limit: 1,
      })
    );

    const user = userResult.Items?.[0];

    return success({
      user: user ? {
        userId: user.userId,
        email: user.email,
        appId: user.appId,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
      } : null,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      idToken: authResult.idToken,
      expiresIn: authResult.expiresIn,
    });
  } catch (err: any) {
    console.error('Login error:', err);

    if (err.name === 'NotAuthorizedException') {
      return unauthorized('Invalid email or password');
    }

    if (err.name === 'UserNotConfirmedException') {
      return validationError('Email not confirmed');
    }

    if (err.name === 'UserNotFoundException') {
      return unauthorized('Invalid email or password');
    }

    return serverError('Failed to login');
  }
};
