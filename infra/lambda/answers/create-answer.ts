import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, putItem, queryItems, scanItems, TABLES, now, todayJST } from '../common/dynamodb';
import { success, validationError, conflict, unauthorized, forbidden, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface NgWord {
  word: string;
}

interface CreateAnswerRequest {
  questionId: string;
  text: string;
}

interface DailyQuestion {
  date: string;
  questionId: string;
  publishedAt?: string;
}

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
  isDeleted?: boolean;
}

const MAX_ANSWER_LENGTH = 80;
const ON_TIME_MINUTES = 30;
const URL_REGEX = /https?:\/\//i;

/**
 * NGワード検出とマスク処理
 */
async function checkAndMaskNgWords(text: string): Promise<{ isFlagged: boolean; displayText: string; flagReason: string | null }> {
  const ngWords = await scanItems<NgWord>({ TableName: TABLES.NG_WORDS });

  if (ngWords.length === 0) {
    return { isFlagged: false, displayText: text, flagReason: null };
  }

  let displayText = text;
  let isFlagged = false;
  const detectedWords: string[] = [];

  for (const ngWord of ngWords) {
    const word = ngWord.word;
    const regex = new RegExp(word, 'gi');
    if (regex.test(text)) {
      isFlagged = true;
      detectedWords.push(word);
      // マスク処理: NGワードを同じ長さの * に置換
      displayText = displayText.replace(regex, '*'.repeat(word.length));
    }
  }

  return {
    isFlagged,
    displayText,
    flagReason: isFlagged ? `NGワード検出: ${detectedWords.join(', ')}` : null,
  };
}

/**
 * オンタイム判定と遅延分数を計算
 */
function calculateOnTimeStatus(publishedAt: string | undefined, createdAt: string): { isOnTime: boolean; lateMinutes: number } {
  if (!publishedAt) {
    // publishedAtがない場合はオンタイムとみなす
    return { isOnTime: true, lateMinutes: 0 };
  }

  const publishedTime = new Date(publishedAt).getTime();
  const createdTime = new Date(createdAt).getTime();
  const diffMinutes = Math.floor((createdTime - publishedTime) / (1000 * 60));

  if (diffMinutes <= ON_TIME_MINUTES) {
    return { isOnTime: true, lateMinutes: 0 };
  }

  return { isOnTime: false, lateMinutes: diffMinutes - ON_TIME_MINUTES };
}

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
      return validationError(`回答は${MAX_ANSWER_LENGTH}文字以内で入力してください`);
    }

    // URL禁止チェック
    if (URL_REGEX.test(body.text)) {
      return validationError('URLを含む回答は投稿できません');
    }

    const today = todayJST();

    // Check if this is today's question
    const dailyQuestion = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date: today },
    });

    if (!dailyQuestion || dailyQuestion.questionId !== body.questionId) {
      return forbidden('今日の質問にのみ回答できます');
    }

    // 質問が公開されているか確認
    if (!dailyQuestion.publishedAt) {
      return forbidden('質問がまだ公開されていません');
    }

    // Check if user already answered this question (including deleted answers)
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
      const existingAnswer = existingAnswers[0];
      if (existingAnswer.isDeleted) {
        // 削除済みの回答がある場合は再投稿不可
        return conflict('削除済みの回答があります。復活機能をご利用ください');
      }
      return conflict('すでにこの質問に回答済みです');
    }

    // Create answer
    const answerId = uuidv4();
    const timestamp = now();

    // オンタイム判定
    const { isOnTime, lateMinutes } = calculateOnTimeStatus(dailyQuestion.publishedAt, timestamp);

    // NGワードチェックとマスク処理
    const { isFlagged, displayText, flagReason } = await checkAndMaskNgWords(body.text);

    await putItem({
      TableName: TABLES.ANSWERS,
      Item: {
        answerId,
        userId: authUser.userId,
        questionId: body.questionId,
        text: body.text,
        displayText,
        date: today,
        isOnTime,
        lateMinutes,
        isFlagged,
        flagReason,
        isDeleted: false,
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
        isOnTime,
        lateMinutes,
        createdAt: timestamp,
      },
    });
  } catch (err) {
    console.error('Create answer error:', err);
    return serverError('Failed to create answer');
  }
};
