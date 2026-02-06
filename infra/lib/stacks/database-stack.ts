import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  prefix: string;
}

export interface Tables {
  users: dynamodb.Table;
  dailyQuestions: dynamodb.Table;
  questions: dynamodb.Table;
  answers: dynamodb.Table;
  follows: dynamodb.Table;
  blocks: dynamodb.Table;
  reactions: dynamodb.Table;
  reports: dynamodb.Table;
  userQuestionSubmissions: dynamodb.Table;
  ngWords: dynamodb.Table;
  pushTokens: dynamodb.Table;
  adminLogs: dynamodb.Table;
}

export class DatabaseStack extends cdk.Stack {
  public readonly tables: Tables;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { prefix } = props;

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${prefix}-users`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_AppId',
      partitionKey: { name: 'appId', type: dynamodb.AttributeType.STRING },
    });

    usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    // DailyQuestions Table
    const dailyQuestionsTable = new dynamodb.Table(this, 'DailyQuestionsTable', {
      tableName: `${prefix}-daily-questions`,
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Questions Table
    const questionsTable = new dynamodb.Table(this, 'QuestionsTable', {
      tableName: `${prefix}-questions`,
      partitionKey: { name: 'questionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    questionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_Status',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    questionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2_Approved',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastUsedAt', type: dynamodb.AttributeType.STRING },
    });

    // Answers Table
    const answersTable = new dynamodb.Table(this, 'AnswersTable', {
      tableName: `${prefix}-answers`,
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    answersTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_UserHistory',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
    });

    // Follows Table
    const followsTable = new dynamodb.Table(this, 'FollowsTable', {
      tableName: `${prefix}-follows`,
      partitionKey: { name: 'followerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'followeeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    followsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_Followers',
      partitionKey: { name: 'followeeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'followerId', type: dynamodb.AttributeType.STRING },
    });

    // Blocks Table
    const blocksTable = new dynamodb.Table(this, 'BlocksTable', {
      tableName: `${prefix}-blocks`,
      partitionKey: { name: 'blockerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'blockedId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    blocksTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_BlockedBy',
      partitionKey: { name: 'blockedId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'blockerId', type: dynamodb.AttributeType.STRING },
    });

    // Reactions Table
    const reactionsTable = new dynamodb.Table(this, 'ReactionsTable', {
      tableName: `${prefix}-reactions`,
      partitionKey: { name: 'answerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'reactorId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Reports Table
    const reportsTable = new dynamodb.Table(this, 'ReportsTable', {
      tableName: `${prefix}-reports`,
      partitionKey: { name: 'reportId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    reportsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_Status',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // UserQuestionSubmissions Table
    const userQuestionSubmissionsTable = new dynamodb.Table(this, 'UserQuestionSubmissionsTable', {
      tableName: `${prefix}-user-question-submissions`,
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // NGWords Table
    const ngWordsTable = new dynamodb.Table(this, 'NGWordsTable', {
      tableName: `${prefix}-ng-words`,
      partitionKey: { name: 'word', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // PushTokens Table
    const pushTokensTable = new dynamodb.Table(this, 'PushTokensTable', {
      tableName: `${prefix}-push-tokens`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'token', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // AdminLogs Table (監査ログ)
    const adminLogsTable = new dynamodb.Table(this, 'AdminLogsTable', {
      tableName: `${prefix}-admin-logs`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING }, // 'LOG'
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING }, // timestamp#logId
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl', // 90日後に自動削除
    });

    // 操作種別でのクエリ用GSI
    adminLogsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_Action',
      partitionKey: { name: 'action', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // 管理者IDでのクエリ用GSI
    adminLogsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2_Admin',
      partitionKey: { name: 'adminId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    this.tables = {
      users: usersTable,
      dailyQuestions: dailyQuestionsTable,
      questions: questionsTable,
      answers: answersTable,
      follows: followsTable,
      blocks: blocksTable,
      reactions: reactionsTable,
      reports: reportsTable,
      userQuestionSubmissions: userQuestionSubmissionsTable,
      ngWords: ngWordsTable,
      pushTokens: pushTokensTable,
      adminLogs: adminLogsTable,
    };
  }
}
