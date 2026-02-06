import { APIGatewayProxyHandler } from 'aws-lambda';
import { scanCount, scanItems, getItem, TABLES, todayJST } from '../common/dynamodb';
import { success, serverError } from '../common/response';

interface Report {
  reportId: string;
  reporterId: string;
  targetType: 'user' | 'answer';
  targetId: string;
  targetUserId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

interface User {
  userId: string;
  appId: string;
  displayName?: string;
}

interface QuestionSubmission {
  submissionId: string;
  userId: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface DailyQuestion {
  date: string;
  questionId: string;
  publishedAt?: string;
}

interface Question {
  questionId: string;
  text: string;
}

interface Answer {
  answerId: string;
  userId: string;
  date: string;
  createdAt: string;
}

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const today = todayJST();

    // 並列で統計情報を取得
    const [
      totalUsers,
      todayAnswers,
      pendingReports,
      pendingSubmissions,
      recentReports,
      todayDailyQuestion,
    ] = await Promise.all([
      // 総ユーザー数
      scanCount({ TableName: TABLES.USERS }),
      // 今日の回答数
      scanCount({
        TableName: TABLES.ANSWERS,
        FilterExpression: '#date = :today',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: { ':today': today },
      }),
      // 未対応の通報数
      scanCount({
        TableName: TABLES.REPORTS,
        FilterExpression: '#status = :pending',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':pending': 'pending' },
      }),
      // 承認待ちのお題提案数
      scanCount({
        TableName: TABLES.USER_QUESTION_SUBMISSIONS,
        FilterExpression: '#status = :pending',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':pending': 'pending' },
      }),
      // 最近の通報（最新5件）
      scanItems<Report>({ TableName: TABLES.REPORTS }),
      // 今日の質問
      getItem<DailyQuestion>({
        TableName: TABLES.DAILY_QUESTIONS,
        Key: { date: today },
      }),
    ]);

    // 最近の通報を加工（最新5件、ユーザー情報付き）
    const sortedReports = recentReports
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    // 通報者情報を取得
    let recentReportsWithUsers: Array<{
      reportId: string;
      targetType: string;
      reason: string;
      status: string;
      createdAt: string;
      reporter: { appId: string; displayName?: string } | null;
    }> = [];

    if (sortedReports.length > 0) {
      const reporterIds = [...new Set(sortedReports.map((r) => r.reporterId))];
      const reporters = await Promise.all(
        reporterIds.map((id) =>
          getItem<User>({
            TableName: TABLES.USERS,
            Key: { userId: id },
          })
        )
      );
      const userMap = new Map(
        reporters.filter(Boolean).map((u) => [u!.userId, u])
      );

      recentReportsWithUsers = sortedReports.map((r) => {
        const reporter = userMap.get(r.reporterId);
        return {
          reportId: r.reportId,
          targetType: r.targetType,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
          reporter: reporter
            ? { appId: reporter.appId, displayName: reporter.displayName }
            : null,
        };
      });
    }

    // 今日の質問情報を取得
    let todayQuestion: { questionId: string; text: string; answerCount: number } | null = null;
    if (todayDailyQuestion) {
      const question = await getItem<Question>({
        TableName: TABLES.QUESTIONS,
        Key: { questionId: todayDailyQuestion.questionId },
      });
      if (question) {
        todayQuestion = {
          questionId: question.questionId,
          text: question.text,
          answerCount: todayAnswers,
        };
      }
    }

    return success({
      stats: {
        totalUsers,
        todayAnswers,
        pendingReports,
        pendingSubmissions,
      },
      recentReports: recentReportsWithUsers,
      todayQuestion,
      date: today,
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    return serverError('Failed to get dashboard stats');
  }
};
