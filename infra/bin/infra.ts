#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { SchedulerStack } from '../lib/stacks/scheduler-stack';
import { WorkflowStack } from '../lib/stacks/workflow-stack';

const app = new cdk.App();

// 環境設定
const env = app.node.tryGetContext('env') || 'dev';
const envConfig = {
  dev: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  prod: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
};

const stackEnv = envConfig[env as keyof typeof envConfig];
const prefix = `${env}-q`;

// 共通タグ
const tags = {
  Project: 'Q',
  Environment: env,
};

// Auth Stack (Cognito)
const authStack = new AuthStack(app, `${prefix}-auth`, {
  env: stackEnv,
  prefix,
  tags,
});

// Database Stack (DynamoDB)
const databaseStack = new DatabaseStack(app, `${prefix}-database`, {
  env: stackEnv,
  prefix,
  tags,
});

// Storage Stack (S3)
const storageStack = new StorageStack(app, `${prefix}-storage`, {
  env: stackEnv,
  prefix,
  tags,
});

// Workflow Stack (Step Functions) - Created before API Stack due to dependency
const workflowStack = new WorkflowStack(app, `${prefix}-workflow`, {
  env: stackEnv,
  prefix,
  tags,
  userPool: authStack.userPool,
  tables: databaseStack.tables,
  profileImageBucket: storageStack.profileImageBucket,
});

// API Stack (API Gateway + Lambda)
const apiStack = new ApiStack(app, `${prefix}-api`, {
  env: stackEnv,
  prefix,
  tags,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  tables: databaseStack.tables,
  profileImageBucket: storageStack.profileImageBucket,
  deleteUserStateMachineArn: workflowStack.deleteUserStateMachine.stateMachineArn,
});

// Scheduler Stack (EventBridge + Lambda)
const schedulerStack = new SchedulerStack(app, `${prefix}-scheduler`, {
  env: stackEnv,
  prefix,
  tags,
  tables: databaseStack.tables,
});

app.synth();
