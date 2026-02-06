import {
  validateAppId,
  validateDisplayName,
  validateAnswerText,
  validateBio,
  validateReportReason,
  maskNgWords,
  calculateOnTimeStatus,
  formatLateTime,
  APP_ID_REGEX,
  EMOJI_REGEX,
  URL_REGEX,
} from './validation';

describe('validateAppId', () => {
  describe('有効なApp ID', () => {
    test('英小文字のみ3文字', () => {
      expect(validateAppId('abc')).toEqual({ isValid: true });
    });

    test('英小文字のみ15文字', () => {
      expect(validateAppId('abcdefghijklmno')).toEqual({ isValid: true });
    });

    test('英小文字+数字', () => {
      expect(validateAppId('user123')).toEqual({ isValid: true });
    });

    test('英小文字+アンダースコア', () => {
      expect(validateAppId('user_name')).toEqual({ isValid: true });
    });

    test('大文字を含む場合は小文字に変換されてOK', () => {
      expect(validateAppId('UserName')).toEqual({ isValid: true });
    });
  });

  describe('無効なApp ID', () => {
    test('空文字列', () => {
      const result = validateAppId('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('アプリ内IDを入力してください');
    });

    test('undefined', () => {
      const result = validateAppId(undefined);
      expect(result.isValid).toBe(false);
    });

    test('2文字（短すぎる）', () => {
      const result = validateAppId('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('3〜15文字');
    });

    test('16文字（長すぎる）', () => {
      const result = validateAppId('abcdefghijklmnop');
      expect(result.isValid).toBe(false);
    });

    test('数字で始まる', () => {
      const result = validateAppId('1user');
      expect(result.isValid).toBe(false);
    });

    test('アンダースコアで始まる', () => {
      const result = validateAppId('_user');
      expect(result.isValid).toBe(false);
    });

    test('ハイフンを含む', () => {
      const result = validateAppId('user-name');
      expect(result.isValid).toBe(false);
    });

    test('スペースを含む', () => {
      const result = validateAppId('user name');
      expect(result.isValid).toBe(false);
    });

    test('日本語を含む', () => {
      const result = validateAppId('ユーザー');
      expect(result.isValid).toBe(false);
    });
  });

  describe('予約語', () => {
    test('admin', () => {
      const result = validateAppId('admin');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('このIDは使用できません');
    });

    test('support', () => {
      const result = validateAppId('support');
      expect(result.isValid).toBe(false);
    });

    test('system', () => {
      const result = validateAppId('system');
      expect(result.isValid).toBe(false);
    });

    test('root', () => {
      const result = validateAppId('root');
      expect(result.isValid).toBe(false);
    });

    test('administrator', () => {
      const result = validateAppId('administrator');
      expect(result.isValid).toBe(false);
    });

    test('ADMIN（大文字も予約語）', () => {
      const result = validateAppId('ADMIN');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validateDisplayName', () => {
  describe('有効な表示名', () => {
    test('1文字', () => {
      expect(validateDisplayName('A')).toEqual({ isValid: true });
    });

    test('20文字', () => {
      expect(validateDisplayName('12345678901234567890')).toEqual({ isValid: true });
    });

    test('日本語', () => {
      expect(validateDisplayName('山田太郎')).toEqual({ isValid: true });
    });

    test('英数字混在', () => {
      expect(validateDisplayName('User123')).toEqual({ isValid: true });
    });

    test('undefined（未指定はOK）', () => {
      expect(validateDisplayName(undefined)).toEqual({ isValid: true });
    });
  });

  describe('無効な表示名', () => {
    test('空文字列', () => {
      const result = validateDisplayName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('1〜20文字');
    });

    test('21文字（長すぎる）', () => {
      const result = validateDisplayName('123456789012345678901');
      expect(result.isValid).toBe(false);
    });

    test('絵文字を含む', () => {
      const result = validateDisplayName('太郎😀');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('表示名に絵文字は使用できません');
    });

    test('絵文字のみ', () => {
      const result = validateDisplayName('🎉');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validateAnswerText', () => {
  describe('有効な回答', () => {
    test('1文字', () => {
      expect(validateAnswerText('A')).toEqual({ isValid: true });
    });

    test('80文字', () => {
      const text = 'A'.repeat(80);
      expect(validateAnswerText(text)).toEqual({ isValid: true });
    });

    test('日本語', () => {
      expect(validateAnswerText('今日は晴れです')).toEqual({ isValid: true });
    });
  });

  describe('無効な回答', () => {
    test('空文字列', () => {
      const result = validateAnswerText('');
      expect(result.isValid).toBe(false);
    });

    test('undefined', () => {
      const result = validateAnswerText(undefined);
      expect(result.isValid).toBe(false);
    });

    test('81文字（長すぎる）', () => {
      const text = 'A'.repeat(81);
      const result = validateAnswerText(text);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('80文字以内');
    });

    test('httpを含むURL', () => {
      const result = validateAnswerText('詳しくはhttp://example.comを見て');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URLを含む回答は投稿できません');
    });

    test('httpsを含むURL', () => {
      const result = validateAnswerText('https://example.com');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validateBio', () => {
  test('undefined（未指定はOK）', () => {
    expect(validateBio(undefined)).toEqual({ isValid: true });
  });

  test('空文字列', () => {
    expect(validateBio('')).toEqual({ isValid: true });
  });

  test('200文字', () => {
    const bio = 'A'.repeat(200);
    expect(validateBio(bio)).toEqual({ isValid: true });
  });

  test('201文字（長すぎる）', () => {
    const bio = 'A'.repeat(201);
    const result = validateBio(bio);
    expect(result.isValid).toBe(false);
  });
});

describe('validateReportReason', () => {
  describe('有効な通報理由', () => {
    test.each([
      'spam',
      'harassment',
      'hate_speech',
      'inappropriate_content',
      'impersonation',
      'personal_info',
      'other',
    ])('%s', (reason) => {
      expect(validateReportReason(reason)).toEqual({ isValid: true });
    });
  });

  describe('無効な通報理由', () => {
    test('空文字列', () => {
      const result = validateReportReason('');
      expect(result.isValid).toBe(false);
    });

    test('存在しない理由', () => {
      const result = validateReportReason('invalid_reason');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('maskNgWords', () => {
  test('NGワードなし', () => {
    const result = maskNgWords('こんにちは', []);
    expect(result).toEqual({
      isFlagged: false,
      displayText: 'こんにちは',
      flagReason: null,
    });
  });

  test('NGワードが含まれない', () => {
    const result = maskNgWords('こんにちは', ['バカ', 'アホ']);
    expect(result).toEqual({
      isFlagged: false,
      displayText: 'こんにちは',
      flagReason: null,
    });
  });

  test('NGワードが1つ含まれる', () => {
    const result = maskNgWords('お前はバカだ', ['バカ']);
    expect(result.isFlagged).toBe(true);
    expect(result.displayText).toBe('お前は**だ');
    expect(result.flagReason).toContain('バカ');
  });

  test('NGワードが複数含まれる', () => {
    const result = maskNgWords('バカとアホ', ['バカ', 'アホ']);
    expect(result.isFlagged).toBe(true);
    expect(result.displayText).toBe('**と**');
    expect(result.flagReason).toContain('バカ');
    expect(result.flagReason).toContain('アホ');
  });

  test('大文字小文字を区別しない', () => {
    const result = maskNgWords('This is SPAM', ['spam']);
    expect(result.isFlagged).toBe(true);
    expect(result.displayText).toBe('This is ****');
  });

  test('NGワードが複数回出現', () => {
    const result = maskNgWords('バカバカしい', ['バカ']);
    expect(result.displayText).toBe('****しい');
  });
});

describe('calculateOnTimeStatus', () => {
  test('publishedAtがundefinedの場合はオンタイム', () => {
    const result = calculateOnTimeStatus(undefined, '2024-01-01T12:00:00Z');
    expect(result).toEqual({ isOnTime: true, lateMinutes: 0 });
  });

  test('公開直後（0分）', () => {
    const published = '2024-01-01T12:00:00Z';
    const created = '2024-01-01T12:00:00Z';
    const result = calculateOnTimeStatus(published, created);
    expect(result).toEqual({ isOnTime: true, lateMinutes: 0 });
  });

  test('公開後30分（オンタイム境界）', () => {
    const published = '2024-01-01T12:00:00Z';
    const created = '2024-01-01T12:30:00Z';
    const result = calculateOnTimeStatus(published, created);
    expect(result).toEqual({ isOnTime: true, lateMinutes: 0 });
  });

  test('公開後31分（遅延）', () => {
    const published = '2024-01-01T12:00:00Z';
    const created = '2024-01-01T12:31:00Z';
    const result = calculateOnTimeStatus(published, created);
    expect(result).toEqual({ isOnTime: false, lateMinutes: 1 });
  });

  test('公開後1時間（30分遅延）', () => {
    const published = '2024-01-01T12:00:00Z';
    const created = '2024-01-01T13:00:00Z';
    const result = calculateOnTimeStatus(published, created);
    expect(result).toEqual({ isOnTime: false, lateMinutes: 30 });
  });

  test('公開後3時間', () => {
    const published = '2024-01-01T12:00:00Z';
    const created = '2024-01-01T15:00:00Z';
    const result = calculateOnTimeStatus(published, created);
    expect(result).toEqual({ isOnTime: false, lateMinutes: 150 });
  });
});

describe('formatLateTime', () => {
  test('0分以下はOn-time', () => {
    expect(formatLateTime(0)).toBe('On-time');
    expect(formatLateTime(-1)).toBe('On-time');
  });

  test('1分遅れ', () => {
    expect(formatLateTime(1)).toBe('1分遅れ');
  });

  test('59分遅れ', () => {
    expect(formatLateTime(59)).toBe('59分遅れ');
  });

  test('60分（1時間）遅れ', () => {
    expect(formatLateTime(60)).toBe('1時間遅れ');
  });

  test('90分（1時間30分）遅れ', () => {
    expect(formatLateTime(90)).toBe('1時間30分遅れ');
  });

  test('120分（2時間）遅れ', () => {
    expect(formatLateTime(120)).toBe('2時間遅れ');
  });

  test('1440分（1日）遅れ', () => {
    expect(formatLateTime(1440)).toBe('1日以上遅れ');
  });

  test('2880分（2日）遅れ', () => {
    expect(formatLateTime(2880)).toBe('2日以上遅れ');
  });
});

describe('正規表現テスト', () => {
  describe('APP_ID_REGEX', () => {
    test('有効なパターン', () => {
      expect(APP_ID_REGEX.test('abc')).toBe(true);
      expect(APP_ID_REGEX.test('user123')).toBe(true);
      expect(APP_ID_REGEX.test('user_name')).toBe(true);
      expect(APP_ID_REGEX.test('a12')).toBe(true);
    });

    test('無効なパターン', () => {
      expect(APP_ID_REGEX.test('ab')).toBe(false);
      expect(APP_ID_REGEX.test('1abc')).toBe(false);
      expect(APP_ID_REGEX.test('ABC')).toBe(false);
      expect(APP_ID_REGEX.test('user-name')).toBe(false);
    });
  });

  describe('EMOJI_REGEX', () => {
    test('絵文字を検出', () => {
      expect(EMOJI_REGEX.test('😀')).toBe(true);
      expect(EMOJI_REGEX.test('🎉')).toBe(true);
      expect(EMOJI_REGEX.test('❤️')).toBe(true);
      expect(EMOJI_REGEX.test('🇯🇵')).toBe(true);
    });

    test('絵文字を含む文字列', () => {
      expect(EMOJI_REGEX.test('Hello😀World')).toBe(true);
    });

    test('絵文字なし', () => {
      expect(EMOJI_REGEX.test('Hello World')).toBe(false);
      expect(EMOJI_REGEX.test('こんにちは')).toBe(false);
    });
  });

  describe('URL_REGEX', () => {
    test('URLを検出', () => {
      expect(URL_REGEX.test('http://example.com')).toBe(true);
      expect(URL_REGEX.test('https://example.com')).toBe(true);
      expect(URL_REGEX.test('HTTP://EXAMPLE.COM')).toBe(true);
    });

    test('URL以外', () => {
      expect(URL_REGEX.test('example.com')).toBe(false);
      expect(URL_REGEX.test('ftp://example.com')).toBe(false);
    });
  });
});
