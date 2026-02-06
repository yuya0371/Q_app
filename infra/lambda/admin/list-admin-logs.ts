import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { success, serverError } from '../common/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ADMIN_LOGS_TABLE = process.env.ADMIN_LOGS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const cursor = event.queryStringParameters?.cursor;
    const action = event.queryStringParameters?.action;
    const adminId = event.queryStringParameters?.adminId;

    let result;

    if (action) {
      // アクション種別でフィルタ
      result = await docClient.send(
        new QueryCommand({
          TableName: ADMIN_LOGS_TABLE,
          IndexName: 'GSI1_Action',
          KeyConditionExpression: '#action = :action',
          ExpressionAttributeNames: {
            '#action': 'action',
          },
          ExpressionAttributeValues: {
            ':action': action,
          },
          Limit: limit,
          ScanIndexForward: false, // 新しい順
          ExclusiveStartKey: cursor
            ? JSON.parse(Buffer.from(cursor, 'base64').toString())
            : undefined,
        })
      );
    } else if (adminId) {
      // 管理者IDでフィルタ
      result = await docClient.send(
        new QueryCommand({
          TableName: ADMIN_LOGS_TABLE,
          IndexName: 'GSI2_Admin',
          KeyConditionExpression: 'adminId = :adminId',
          ExpressionAttributeValues: {
            ':adminId': adminId,
          },
          Limit: limit,
          ScanIndexForward: false, // 新しい順
          ExclusiveStartKey: cursor
            ? JSON.parse(Buffer.from(cursor, 'base64').toString())
            : undefined,
        })
      );
    } else {
      // すべてのログを取得
      result = await docClient.send(
        new QueryCommand({
          TableName: ADMIN_LOGS_TABLE,
          KeyConditionExpression: 'pk = :pk',
          ExpressionAttributeValues: {
            ':pk': 'LOG',
          },
          Limit: limit,
          ScanIndexForward: false, // 新しい順
          ExclusiveStartKey: cursor
            ? JSON.parse(Buffer.from(cursor, 'base64').toString())
            : undefined,
        })
      );
    }

    const logs = (result.Items || []).map((item) => ({
      logId: item.logId,
      adminId: item.adminId,
      adminEmail: item.adminEmail,
      action: item.action,
      targetType: item.targetType,
      targetId: item.targetId,
      details: item.details,
      ipAddress: item.ipAddress,
      timestamp: item.timestamp,
    }));

    return success({
      items: logs,
      nextCursor: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    });
  } catch (error) {
    console.error('List admin logs error:', error);
    return serverError('Failed to list admin logs');
  }
};
