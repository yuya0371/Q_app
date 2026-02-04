import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser, getUserIdFromPath } from '../common/auth';
import { getItem, queryItems, batchGetItems, TABLES } from '../common/dynamodb';
import { success, notFound, unauthorized, forbidden, serverError } from '../common/response';

interface User {
  userId: string;
  isPrivate: boolean;
}

interface Follow {
  followerId: string;
  followingId: string;
}

interface Block {
  blockerId: string;
  blockedId: string;
}

interface Answer {
  answerId: string;
  userId: string;
  questionId: string;
  text: string;
  date: string;
  reactionCount: number;
  createdAt: string;
}

interface Question {
  questionId: string;
  text: string;
}

interface Reaction {
  reactionId: string;
  userId: string;
  answerId: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const targetUserId = getUserIdFromPath(event);
    if (!targetUserId) {
      return notFound('User not found');
    }

    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 50);
    const beforeDate = event.queryStringParameters?.before;

    // Check if target user exists
    const targetUser = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: targetUserId },
    });

    if (!targetUser) {
      return notFound('User not found');
    }

    // Check if blocked
    if (targetUserId !== authUser.userId) {
      const blocked = await getItem<Block>({
        TableName: TABLES.BLOCKS,
        Key: { blockerId: targetUserId, blockedId: authUser.userId },
      });

      if (blocked) {
        return notFound('User not found');
      }

      // Check private account access
      if (targetUser.isPrivate) {
        const follows = await getItem<Follow>({
          TableName: TABLES.FOLLOWS,
          Key: { followerId: authUser.userId, followingId: targetUserId },
        });

        if (!follows) {
          return forbidden('This account is private');
        }
      }
    }

    // Get user's answers
    let answers: Answer[];

    if (beforeDate) {
      answers = await queryItems<Answer>({
        TableName: TABLES.ANSWERS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId AND #date < :beforeDate',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: {
          ':userId': targetUserId,
          ':beforeDate': beforeDate,
        },
        ScanIndexForward: false,
        Limit: limit,
      });
    } else {
      answers = await queryItems<Answer>({
        TableName: TABLES.ANSWERS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': targetUserId },
        ScanIndexForward: false,
        Limit: limit,
      });
    }

    if (answers.length === 0) {
      return success({ answers: [], hasMore: false });
    }

    // Get question details
    const questionIds = [...new Set(answers.map((a) => a.questionId))];
    const questions = await batchGetItems<Question>({
      RequestItems: {
        [TABLES.QUESTIONS]: {
          Keys: questionIds.map((id) => ({ questionId: id })),
        },
      },
    });
    const questionMap = new Map(questions.map((q) => [q.questionId, q]));

    // Check if current user has reacted to each answer
    const reactionChecks = await Promise.all(
      answers.map((a) =>
        queryItems<Reaction>({
          TableName: TABLES.REACTIONS,
          IndexName: 'userId-answerId-index',
          KeyConditionExpression: 'userId = :userId AND answerId = :answerId',
          ExpressionAttributeValues: {
            ':userId': authUser.userId,
            ':answerId': a.answerId,
          },
        })
      )
    );

    const hasReactedMap = new Map(
      answers.map((a, i) => [a.answerId, reactionChecks[i].length > 0])
    );

    // Build response
    const result = answers.map((a) => {
      const question = questionMap.get(a.questionId);
      return {
        answerId: a.answerId,
        text: a.text,
        date: a.date,
        reactionCount: a.reactionCount || 0,
        hasReacted: hasReactedMap.get(a.answerId) || false,
        createdAt: a.createdAt,
        question: question
          ? {
              questionId: question.questionId,
              text: question.text,
            }
          : null,
      };
    });

    return success({
      answers: result,
      hasMore: answers.length === limit,
      nextBefore: answers.length > 0 ? answers[answers.length - 1].date : null,
    });
  } catch (err) {
    console.error('Get user answers error:', err);
    return serverError('Failed to get user answers');
  }
};
