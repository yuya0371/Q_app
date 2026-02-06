import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const ANSWERS_TABLE = process.env.ANSWERS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const answerId = event.pathParameters?.answerId;

    if (!answerId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Answer ID is required' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { status } = body;

    if (!status || !['approved', 'removed'].includes(status)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Valid status (approved/removed) is required' }),
      };
    }

    // Parse answerId format: {date}#{userId}
    const [date, userId] = answerId.split('#');

    if (!date || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid answer ID format' }),
      };
    }

    // Check if answer exists
    const answerResult = await docClient.send(
      new GetCommand({
        TableName: ANSWERS_TABLE,
        Key: { date, odai: `answer#${userId}` },
      })
    );

    if (!answerResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Answer not found' }),
      };
    }

    if (status === 'removed') {
      // Soft delete the answer
      await docClient.send(
        new UpdateCommand({
          TableName: ANSWERS_TABLE,
          Key: { date, odai: `answer#${userId}` },
          UpdateExpression: 'SET isDeleted = :deleted, deletedAt = :deletedAt, flagStatus = :status, reviewedAt = :reviewedAt',
          ExpressionAttributeValues: {
            ':deleted': true,
            ':deletedAt': new Date().toISOString(),
            ':status': status,
            ':reviewedAt': new Date().toISOString(),
          },
        })
      );
    } else {
      // Approve - just update the flag status
      await docClient.send(
        new UpdateCommand({
          TableName: ANSWERS_TABLE,
          Key: { date, odai: `answer#${userId}` },
          UpdateExpression: 'SET flagStatus = :status, reviewedAt = :reviewedAt',
          ExpressionAttributeValues: {
            ':status': status,
            ':reviewedAt': new Date().toISOString(),
          },
        })
      );
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: `Answer ${status === 'removed' ? 'removed' : 'approved'} successfully` }),
    };
  } catch (error) {
    console.error('Review flagged post error:', error);
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
