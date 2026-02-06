import { now, todayJST, TABLES } from './dynamodb';

describe('now', () => {
  test('ISO 8601形式の文字列を返す', () => {
    const result = now();

    // ISO 8601形式のパターン
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('現在時刻に近い値を返す', () => {
    const before = Date.now();
    const result = now();
    const after = Date.now();

    const resultTime = new Date(result).getTime();
    expect(resultTime).toBeGreaterThanOrEqual(before);
    expect(resultTime).toBeLessThanOrEqual(after);
  });
});

describe('todayJST', () => {
  test('YYYY-MM-DD形式の文字列を返す', () => {
    const result = todayJST();

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('有効な日付を返す', () => {
    const result = todayJST();
    const date = new Date(result);

    expect(date.toString()).not.toBe('Invalid Date');
  });

  test('JSTで今日の日付を返す', () => {
    // 現在時刻をJSTに変換
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const expectedDate = nowJST.toISOString().split('T')[0];

    const result = todayJST();

    expect(result).toBe(expectedDate);
  });
});

describe('TABLES', () => {
  test('必要なテーブル名が定義されている', () => {
    // 環境変数が設定されていない場合でも、キーは存在する
    expect(TABLES).toHaveProperty('USERS');
    expect(TABLES).toHaveProperty('QUESTIONS');
    expect(TABLES).toHaveProperty('ANSWERS');
    expect(TABLES).toHaveProperty('REACTIONS');
    expect(TABLES).toHaveProperty('FOLLOWS');
    expect(TABLES).toHaveProperty('BLOCKS');
    expect(TABLES).toHaveProperty('REPORTS');
    expect(TABLES).toHaveProperty('NG_WORDS');
    expect(TABLES).toHaveProperty('DAILY_QUESTIONS');
    expect(TABLES).toHaveProperty('USER_QUESTION_SUBMISSIONS');
    expect(TABLES).toHaveProperty('PUSH_TOKENS');
  });
});
