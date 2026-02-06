/**
 * バリデーションユーティリティ
 * テスト可能なバリデーション関数を提供
 */

// App ID: 3〜15文字、先頭は英字、英小文字+数字+_のみ
export const APP_ID_REGEX = /^[a-z][a-z0-9_]{2,14}$/;
export const RESERVED_WORDS = ['admin', 'support', 'system', 'root', 'administrator'];

// 絵文字検出用正規表現
export const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u;

// URL検出用正規表現
export const URL_REGEX = /https?:\/\//i;

// 定数
export const MAX_ANSWER_LENGTH = 80;
export const MAX_DISPLAY_NAME_LENGTH = 20;
export const MAX_BIO_LENGTH = 200;
export const ON_TIME_MINUTES = 30;

/**
 * App ID バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * App ID のバリデーション
 */
export function validateAppId(appId: string | undefined): ValidationResult {
  if (!appId) {
    return { isValid: false, error: 'アプリ内IDを入力してください' };
  }

  const appIdLower = appId.toLowerCase();

  if (!APP_ID_REGEX.test(appIdLower)) {
    return {
      isValid: false,
      error: 'アプリ内IDは3〜15文字、先頭は英字、英小文字・数字・アンダースコアのみ使用可能です',
    };
  }

  if (RESERVED_WORDS.includes(appIdLower)) {
    return { isValid: false, error: 'このIDは使用できません' };
  }

  return { isValid: true };
}

/**
 * 表示名のバリデーション
 */
export function validateDisplayName(displayName: string | undefined): ValidationResult {
  if (displayName === undefined) {
    return { isValid: true }; // 未指定はOK
  }

  if (displayName.length < 1 || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return { isValid: false, error: '表示名は1〜20文字で入力してください' };
  }

  if (EMOJI_REGEX.test(displayName)) {
    return { isValid: false, error: '表示名に絵文字は使用できません' };
  }

  return { isValid: true };
}

/**
 * 回答テキストのバリデーション
 */
export function validateAnswerText(text: string | undefined): ValidationResult {
  if (!text) {
    return { isValid: false, error: '回答を入力してください' };
  }

  if (text.length > MAX_ANSWER_LENGTH) {
    return { isValid: false, error: `回答は${MAX_ANSWER_LENGTH}文字以内で入力してください` };
  }

  if (URL_REGEX.test(text)) {
    return { isValid: false, error: 'URLを含む回答は投稿できません' };
  }

  return { isValid: true };
}

/**
 * Bio のバリデーション
 */
export function validateBio(bio: string | undefined): ValidationResult {
  if (bio === undefined) {
    return { isValid: true };
  }

  if (bio.length > MAX_BIO_LENGTH) {
    return { isValid: false, error: 'Bio must be 200 characters or less' };
  }

  return { isValid: true };
}

/**
 * NGワードマスク処理
 */
export function maskNgWords(
  text: string,
  ngWords: string[]
): { isFlagged: boolean; displayText: string; flagReason: string | null } {
  if (ngWords.length === 0) {
    return { isFlagged: false, displayText: text, flagReason: null };
  }

  let displayText = text;
  let isFlagged = false;
  const detectedWords: string[] = [];

  for (const word of ngWords) {
    const regex = new RegExp(word, 'gi');
    if (regex.test(text)) {
      isFlagged = true;
      detectedWords.push(word);
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
export function calculateOnTimeStatus(
  publishedAt: string | undefined,
  createdAt: string
): { isOnTime: boolean; lateMinutes: number } {
  if (!publishedAt) {
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

/**
 * 遅延時間の表示形式を取得
 */
export function formatLateTime(lateMinutes: number): string {
  if (lateMinutes <= 0) {
    return 'On-time';
  }

  if (lateMinutes < 60) {
    return `${lateMinutes}分遅れ`;
  }

  if (lateMinutes < 1440) {
    // 24時間未満
    const hours = Math.floor(lateMinutes / 60);
    const mins = lateMinutes % 60;
    if (mins === 0) {
      return `${hours}時間遅れ`;
    }
    return `${hours}時間${mins}分遅れ`;
  }

  // 24時間以上
  const days = Math.floor(lateMinutes / 1440);
  return `${days}日以上遅れ`;
}

/**
 * 通報理由の検証
 */
export const VALID_REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'inappropriate_content',
  'impersonation',
  'personal_info',
  'other',
] as const;

export type ReportReason = (typeof VALID_REPORT_REASONS)[number];

export function validateReportReason(reason: string): ValidationResult {
  if (!reason) {
    return { isValid: false, error: '通報理由を選択してください' };
  }

  if (!VALID_REPORT_REASONS.includes(reason as ReportReason)) {
    return { isValid: false, error: `無効な通報理由です: ${reason}` };
  }

  return { isValid: true };
}
