import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// アプリのベースURL（後でドメイン取得後に変更）
const APP_BASE_URL = 'https://q-app.example.com';

export const getProfileUrl = (appId: string): string => {
  return `${APP_BASE_URL}/user/${appId}`;
};

export const getAppDownloadUrl = (): string => {
  // TODO: App Store/Google Playリンクに変更
  return APP_BASE_URL;
};

export const shareProfile = async (appId: string, displayName: string): Promise<boolean> => {
  const url = getProfileUrl(appId);
  const message = `${displayName}さんのプロフィール`;

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { url, message }
        : { message: `${message}\n${url}` }
    );

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
};

export const copyProfileUrl = async (appId: string): Promise<boolean> => {
  const url = getProfileUrl(appId);
  try {
    await Clipboard.setStringAsync(url);
    return true;
  } catch (error) {
    console.error('Copy error:', error);
    return false;
  }
};

export const shareApp = async (): Promise<boolean> => {
  const url = getAppDownloadUrl();
  const message = 'Q.（仮）- 毎日ひとつの質問に答えるSNS';

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { url, message }
        : { message: `${message}\n${url}` }
    );

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
};
