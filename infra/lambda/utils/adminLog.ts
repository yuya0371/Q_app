import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ADMIN_LOGS_TABLE = process.env.ADMIN_LOGS_TABLE!;

export type AdminAction =
  | 'CREATE_QUESTION'
  | 'SET_DAILY_QUESTION'
  | 'ADD_NG_WORD'
  | 'DELETE_NG_WORD'
  | 'UPDATE_REPORT'
  | 'REVIEW_SUBMISSION'
  | 'BAN_USER'
  | 'UNBAN_USER'
  | 'REVIEW_FLAGGED_POST';

interface LogParams {
  adminId: string;
  adminEmail?: string;
  action: AdminAction;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAdminAction(params: LogParams): Promise<void> {
  const {
    adminId,
    adminEmail,
    action,
    targetType,
    targetId,
    details,
    ipAddress,
  } = params;

  const timestamp = new Date().toISOString();
  const logId = uuidv4();

  // TTL: 90日後
  const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

  try {
    await docClient.send(
      new PutCommand({
        TableName: ADMIN_LOGS_TABLE,
        Item: {
          pk: 'LOG',
          sk: `${timestamp}#${logId}`,
          logId,
          adminId,
          adminEmail,
          action,
          targetType,
          targetId,
          details,
          ipAddress,
          timestamp,
          ttl,
        },
      })
    );
  } catch (error) {
    // ログ記録失敗は警告のみ（本体処理は継続）
    console.warn('Failed to log admin action:', error);
  }
}

// JWTからユーザー情報を抽出するヘルパー
export function extractAdminInfo(event: any): { adminId: string; adminEmail?: string } {
  const claims = event.requestContext?.authorizer?.claims;
  return {
    adminId: claims?.sub || 'unknown',
    adminEmail: claims?.email,
  };
}

// IPアドレスを抽出するヘルパー
export function extractIpAddress(event: any): string | undefined {
  return event.requestContext?.identity?.sourceIp;
}
