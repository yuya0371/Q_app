import { APIGatewayProxyHandler } from 'aws-lambda';
import { scanItems, TABLES } from '../common/dynamodb';
import { success, serverError } from '../common/response';

interface Question {
  questionId: string;
  text: string;
  category?: string;
  createdAt: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '100'), 500);

    const questions = await scanItems<Question>({
      TableName: TABLES.QUESTIONS,
    });

    const sorted = questions
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    return success({
      questions: sorted.map((q) => ({
        questionId: q.questionId,
        text: q.text,
        category: q.category || null,
        createdAt: q.createdAt,
      })),
    });
  } catch (err) {
    console.error('List questions error:', err);
    return serverError('Failed to list questions');
  }
};
