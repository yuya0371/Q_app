import { ScheduledHandler } from 'aws-lambda';
import { getItem, scanItems, putItem, queryItems, TABLES, now, todayJST } from '../common/dynamodb';

interface Question {
  questionId: string;
  text: string;
  usedAt?: string;
}

interface DailyQuestion {
  date: string;
  questionId: string;
}

/**
 * This Lambda is triggered daily to publish the question of the day.
 * If no question is set for today, it picks a random unused question.
 */
export const handler: ScheduledHandler = async () => {
  try {
    const today = todayJST();
    console.log(`Publishing daily question for ${today}`);

    // Check if today's question is already set
    const existingDaily = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
    });

    if (existingDaily) {
      console.log(`Question already set for ${today}: ${existingDaily.questionId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Question already set', questionId: existingDaily.questionId }),
      };
    }

    // Get all questions
    const allQuestions = await scanItems<Question>({
      TableName: TABLES.QUESTIONS,
    });

    if (allQuestions.length === 0) {
      console.error('No questions available in the database');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No questions available' }),
      };
    }

    // Filter out recently used questions (used in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const unusedQuestions = allQuestions.filter((q) => {
      if (!q.usedAt) return true;
      return q.usedAt < thirtyDaysAgoStr;
    });

    // If all questions have been used recently, use any question
    const availableQuestions = unusedQuestions.length > 0 ? unusedQuestions : allQuestions;

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    console.log(`Selected question: ${selectedQuestion.questionId} - "${selectedQuestion.text}"`);

    // Set today's question
    const timestamp = now();

    await putItem({
      TableName: TABLES.DAILY_QUESTIONS,
      Item: {
        date: today,
        questionId: selectedQuestion.questionId,
        createdAt: timestamp,
      },
    });

    console.log(`Daily question published successfully for ${today}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily question published',
        date: today,
        questionId: selectedQuestion.questionId,
      }),
    };
  } catch (err) {
    console.error('Error publishing daily question:', err);
    throw err;
  }
};
