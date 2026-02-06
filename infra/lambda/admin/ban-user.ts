import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { logAdminAction, extractAdminInfo, extractIpAddress } from '../utils/adminLog';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    const adminInfo = extractAdminInfo(event);
    const ipAddress = extractIpAddress(event);

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Check if user exists
    const userResult = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      })
    );

    if (!userResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Update user to banned
    await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET isBanned = :banned, bannedAt = :bannedAt',
        ExpressionAttributeValues: {
          ':banned': true,
          ':bannedAt': new Date().toISOString(),
        },
      })
    );

    // 監査ログを記録
    await logAdminAction({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      action: 'BAN_USER',
      targetType: 'user',
      targetId: userId,
      details: { userAppId: userResult.Item.appId },
      ipAddress,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'User banned successfully' }),
    };
  } catch (error) {
    console.error('Ban user error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
