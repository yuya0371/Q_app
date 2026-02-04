import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, deleteItem, TABLES } from '../common/dynamodb';
import { success, notFound, validationError, serverError } from '../common/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const wordId = event.pathParameters?.wordId;
    if (!wordId) {
      return validationError('wordId is required');
    }

    // Check if exists
    const existing = await getItem({
      TableName: TABLES.NG_WORDS,
      Key: { wordId },
    });

    if (!existing) {
      return notFound('NG word not found');
    }

    await deleteItem({
      TableName: TABLES.NG_WORDS,
      Key: { wordId },
    });

    return success({
      message: 'NG word deleted successfully',
    });
  } catch (err) {
    console.error('Delete NG word error:', err);
    return serverError('Failed to delete NG word');
  }
};
