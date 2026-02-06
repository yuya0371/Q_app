import { ScheduledHandler } from 'aws-lambda';
import { getItem, scanItems, updateItem, TABLES, now, todayJST } from '../common/dynamodb';

interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
}

interface DailyQuestion {
  date: string;
  questionId: string;
  questionText: string;
  scheduledPublishTime: string;
  publishedAt?: string;
}

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * 現在時刻がJSTで何時何分かを取得
 */
function getCurrentTimeJST(): string {
  const nowDate = new Date();
  // JSTは UTC+9
  const jstOffset = 9 * 60; // 9時間 = 540分
  const utcMinutes = nowDate.getUTCHours() * 60 + nowDate.getUTCMinutes();
  const jstMinutes = (utcMinutes + jstOffset) % (24 * 60);
  const jstHour = Math.floor(jstMinutes / 60);
  const jstMinute = jstMinutes % 60;
  return `${String(jstHour).padStart(2, '0')}:${String(jstMinute).padStart(2, '0')}`;
}

/**
 * 時刻文字列を分に変換（比較用）
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

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
 * 10分おきに実行され、公開時刻に達したら質問を公開し、プッシュ通知を送信する。
 */
export const handler: ScheduledHandler = async () => {
  try {
    const today = todayJST();
    const currentTime = getCurrentTimeJST();
    console.log(`Checking daily question publication for ${today} at ${currentTime} JST`);

    // Get today's daily question
    const dailyQuestion = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
    });

    if (!dailyQuestion) {
      console.log('No question set for today');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No question set for today' }),
      };
    }

    // Already published
    if (dailyQuestion.publishedAt) {
      console.log(`Question already published at ${dailyQuestion.publishedAt}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Already published', publishedAt: dailyQuestion.publishedAt }),
      };
    }

    // Check if it's time to publish
    const scheduledMinutes = timeToMinutes(dailyQuestion.scheduledPublishTime);
    const currentMinutes = timeToMinutes(currentTime);

    if (currentMinutes < scheduledMinutes) {
      console.log(`Not yet time to publish. Scheduled: ${dailyQuestion.scheduledPublishTime}, Current: ${currentTime}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Not yet time to publish',
          scheduledPublishTime: dailyQuestion.scheduledPublishTime,
          currentTime,
        }),
      };
    }

    // Time to publish! Update publishedAt
    const timestamp = now();
    await updateItem({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
      UpdateExpression: 'SET publishedAt = :publishedAt',
      ExpressionAttributeValues: {
        ':publishedAt': timestamp,
      },
    });

    console.log(`Question published at ${timestamp}`);

    // Send push notifications
    const pushTokens = await scanItems<PushToken>({
      TableName: TABLES.PUSH_TOKENS,
    });

    if (pushTokens.length === 0) {
      console.log('No push tokens registered');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Published but no push tokens' }),
      };
    }

    console.log(`Found ${pushTokens.length} push tokens`);

    // Build push messages
    const messages: ExpoPushMessage[] = pushTokens.map((token) => ({
      to: token.token,
      sound: 'default',
      title: '今日の質問',
      body: dailyQuestion.questionText,
      data: {
        type: 'daily_question',
        questionId: dailyQuestion.questionId,
        date: today,
      },
    }));

    // Send notifications
    await sendExpoPushNotifications(messages);

    console.log(`Push notifications sent for ${today}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Question published and notifications sent',
        publishedAt: timestamp,
        notificationCount: messages.length,
      }),
    };
  } catch (err) {
    console.error('Error in check-and-publish:', err);
    throw err;
  }
};
