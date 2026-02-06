import { APIGatewayProxyHandler } from 'aws-lambda';
import { putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, serverError } from '../common/response';
import { logAdminAction, extractAdminInfo, extractIpAddress } from '../utils/adminLog';

interface AddNgWordRequest {
  word: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: AddNgWordRequest = JSON.parse(event.body || '{}');
    const adminInfo = extractAdminInfo(event);
    const ipAddress = extractIpAddress(event);

    if (!body.word || body.word.trim().length === 0) {
      return validationError('word is required');
    }

    const timestamp = now();
    const word = body.word.trim().toLowerCase();

    await putItem({
      TableName: TABLES.NG_WORDS,
      Item: {
        word, // wordがパーティションキー
        createdAt: timestamp,
      },
    });

    // 監査ログを記録
    await logAdminAction({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      action: 'ADD_NG_WORD',
      targetType: 'ngWord',
      targetId: word,
      details: { word },
      ipAddress,
    });

    return success({
      message: 'NG word added successfully',
      word,
    });
  } catch (err) {
    console.error('Add NG word error:', err);
    return serverError('Failed to add NG word');
  }
};
