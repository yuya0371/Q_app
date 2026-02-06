import { APIGatewayProxyHandler } from 'aws-lambda';
import { success, validationError } from '../common/response';

// バージョン設定（本番環境ではDynamoDBやSSM Parameter Storeで管理することを推奨）
const VERSION_CONFIG = {
  ios: {
    minimumVersion: '1.0.0',
    latestVersion: '1.0.0',
    storeUrl: 'https://apps.apple.com/app/id000000000', // TODO: App Store URLに置き換え
  },
  android: {
    minimumVersion: '1.0.0',
    latestVersion: '1.0.0',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.q.app', // TODO: Play Store URLに置き換え
  },
};

// セマンティックバージョン比較 (v1 < v2 なら負、v1 > v2 なら正、等しければ0)
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 !== p2) return p1 - p2;
  }
  return 0;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const platform = event.queryStringParameters?.platform?.toLowerCase();
  const currentVersion = event.queryStringParameters?.version;

  if (!platform || !currentVersion) {
    return validationError('platform and version are required');
  }

  if (!['ios', 'android'].includes(platform)) {
    return validationError('platform must be "ios" or "android"');
  }

  const config = VERSION_CONFIG[platform as 'ios' | 'android'];

  // バージョン比較
  const isUpdateRequired = compareVersions(currentVersion, config.minimumVersion) < 0;
  const isUpdateAvailable = compareVersions(currentVersion, config.latestVersion) < 0;

  return success({
    currentVersion,
    minimumVersion: config.minimumVersion,
    latestVersion: config.latestVersion,
    updateRequired: isUpdateRequired,
    updateAvailable: isUpdateAvailable,
    storeUrl: config.storeUrl,
  });
};
