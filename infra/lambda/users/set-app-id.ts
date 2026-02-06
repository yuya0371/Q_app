import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, updateItem, queryItems, TABLES, now } from '../common/dynamodb';
import { success, validationError, unauthorized, conflict, serverError } from '../common/response';

interface SetAppIdRequest {
  appId: string;
}

interface User {
  userId: string;
  appId?: string;
}

// 仕様: 3〜15文字、先頭は英字、英小文字+数字+_のみ
const APP_ID_REGEX = /^[a-z][a-z0-9_]{2,14}$/;
const RESERVED_WORDS = ['admin', 'support', 'system', 'root', 'administrator'];

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const body: SetAppIdRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.appId) {
      return validationError('アプリ内IDを入力してください');
    }

    const appIdLower = body.appId.toLowerCase();

    if (!APP_ID_REGEX.test(appIdLower)) {
      return validationError(
        'アプリ内IDは3〜15文字、先頭は英字、英小文字・数字・アンダースコアのみ使用可能です'
      );
    }

    // 予約語チェック
    if (RESERVED_WORDS.includes(appIdLower)) {
      return validationError('このIDは使用できません');
    }

    // Check if user already has an appId
    const currentUser = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
    });

    if (currentUser?.appId) {
      return conflict('App ID is already set and cannot be changed');
    }

    // Check if appId is already taken
    const existingUsers = await queryItems<User>({
      TableName: TABLES.USERS,
      IndexName: 'GSI1_AppId',
      KeyConditionExpression: 'appId = :appId',
      ExpressionAttributeValues: { ':appId': appIdLower },
    });

    if (existingUsers.length > 0) {
      return conflict('このIDは既に使用されています');
    }

    // Update user with appId (小文字で保存)
    await updateItem({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
      UpdateExpression: 'SET #appId = :appId, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#appId': 'appId',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':appId': appIdLower,
        ':updatedAt': now(),
      },
    });

    return success({
      appId: appIdLower,
    });
  } catch (err) {
    console.error('Set app ID error:', err);
    return serverError('Failed to set app ID');
  }
};
