import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, putItem, queryItems, TABLES, now, todayJST } from '../common/dynamodb';
import { success, validationError, conflict, unauthorized, forbidden, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface CreateAnswerRequest {
  questionId: string;
  text: string;
}

interface DailyQuestion {
  date: string;
  questionId: string;
}

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
}

const MAX_ANSWER_LENGTH = 500;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const body: CreateAnswerRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.questionId || !body.text) {
      return validationError('questionId and text are required');
    }

    if (body.text.length > MAX_ANSWER_LENGTH) {
      return validationError(`Answer must be ${MAX_ANSWER_LENGTH} characters or less`);
    }

    const today = todayJST();

    // Check if this is today's question
    const dailyQuestion = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
    });

    if (!dailyQuestion || dailyQuestion.questionId !== body.questionId) {
      return forbidden('You can only answer today\'s question');
    }

    // Check if user already answered this question
    const existingAnswers = await queryItems<Answer>({
      TableName: TABLES.ANSWERS,
      IndexName: 'userId-questionId-index',
      KeyConditionExpression: 'userId = :userId AND questionId = :questionId',
      ExpressionAttributeValues: {
        ':userId': authUser.userId,
        ':questionId': body.questionId,
      },
    });

    if (existingAnswers.length > 0) {
      return conflict('You have already answered this question');
    }

    // Create answer
    const answerId = uuidv4();
    const timestamp = now();

    await putItem({
      TableName: TABLES.ANSWERS,
      Item: {
        answerId,
        userId: authUser.userId,
        questionId: body.questionId,
        text: body.text,
        date: today,
        reactionCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    return success({
      message: 'Answer created successfully',
      answer: {
        answerId,
        questionId: body.questionId,
        text: body.text,
        date: today,
        createdAt: timestamp,
      },
    });
  } catch (err) {
    console.error('Create answer error:', err);
    return serverError('Failed to create answer');
  }
};
