import { APIGatewayProxyHandler } from 'aws-lambda';
import { putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface AddNgWordRequest {
  word: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: AddNgWordRequest = JSON.parse(event.body || '{}');

    if (!body.word || body.word.trim().length === 0) {
      return validationError('word is required');
    }

    const wordId = uuidv4();
    const timestamp = now();

    await putItem({
      TableName: TABLES.NG_WORDS,
      Item: {
        wordId,
        word: body.word.trim().toLowerCase(),
        createdAt: timestamp,
      },
    });

    return success({
      message: 'NG word added successfully',
      wordId,
    });
  } catch (err) {
    console.error('Add NG word error:', err);
    return serverError('Failed to add NG word');
  }
};
