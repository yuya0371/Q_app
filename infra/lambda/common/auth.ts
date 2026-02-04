import { APIGatewayProxyEvent } from 'aws-lambda';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
}

/**
 * Extract user information from Cognito authorizer claims
 */
export function getAuthenticatedUser(event: APIGatewayProxyEvent): AuthenticatedUser | null {
  const claims = event.requestContext.authorizer?.claims;

  if (!claims) {
    return null;
  }

  return {
    userId: claims.sub,
    email: claims.email,
    username: claims['cognito:username'] || claims.email,
  };
}

/**
 * Get user ID from path parameters or use authenticated user's ID
 */
export function getUserIdFromPath(event: APIGatewayProxyEvent): string | null {
  const pathUserId = event.pathParameters?.userId;

  if (pathUserId === 'me') {
    const user = getAuthenticatedUser(event);
    return user?.userId || null;
  }

  return pathUserId || null;
}
