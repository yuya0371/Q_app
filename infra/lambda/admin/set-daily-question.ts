import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, putItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, notFound, serverError } from '../common/response';

interface SetDailyQuestionRequest {
  date: string;
  questionId: string;
}

interface Question {
  questionId: string;
  text: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: SetDailyQuestionRequest = JSON.parse(event.body || '{}');

    if (!body.date || !body.questionId) {
      return validationError('date and questionId are required');
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return validationError('date must be in YYYY-MM-DD format');
    }

    // Check if question exists
    const question = await getItem<Question>({
      TableName: TABLES.QUESTIONS,
      Key: { questionId: body.questionId },
    });

    if (!question) {
      return notFound('Question not found');
    }

    // Set daily question
    const timestamp = now();

    await putItem({
      TableName: TABLES.DAILY_QUESTIONS,
      Item: {
        date: body.date,
        questionId: body.questionId,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    return success({
      message: 'Daily question set successfully',
      date: body.date,
      question: {
        questionId: question.questionId,
        text: question.text,
      },
    });
  } catch (err) {
    console.error('Set daily question error:', err);
    return serverError('Failed to set daily question');
  }
};
