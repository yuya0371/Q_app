import { ScheduledHandler } from 'aws-lambda';
import { getItem, scanItems, putItem, TABLES, now, todayJST } from '../common/dynamodb';

interface Question {
  questionId: string;
  text: string;
  status?: string;
  lastUsedAt?: string;
}

interface DailyQuestion {
  date: string;
  questionId: string;
  scheduledPublishTime?: string;
}

/**
 * 毎日0:00 JSTに実行され、その日の質問と公開時刻を決定する。
 * 公開時刻は10:00〜21:00の間でランダムに決定される。
 * 実際の公開処理はcheck-and-publish Lambdaが担当する。
 */
export const handler: ScheduledHandler = async () => {
  try {
    const today = todayJST();
    console.log(`Scheduling daily question for ${today}`);

    // Check if today's question is already set
    const existingDaily = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
    });

    if (existingDaily) {
      console.log(`Question already set for ${today}: ${existingDaily.questionId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Question already set',
          questionId: existingDaily.questionId,
          scheduledPublishTime: existingDaily.scheduledPublishTime,
        }),
      };
    }

    // Get all approved questions
    const allQuestions = await scanItems<Question>({
      TableName: TABLES.QUESTIONS,
      FilterExpression: '#status = :approved OR #status = :admin',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':approved': 'approved',
        ':admin': 'admin',
      },
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
      if (!q.lastUsedAt) return true;
      return q.lastUsedAt < thirtyDaysAgoStr;
    });

    // If all questions have been used recently, use any question
    const availableQuestions = unusedQuestions.length > 0 ? unusedQuestions : allQuestions;

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    console.log(`Selected question: ${selectedQuestion.questionId} - "${selectedQuestion.text}"`);

    // Generate random publish time between 10:00 and 21:00 JST
    // 10:00 = 600 minutes, 21:00 = 1260 minutes
    const minMinutes = 10 * 60; // 10:00
    const maxMinutes = 21 * 60; // 21:00
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes)) + minMinutes;
    const publishHour = Math.floor(randomMinutes / 60);
    const publishMinute = randomMinutes % 60;
    const scheduledPublishTime = `${String(publishHour).padStart(2, '0')}:${String(publishMinute).padStart(2, '0')}`;

    console.log(`Scheduled publish time: ${scheduledPublishTime} JST`);

    // Set today's question with scheduled publish time
    const timestamp = now();

    await putItem({
      TableName: TABLES.DAILY_QUESTIONS,
      Item: {
        date: today,
        questionId: selectedQuestion.questionId,
        questionText: selectedQuestion.text,
        scheduledPublishTime,
        isFallback: false,
        createdAt: timestamp,
      },
    });

    console.log(`Daily question scheduled successfully for ${today} at ${scheduledPublishTime}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily question scheduled',
        date: today,
        questionId: selectedQuestion.questionId,
        scheduledPublishTime,
      }),
    };
  } catch (err) {
    console.error('Error scheduling daily question:', err);
    throw err;
  }
};
