import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Tables } from './database-stack';
import * as path from 'path';

interface WorkflowStackProps extends cdk.StackProps {
  prefix: string;
  userPool: cognito.UserPool;
  tables: Tables;
  profileImageBucket: s3.Bucket;
}

export class WorkflowStack extends cdk.Stack {
  public readonly deleteUserStateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props);

    const { prefix, userPool, tables, profileImageBucket } = props;
    const lambdaDir = path.join(__dirname, '../../lambda');

    // Common Lambda environment variables
    const commonEnv = {
      USER_POOL_ID: userPool.userPoolId,
      USERS_TABLE: tables.users.tableName,
      ANSWERS_TABLE: tables.answers.tableName,
      REACTIONS_TABLE: tables.reactions.tableName,
      FOLLOWS_TABLE: tables.follows.tableName,
      BLOCKS_TABLE: tables.blocks.tableName,
      REPORTS_TABLE: tables.reports.tableName,
      PUSH_TOKENS_TABLE: tables.pushTokens.tableName,
      PROFILE_IMAGE_BUCKET: profileImageBucket.bucketName,
    };

    // Common Lambda props
    const nodeJsFunctionProps: Partial<lambda.FunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: commonEnv,
    };

    // ====== DELETE USER WORKFLOW LAMBDAS ======

    // Delete User Data Lambda
    const deleteUserDataFn = new NodejsFunction(this, 'DeleteUserDataFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'workflows/delete-user-data.ts'),
      handler: 'handler',
      functionName: `${prefix}-workflow-delete-user-data`,
    });
    tables.users.grantReadWriteData(deleteUserDataFn);
    tables.answers.grantReadWriteData(deleteUserDataFn);
    tables.reactions.grantReadWriteData(deleteUserDataFn);
    tables.follows.grantReadWriteData(deleteUserDataFn);
    tables.blocks.grantReadWriteData(deleteUserDataFn);
    tables.pushTokens.grantReadWriteData(deleteUserDataFn);

    // Delete Cognito User Lambda
    const deleteCognitoUserFn = new NodejsFunction(this, 'DeleteCognitoUserFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'workflows/delete-cognito-user.ts'),
      handler: 'handler',
      functionName: `${prefix}-workflow-delete-cognito-user`,
    });
    deleteCognitoUserFn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminUserGlobalSignOut',
        'cognito-idp:AdminDeleteUser',
      ],
      resources: [userPool.userPoolArn],
    }));

    // Delete User Images Lambda
    const deleteUserImagesFn = new NodejsFunction(this, 'DeleteUserImagesFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'workflows/delete-user-images.ts'),
      handler: 'handler',
      functionName: `${prefix}-workflow-delete-user-images`,
    });
    profileImageBucket.grantReadWrite(deleteUserImagesFn);
    profileImageBucket.grantDelete(deleteUserImagesFn);

    // ====== STEP FUNCTIONS DEFINITION ======

    // Step 1: Delete User Data from DynamoDB
    const deleteUserDataTask = new tasks.LambdaInvoke(this, 'DeleteUserData', {
      lambdaFunction: deleteUserDataFn,
      outputPath: '$.Payload',
    });

    // Step 2: Delete User Images from S3
    const deleteUserImagesTask = new tasks.LambdaInvoke(this, 'DeleteUserImages', {
      lambdaFunction: deleteUserImagesFn,
      outputPath: '$.Payload',
    });

    // Step 3: Delete Cognito User
    const deleteCognitoUserTask = new tasks.LambdaInvoke(this, 'DeleteCognitoUser', {
      lambdaFunction: deleteCognitoUserFn,
      outputPath: '$.Payload',
    });

    // Success state
    const successState = new stepfunctions.Succeed(this, 'DeleteUserComplete', {
      comment: 'User deletion completed successfully',
    });

    // Failure state
    const failureState = new stepfunctions.Fail(this, 'DeleteUserFailed', {
      error: 'UserDeletionFailed',
      cause: 'One or more steps in user deletion failed',
    });

    // Error handling
    deleteUserDataTask.addCatch(failureState);
    deleteUserImagesTask.addCatch(failureState);
    deleteCognitoUserTask.addCatch(failureState);

    // Chain the steps
    const definition = deleteUserDataTask
      .next(deleteUserImagesTask)
      .next(deleteCognitoUserTask)
      .next(successState);

    // Create State Machine
    this.deleteUserStateMachine = new stepfunctions.StateMachine(this, 'DeleteUserStateMachine', {
      stateMachineName: `${prefix}-delete-user`,
      stateMachineType: stepfunctions.StateMachineType.STANDARD,
      definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.hours(1),
      tracingEnabled: true,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DeleteUserStateMachineArn', {
      value: this.deleteUserStateMachine.stateMachineArn,
      exportName: `${prefix}-delete-user-state-machine-arn`,
    });
  }
}
