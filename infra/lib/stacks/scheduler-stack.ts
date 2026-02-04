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

    // ====== PUBLISH DAILY QUESTION ======

    const publishDailyQuestionFn = new NodejsFunction(this, 'PublishDailyQuestionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'scheduled/publish-daily-question.ts'),
      handler: 'handler',
      functionName: `${prefix}-scheduled-publish-daily-question`,
    });
    tables.questions.grantReadData(publishDailyQuestionFn);
    tables.dailyQuestions.grantReadWriteData(publishDailyQuestionFn);

    // Schedule: Every day at 00:00 JST (15:00 UTC previous day)
    new events.Rule(this, 'PublishDailyQuestionRule', {
      ruleName: `${prefix}-publish-daily-question`,
      description: 'Publish daily question at midnight JST',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '15', // 15:00 UTC = 00:00 JST
      }),
      targets: [new targets.LambdaFunction(publishDailyQuestionFn)],
    });

    // ====== SEND PUSH NOTIFICATIONS ======

    const sendPushNotificationsFn = new NodejsFunction(this, 'SendPushNotificationsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'scheduled/send-push-notifications.ts'),
      handler: 'handler',
      functionName: `${prefix}-scheduled-send-push-notifications`,
    });
    tables.questions.grantReadData(sendPushNotificationsFn);
    tables.dailyQuestions.grantReadData(sendPushNotificationsFn);
    tables.pushTokens.grantReadData(sendPushNotificationsFn);

    // Schedule: Every day at 07:00 JST (22:00 UTC previous day)
    new events.Rule(this, 'SendPushNotificationsRule', {
      ruleName: `${prefix}-send-push-notifications`,
      description: 'Send push notifications for daily question at 7am JST',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '22', // 22:00 UTC = 07:00 JST
      }),
      targets: [new targets.LambdaFunction(sendPushNotificationsFn)],
    });

    // Outputs
    new cdk.CfnOutput(this, 'PublishDailyQuestionFunctionArn', {
      value: publishDailyQuestionFn.functionArn,
      exportName: `${prefix}-publish-daily-question-fn-arn`,
    });

    new cdk.CfnOutput(this, 'SendPushNotificationsFunctionArn', {
      value: sendPushNotificationsFn.functionArn,
      exportName: `${prefix}-send-push-notifications-fn-arn`,
    });
  }
}
