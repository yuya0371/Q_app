import { parseDeepLink, webLink } from '../utils/deepLink';

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string, options: { scheme: string }) => {
    return `${options.scheme}://${path}`;
  }),
  parse: jest.fn((url: string) => {
    // Simple URL parser for testing
    const match = url.match(/^(?:q-app:\/\/|https?:\/\/[^/]+\/)(.*)$/);
    return {
      path: match ? match[1] : null,
    };
  }),
}));

describe('webLink', () => {
  test('userProfile: ユーザープロフィールURLを生成', () => {
    const url = webLink.userProfile('testuser');
    expect(url).toMatch(/\/testuser$/);
  });

  test('question: 質問URLを生成', () => {
    const url = webLink.question('q123');
    expect(url).toMatch(/\/q\/q123$/);
  });
});

describe('parseDeepLink', () => {
  test('userルートをパース', () => {
    const result = parseDeepLink('q-app://user/testuser');

    expect(result.route).toBe('user');
    expect(result.params).toEqual({ appId: 'testuser' });
  });

  test('questionルートをパース', () => {
    const result = parseDeepLink('q-app://question/q123');

    expect(result.route).toBe('question');
    expect(result.params).toEqual({ questionId: 'q123' });
  });

  test('answerルートをパース', () => {
    const result = parseDeepLink('q-app://answer/a456');

    expect(result.route).toBe('answer');
    expect(result.params).toEqual({ answerId: 'a456' });
  });

  test('空のパスはunknownを返す', () => {
    const result = parseDeepLink('q-app://');

    expect(result.route).toBe('unknown');
    expect(result.params).toEqual({});
  });

  test('不明なルートはunknownを返す', () => {
    const result = parseDeepLink('q-app://unknown/path');

    expect(result.route).toBe('unknown');
    expect(result.params).toEqual({});
  });

  test('パラメータがないuserルートはunknownを返す', () => {
    const result = parseDeepLink('q-app://user');

    expect(result.route).toBe('unknown');
    expect(result.params).toEqual({});
  });
});
