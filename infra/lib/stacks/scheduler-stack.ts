import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Tables } from './database-stack';
import * as path from 'path';

interface SchedulerStackProps extends cdk.StackProps {
  prefix: string;
  tables: Tables;
}

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackProps) {
    super(scope, id, props);

    const { prefix, tables } = props;
    const lambdaDir = path.join(__dirname, '../../lambda');

    // Common Lambda environment variables
    const commonEnv = {
      USERS_TABLE: tables.users.tableName,
      QUESTIONS_TABLE: tables.questions.tableName,
      ANSWERS_TABLE: tables.answers.tableName,
      DAILY_QUESTIONS_TABLE: tables.dailyQuestions.tableName,
      PUSH_TOKENS_TABLE: tables.pushTokens.tableName,
    };

    // Common Lambda props
    const nodeJsFunctionProps: Partial<lambda.FunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: commonEnv,
    };

    // ====== SCHEDULE DAILY QUESTION (0:00 JST) ======
    // 毎日0:00に質問を選択し、ランダムな公開時刻（10:00〜21:00）を決定

    const scheduleDailyQuestionFn = new NodejsFunction(this, 'ScheduleDailyQuestionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'scheduled/publish-daily-question.ts'),
      handler: 'handler',
      functionName: `${prefix}-scheduled-schedule-daily-question`,
    });
    tables.questions.grantReadData(scheduleDailyQuestionFn);
    tables.dailyQuestions.grantReadWriteData(scheduleDailyQuestionFn);

    // Schedule: Every day at 00:00 JST (15:00 UTC previous day)
    new events.Rule(this, 'ScheduleDailyQuestionRule', {
      ruleName: `${prefix}-schedule-daily-question`,
      description: 'Schedule daily question at midnight JST (determines random publish time)',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '15', // 15:00 UTC = 00:00 JST
      }),
      targets: [new targets.LambdaFunction(scheduleDailyQuestionFn)],
    });

    // ====== CHECK AND PUBLISH (10分おき、10:00〜21:00 JST) ======
    // 公開時刻に達したら質問を公開し、プッシュ通知を送信

    const checkAndPublishFn = new NodejsFunction(this, 'CheckAndPublishFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'scheduled/check-and-publish.ts'),
      handler: 'handler',
      functionName: `${prefix}-scheduled-check-and-publish`,
    });
    tables.questions.grantReadData(checkAndPublishFn);
    tables.dailyQuestions.grantReadWriteData(checkAndPublishFn);
    tables.pushTokens.grantReadData(checkAndPublishFn);

    // Schedule: Every 10 minutes from 01:00 to 12:00 UTC (10:00 to 21:00 JST)
    // JST 10:00 = UTC 01:00, JST 21:00 = UTC 12:00
    new events.Rule(this, 'CheckAndPublishRule', {
      ruleName: `${prefix}-check-and-publish`,
      description: 'Check if its time to publish daily question (every 10 min, 10:00-21:00 JST)',
      schedule: events.Schedule.cron({
        minute: '0/10', // 10分おき
        hour: '1-12', // UTC 01:00-12:00 = JST 10:00-21:00
      }),
      targets: [new targets.LambdaFunction(checkAndPublishFn)],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ScheduleDailyQuestionFunctionArn', {
      value: scheduleDailyQuestionFn.functionArn,
      exportName: `${prefix}-schedule-daily-question-fn-arn`,
    });

    new cdk.CfnOutput(this, 'CheckAndPublishFunctionArn', {
      value: checkAndPublishFn.functionArn,
      exportName: `${prefix}-check-and-publish-fn-arn`,
    });
  }
}
