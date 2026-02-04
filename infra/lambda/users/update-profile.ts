import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, updateItem, queryItems, TABLES, now } from '../common/dynamodb';
import { success, validationError, unauthorized, conflict, serverError } from '../common/response';

interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  bio?: string;
  isPrivate?: boolean;
}

interface User {
  userId: string;
  username: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const body: UpdateProfileRequest = JSON.parse(event.body || '{}');

    // Validate username if provided
    if (body.username !== undefined) {
      if (!USERNAME_REGEX.test(body.username)) {
        return validationError(
          'Username must be 3-20 characters and contain only letters, numbers, and underscores'
        );
      }

      // Check if username is already taken
      const existingUsers = await queryItems<User>({
        TableName: TABLES.USERS,
        IndexName: 'username-index',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: { ':username': body.username },
      });

      const takenByOther = existingUsers.some((u) => u.userId !== authUser.userId);
      if (takenByOther) {
        return conflict('Username is already taken');
      }
    }

    // Validate displayName if provided
    if (body.displayName !== undefined) {
      if (body.displayName.length < 1 || body.displayName.length > 50) {
        return validationError('Display name must be 1-50 characters');
      }
    }

    // Validate bio if provided
    if (body.bio !== undefined) {
      if (body.bio.length > 200) {
        return validationError('Bio must be 200 characters or less');
      }
    }

    // Build update expression
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ':updatedAt': now(),
    };

    if (body.username !== undefined) {
      updateExpressions.push('#username = :username');
      expressionAttributeNames['#username'] = 'username';
      expressionAttributeValues[':username'] = body.username;
    }

    if (body.displayName !== undefined) {
      updateExpressions.push('#displayName = :displayName');
      expressionAttributeNames['#displayName'] = 'displayName';
      expressionAttributeValues[':displayName'] = body.displayName;
    }

    if (body.bio !== undefined) {
      updateExpressions.push('#bio = :bio');
      expressionAttributeNames['#bio'] = 'bio';
      expressionAttributeValues[':bio'] = body.bio;
    }

    if (body.isPrivate !== undefined) {
      updateExpressions.push('#isPrivate = :isPrivate');
      expressionAttributeNames['#isPrivate'] = 'isPrivate';
      expressionAttributeValues[':isPrivate'] = body.isPrivate;
    }

    await updateItem({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
      UpdateExpression: 'SET ' + updateExpressions.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    // Get updated user
    const updatedUser = await getItem<Record<string, unknown>>({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
    });

    return success({
      message: 'Profile updated successfully',
      user: {
        userId: updatedUser?.userId,
        username: updatedUser?.username,
        displayName: updatedUser?.displayName,
        bio: updatedUser?.bio || '',
        isPrivate: updatedUser?.isPrivate,
        profileImageUrl: updatedUser?.profileImageUrl || null,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return serverError('Failed to update profile');
  }
};
