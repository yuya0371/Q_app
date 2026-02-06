import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { success, serverError } from '../common/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const query = event.queryStringParameters?.q;
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const cursor = event.queryStringParameters?.cursor;

    let items: any[] = [];
    let lastEvaluatedKey: any;

    if (query) {
      // Search by appId using GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: USERS_TABLE,
          IndexName: 'AppIdIndex',
          KeyConditionExpression: 'appId = :appId',
          ExpressionAttributeValues: {
            ':appId': query,
          },
          Limit: limit,
        })
      );
      items = result.Items || [];
    } else {
      // Scan all users
      const result = await docClient.send(
        new ScanCommand({
          TableName: USERS_TABLE,
          Limit: limit,
          ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined,
        })
      );
      items = result.Items || [];
      lastEvaluatedKey = result.LastEvaluatedKey;
    }

    const users = items.map((item) => ({
      userId: item.userId,
      appId: item.appId,
      email: item.email,
      displayName: item.displayName,
      status: item.isBanned ? 'banned' : 'active',
      createdAt: item.createdAt,
      answersCount: item.answersCount || 0,
    }));

    return success({
      items: users,
      nextCursor: lastEvaluatedKey
        ? Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64')
        : undefined,
    });
  } catch (error) {
    console.error('List users error:', error);
    return serverError('Failed to list users');
  }
};
