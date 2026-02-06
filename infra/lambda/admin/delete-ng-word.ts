import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, deleteItem, TABLES } from '../common/dynamodb';
import { success, notFound, validationError, serverError } from '../common/response';
import { logAdminAction, extractAdminInfo, extractIpAddress } from '../utils/adminLog';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // wordIdは実際にはword（NGワード自体）- URLデコードする
    const rawWord = event.pathParameters?.wordId;
    if (!rawWord) {
      return validationError('word is required');
    }

    const word = decodeURIComponent(rawWord);
    console.log('Deleting NG word:', { rawWord, word });

    const adminInfo = extractAdminInfo(event);
    const ipAddress = extractIpAddress(event);

    // Check if exists
    const existing = await getItem({
      TableName: TABLES.NG_WORDS,
      Key: { word },
    });

    console.log('Existing check result:', existing);

    if (!existing) {
      return notFound('NG word not found');
    }

    await deleteItem({
      TableName: TABLES.NG_WORDS,
      Key: { word },
    });

    // 監査ログを記録
    await logAdminAction({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      action: 'DELETE_NG_WORD',
      targetType: 'ngWord',
      targetId: word,
      details: { word },
      ipAddress,
    });

    return success({
      message: 'NG word deleted successfully',
    });
  } catch (err) {
    console.error('Delete NG word error:', err);
    return serverError('Failed to delete NG word');
  }
};
