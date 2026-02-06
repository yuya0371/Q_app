import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, queryItems, batchGetItems, TABLES, todayJST } from '../common/dynamodb';
import { success, unauthorized, serverError } from '../common/response';

interface Follow {
  followerId: string;
  followeeId: string;
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
  displayText?: string;
  date: string;
  isOnTime: boolean;
  lateMinutes: number;
  reactionCount: number;
  isDeleted?: boolean;
  createdAt: string;
}

interface User {
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

interface Reaction {
  reactionId: string;
  userId: string;
  answerId: string;
}

interface DailyQuestion {
  date: string;
  questionId: string;
}

interface Question {
  questionId: string;
  text: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const date = event.queryStringParameters?.date || todayJST();
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '50'), 100);

    // Get followed users
    const follows = await queryItems<Follow>({
      TableName: TABLES.FOLLOWS,
      KeyConditionExpression: 'followerId = :userId',
      ExpressionAttributeValues: { ':userId': authUser.userId },
    });

    const followeeIds = follows.map((f) => f.followeeId);

    // Get blocked users
    const [blockedByMe, blockedMe] = await Promise.all([
      queryItems<Block>({
        TableName: TABLES.BLOCKS,
        KeyConditionExpression: 'blockerId = :userId',
        ExpressionAttributeValues: { ':userId': authUser.userId },
      }),
      queryItems<Block>({
        TableName: TABLES.BLOCKS,
        IndexName: 'blockedId-index',
        KeyConditionExpression: 'blockedId = :userId',
        ExpressionAttributeValues: { ':userId': authUser.userId },
      }),
    ]);

    const blockedIds = new Set([
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ]);

    // Get today's question
    const dailyQuestion = await getItem<DailyQuestion>({
      TableName: TABLES.DAILY_QUESTIONS,
      Key: { date },
    });

    if (!dailyQuestion) {
      return success({ answers: [], question: null, date });
    }

    // Get question details
    const question = await getItem<Question>({
      TableName: TABLES.QUESTIONS,
      Key: { questionId: dailyQuestion.questionId },
    });

    // Get answers from followed users for this date
    const answers = await queryItems<Answer>({
      TableName: TABLES.ANSWERS,
      IndexName: 'date-index',
      KeyConditionExpression: '#date = :date',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':date': date },
    });

    // Filter to only followed users (exclude blocked and deleted)
    const followingSet = new Set(followeeIds);
    const filteredAnswers = answers
      .filter((a) => {
        // Exclude deleted answers
        if (a.isDeleted) return false;
        // Include own answers too
        if (a.userId === authUser.userId) return true;
        // Include if following and not blocked
        return followingSet.has(a.userId) && !blockedIds.has(a.userId);
      })
      // Sort: On-time first, then by createdAt (earliest first)
      .sort((a, b) => {
        // On-time優先
        if (a.isOnTime && !b.isOnTime) return -1;
        if (!a.isOnTime && b.isOnTime) return 1;
        // 同じカテゴリ内では投稿が早い順
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, limit);

    if (filteredAnswers.length === 0) {
      return success({
        answers: [],
        question: question ? { questionId: question.questionId, text: question.text } : null,
        date,
      });
    }

    // Get user details
    const userIds = [...new Set(filteredAnswers.map((a) => a.userId))];
    const users = await batchGetItems<User>({
      RequestItems: {
        [TABLES.USERS]: {
          Keys: userIds.map((id) => ({ userId: id })),
          ProjectionExpression: 'userId, username, displayName, profileImageUrl',
        },
      },
    });
    const userMap = new Map(users.map((u) => [u.userId, u]));

    // Check if current user has reacted to each answer
    const reactionChecks = await Promise.all(
      filteredAnswers.map((a) =>
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
      filteredAnswers.map((a, i) => [a.answerId, reactionChecks[i].length > 0])
    );

    // Build response
    const result = filteredAnswers.map((a) => {
      const user = userMap.get(a.userId);
      return {
        answerId: a.answerId,
        text: a.displayText || a.text, // マスク済みテキストを優先
        isOnTime: a.isOnTime ?? true,
        lateMinutes: a.lateMinutes ?? 0,
        reactionCount: a.reactionCount || 0,
        hasReacted: hasReactedMap.get(a.answerId) || false,
        createdAt: a.createdAt,
        user: user
          ? {
              userId: user.userId,
              username: user.username,
              displayName: user.displayName,
              profileImageUrl: user.profileImageUrl || null,
            }
          : null,
        isOwn: a.userId === authUser.userId,
      };
    });

    return success({
      answers: result,
      question: question ? { questionId: question.questionId, text: question.text } : null,
      date,
    });
  } catch (err) {
    console.error('Get timeline error:', err);
    return serverError('Failed to get timeline');
  }
};
