import { APIGatewayProxyHandler } from 'aws-lambda';
import { scanItems, TABLES } from '../common/dynamodb';
import { success, serverError } from '../common/response';

interface NgWord {
  word: string;
  createdAt: string;
}

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const ngWords = await scanItems<NgWord>({
      TableName: TABLES.NG_WORDS,
    });

    return success({
      items: ngWords.map((w) => ({
        wordId: w.word, // wordをIDとして使用（テーブルのパーティションキー）
        word: w.word,
        createdAt: w.createdAt,
      })),
    });
  } catch (err) {
    console.error('List NG words error:', err);
    return serverError('Failed to list NG words');
  }
};
