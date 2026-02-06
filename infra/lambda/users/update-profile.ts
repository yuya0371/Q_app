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
// 絵文字検出用正規表現（Unicode絵文字範囲）
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u;

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
      if (body.displayName.length < 1 || body.displayName.length > 20) {
        return validationError('表示名は1〜20文字で入力してください');
      }
      if (EMOJI_REGEX.test(body.displayName)) {
        return validationError('表示名に絵文字は使用できません');
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
