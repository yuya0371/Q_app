import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { success, serverError } from '../common/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ANSWERS_TABLE = process.env.ANSWERS_TABLE!;
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const status = event.queryStringParameters?.status;
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const cursor = event.queryStringParameters?.cursor;

    // Query flagged answers using GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: ANSWERS_TABLE,
        IndexName: 'FlaggedIndex',
        KeyConditionExpression: 'isFlagged = :flagged',
        FilterExpression: status ? 'flagStatus = :status' : undefined,
        ExpressionAttributeValues: {
          ':flagged': 'true',
          ...(status && { ':status': status }),
        },
        Limit: limit,
        ExclusiveStartKey: cursor
          ? JSON.parse(Buffer.from(cursor, 'base64').toString())
          : undefined,
        ScanIndexForward: false, // Newest first
      })
    );

    const answers = result.Items || [];

    // Get user info for each answer
    const userIds = [...new Set(answers.map((a) => a.userId))];
    let usersMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const usersResult = await docClient.send(
        new BatchGetCommand({
          RequestItems: {
            [USERS_TABLE]: {
              Keys: userIds.map((userId) => ({ userId })),
              ProjectionExpression: 'userId, appId, displayName',
            },
          },
        })
      );
      const users = usersResult.Responses?.[USERS_TABLE] || [];
      usersMap = users.reduce((acc, user) => {
        acc[user.userId] = user;
        return acc;
      }, {} as Record<string, any>);
    }

    const items = answers.map((answer) => ({
      answerId: answer.answerId,
      userId: answer.userId,
      userAppId: usersMap[answer.userId]?.appId || 'unknown',
      date: answer.date,
      text: answer.text,
      displayText: answer.displayText || answer.text,
      flagReason: answer.flagReason || 'NGワード検出',
      flaggedAt: answer.flaggedAt || answer.createdAt,
      status: answer.flagStatus || 'pending',
    }));

    return success({
      items,
      nextCursor: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    });
  } catch (error) {
    console.error('List flagged posts error:', error);
    return serverError('Failed to list flagged posts');
  }
};
