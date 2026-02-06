import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, queryItems, TABLES, todayJST } from '../common/dynamodb';
import { success, notFound, unauthorized, serverError } from '../common/response';

interface DailyQuestion {
  date: string;
  questionId: string;
  questionText?: string;
  scheduledPublishTime?: string;
  publishedAt?: string;
}

interface Question {
  questionId: string;
  text: string;
  category?: string;
  createdAt: string;
}

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const today = todayJST();

    // Get today's daily question
    const dailyQuestion = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
    });

    // DailyQuestionsレコードがない、またはpublishedAtがセットされていない場合は未公開状態
    if (!dailyQuestion || !dailyQuestion.publishedAt) {
      return success({
        date: today,
        isPublished: false,
        question: null,
        hasAnswered: false,
        userAnswer: null,
      });
    }

    // Get the question details
    const question = await getItem<Question>({
      TableName: TABLES.QUESTIONS,
      Key: { questionId: dailyQuestion.questionId },
    });

    if (!question) {
      return notFound('Question not found');
    }

    // Check if user has already answered
    const answers = await queryItems<Answer>({
      TableName: TABLES.ANSWERS,
      IndexName: 'userId-questionId-index',
      KeyConditionExpression: 'userId = :userId AND questionId = :questionId',
      ExpressionAttributeValues: {
        ':userId': authUser.userId,
        ':questionId': question.questionId,
      },
    });

    const hasAnswered = answers.length > 0;

    return success({
      date: today,
      isPublished: true,
      publishedAt: dailyQuestion.publishedAt,
      question: {
        questionId: question.questionId,
        text: question.text,
        category: question.category || null,
      },
      hasAnswered,
      userAnswer: hasAnswered ? answers[0] : null,
    });
  } catch (err) {
    console.error('Get daily question error:', err);
    return serverError('Failed to get daily question');
  }
};
