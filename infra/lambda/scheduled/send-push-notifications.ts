import { ScheduledHandler } from 'aws-lambda';
import { getItem, scanItems, TABLES, todayJST } from '../common/dynamodb';

interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
}

interface DailyQuestion {
  date: string;
  questionId: string;
}

interface Question {
  questionId: string;
  text: string;
}

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) {
    console.log('No messages to send');
    return;
  }

  // Expo Push API has a limit of 100 messages per request
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error(`Expo Push API error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error('Response:', text);
      } else {
        const result = await response.json();
        console.log(`Sent ${chunk.length} push notifications`, result);
      }
    } catch (err) {
      console.error('Error sending push notifications:', err);
    }
  }
}

/**
 * This Lambda is triggered after the daily question is published
 * to send push notifications to all users.
 */
export const handler: ScheduledHandler = async () => {
  try {
    const today = todayJST();
    console.log(`Sending push notifications for ${today}`);

    // Get today's question
    const dailyQuestion = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
    });

    if (!dailyQuestion) {
      console.log('No question set for today, skipping notifications');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No question set for today' }),
      };
    }

    // Get question text
    const question = await getItem<Question>({
      TableName: TABLES.QUESTIONS,
      Key: { questionId: dailyQuestion.questionId },
    });

    if (!question) {
      console.error('Question not found:', dailyQuestion.questionId);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Question not found' }),
      };
    }

    // Get all push tokens
    const pushTokens = await scanItems<PushToken>({
      TableName: TABLES.PUSH_TOKENS,
    });

    if (pushTokens.length === 0) {
      console.log('No push tokens registered');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No push tokens registered' }),
      };
    }

    console.log(`Found ${pushTokens.length} push tokens`);

    // Build push messages
    const messages: ExpoPushMessage[] = pushTokens.map((token) => ({
      to: token.token,
      sound: 'default',
      title: "Today's Question",
      body: question.text,
      data: {
        type: 'daily_question',
        questionId: question.questionId,
        date: today,
      },
    }));

    // Send notifications
    await sendExpoPushNotifications(messages);

    console.log(`Push notifications sent for ${today}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Push notifications sent',
        count: messages.length,
      }),
    };
  } catch (err) {
    console.error('Error sending push notifications:', err);
    throw err;
  }
};
