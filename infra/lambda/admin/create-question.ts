import { APIGatewayProxyHandler } from 'aws-lambda';
import { putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface CreateQuestionRequest {
  text: string;
  category?: string;
}

const MAX_QUESTION_LENGTH = 200;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: CreateQuestionRequest = JSON.parse(event.body || '{}');

    if (!body.text || body.text.trim().length === 0) {
      return validationError('text is required');
    }

    if (body.text.length > MAX_QUESTION_LENGTH) {
      return validationError(`Question must be ${MAX_QUESTION_LENGTH} characters or less`);
    }

    const questionId = uuidv4();
    const timestamp = now();

    await putItem({
      TableName: TABLES.QUESTIONS,
      Item: {
        questionId,
        text: body.text.trim(),
        category: body.category || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    return success({
      message: 'Question created successfully',
      question: {
        questionId,
        text: body.text.trim(),
        category: body.category || null,
      },
    });
  } catch (err) {
    console.error('Create question error:', err);
    return serverError('Failed to create question');
  }
};
