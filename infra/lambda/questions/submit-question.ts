import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, unauthorized, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface SubmitQuestionRequest {
  text: string;
  category?: string;
}

const MAX_QUESTION_LENGTH = 200;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const body: SubmitQuestionRequest = JSON.parse(event.body || '{}');

    if (!body.text || body.text.trim().length === 0) {
      return validationError('text is required');
    }

    if (body.text.length > MAX_QUESTION_LENGTH) {
      return validationError(`Question must be ${MAX_QUESTION_LENGTH} characters or less`);
    }

    const submissionId = uuidv4();
    const timestamp = now();

    await putItem({
      TableName: TABLES.USER_QUESTION_SUBMISSIONS,
      Item: {
        submissionId,
        userId: authUser.userId,
        text: body.text.trim(),
        category: body.category || null,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    return success({
      message: 'Question submitted successfully',
      submissionId,
    });
  } catch (err) {
    console.error('Submit question error:', err);
    return serverError('Failed to submit question');
  }
};
