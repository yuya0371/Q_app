import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Tables } from './database-stack';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  prefix: string;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  tables: Tables;
  profileImageBucket: s3.Bucket;
  deleteUserStateMachineArn: string;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { prefix, userPool, userPoolClient, tables, profileImageBucket, deleteUserStateMachineArn } = props;
    const lambdaDir = path.join(__dirname, '../../lambda');

    // Common Lambda environment variables
    const commonEnv = {
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      USERS_TABLE: tables.users.tableName,
      QUESTIONS_TABLE: tables.questions.tableName,
      ANSWERS_TABLE: tables.answers.tableName,
      REACTIONS_TABLE: tables.reactions.tableName,
      FOLLOWS_TABLE: tables.follows.tableName,
      BLOCKS_TABLE: tables.blocks.tableName,
      REPORTS_TABLE: tables.reports.tableName,
      NG_WORDS_TABLE: tables.ngWords.tableName,
      DAILY_QUESTIONS_TABLE: tables.dailyQuestions.tableName,
      USER_QUESTION_SUBMISSIONS_TABLE: tables.userQuestionSubmissions.tableName,
      PUSH_TOKENS_TABLE: tables.pushTokens.tableName,
      ADMIN_LOGS_TABLE: tables.adminLogs.tableName,
      PROFILE_IMAGE_BUCKET: profileImageBucket.bucketName,
      DELETE_USER_STATE_MACHINE_ARN: deleteUserStateMachineArn,
    };

    // Common Lambda props
    const nodeJsFunctionProps: Partial<lambda.FunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
    };

    // ====== AUTH LAMBDA FUNCTIONS ======

    // Signup
    const signupFn = new NodejsFunction(this, 'SignupFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'auth/signup.ts'),
      handler: 'handler',
      functionName: `${prefix}-auth-signup`,
    });
    tables.users.grantWriteData(signupFn);

    // Confirm
    const confirmFn = new NodejsFunction(this, 'ConfirmFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'auth/confirm.ts'),
      handler: 'handler',
      functionName: `${prefix}-auth-confirm`,
    });

    // Resend Code
    const resendCodeFn = new NodejsFunction(this, 'ResendCodeFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'auth/resend-code.ts'),
      handler: 'handler',
      functionName: `${prefix}-auth-resend-code`,
    });

    // Login
    const loginFn = new NodejsFunction(this, 'LoginFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'auth/login.ts'),
      handler: 'handler',
      functionName: `${prefix}-auth-login`,
    });
    tables.users.grantReadData(loginFn);

    // Refresh
    const refreshFn = new NodejsFunction(this, 'RefreshFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'auth/refresh.ts'),
      handler: 'handler',
      functionName: `${prefix}-auth-refresh`,
    });

    // Forgot Password
    const forgotPasswordFn = new NodejsFunction(this, 'ForgotPasswordFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'auth/forgot-password.ts'),
      handler: 'handler',
      functionName: `${prefix}-auth-forgot-password`,
    });

    // Reset Password
    const resetPasswordFn = new NodejsFunction(this, 'ResetPasswordFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'auth/reset-password.ts'),
      handler: 'handler',
      functionName: `${prefix}-auth-reset-password`,
    });

    // ====== USER LAMBDA FUNCTIONS ======

    // Get Profile
    const getProfileFn = new NodejsFunction(this, 'GetProfileFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'users/get-profile.ts'),
      handler: 'handler',
      functionName: `${prefix}-users-get-profile`,
    });
    tables.users.grantReadData(getProfileFn);
    tables.follows.grantReadData(getProfileFn);
    tables.blocks.grantReadData(getProfileFn);

    // Update Profile
    const updateProfileFn = new NodejsFunction(this, 'UpdateProfileFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'users/update-profile.ts'),
      handler: 'handler',
      functionName: `${prefix}-users-update-profile`,
    });
    tables.users.grantReadWriteData(updateProfileFn);

    // Set App ID
    const setAppIdFn = new NodejsFunction(this, 'SetAppIdFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'users/set-app-id.ts'),
      handler: 'handler',
      functionName: `${prefix}-users-set-app-id`,
    });
    tables.users.grantReadWriteData(setAppIdFn);

    // Search Users
    const searchUsersFn = new NodejsFunction(this, 'SearchUsersFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'users/search-users.ts'),
      handler: 'handler',
      functionName: `${prefix}-users-search`,
    });
    tables.users.grantReadData(searchUsersFn);
    tables.blocks.grantReadData(searchUsersFn);

    // Get Profile Image Upload URL
    const getProfileImageUploadUrlFn = new NodejsFunction(this, 'GetProfileImageUploadUrlFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'users/get-profile-image-upload-url.ts'),
      handler: 'handler',
      functionName: `${prefix}-users-profile-image-upload-url`,
    });
    tables.users.grantReadWriteData(getProfileImageUploadUrlFn);
    profileImageBucket.grantPut(getProfileImageUploadUrlFn);

    // Delete Profile Image
    const deleteProfileImageFn = new NodejsFunction(this, 'DeleteProfileImageFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'users/delete-profile-image.ts'),
      handler: 'handler',
      functionName: `${prefix}-users-delete-profile-image`,
    });
    tables.users.grantReadWriteData(deleteProfileImageFn);
    profileImageBucket.grantDelete(deleteProfileImageFn);

    // Delete Account
    const deleteAccountFn = new NodejsFunction(this, 'DeleteAccountFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'users/delete-account.ts'),
      handler: 'handler',
      functionName: `${prefix}-users-delete-account`,
    });
    tables.users.grantReadData(deleteAccountFn);
    deleteAccountFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [deleteUserStateMachineArn],
    }));

    // ====== QUESTION LAMBDA FUNCTIONS ======

    // Get Daily Question
    const getDailyQuestionFn = new NodejsFunction(this, 'GetDailyQuestionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'questions/get-daily-question.ts'),
      handler: 'handler',
      functionName: `${prefix}-questions-get-daily`,
    });
    tables.dailyQuestions.grantReadData(getDailyQuestionFn);
    tables.questions.grantReadData(getDailyQuestionFn);
    tables.answers.grantReadData(getDailyQuestionFn);

    // List Past Questions
    const listPastQuestionsFn = new NodejsFunction(this, 'ListPastQuestionsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'questions/list-past-questions.ts'),
      handler: 'handler',
      functionName: `${prefix}-questions-list-past`,
    });
    tables.dailyQuestions.grantReadData(listPastQuestionsFn);
    tables.questions.grantReadData(listPastQuestionsFn);

    // ====== ANSWER LAMBDA FUNCTIONS ======

    // Create Answer
    const createAnswerFn = new NodejsFunction(this, 'CreateAnswerFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'answers/create-answer.ts'),
      handler: 'handler',
      functionName: `${prefix}-answers-create`,
    });
    tables.dailyQuestions.grantReadData(createAnswerFn);
    tables.answers.grantReadWriteData(createAnswerFn);

    // Delete Answer
    const deleteAnswerFn = new NodejsFunction(this, 'DeleteAnswerFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'answers/delete-answer.ts'),
      handler: 'handler',
      functionName: `${prefix}-answers-delete`,
    });
    tables.answers.grantReadWriteData(deleteAnswerFn);

    // Restore Answer
    const restoreAnswerFn = new NodejsFunction(this, 'RestoreAnswerFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'answers/restore-answer.ts'),
      handler: 'handler',
      functionName: `${prefix}-answers-restore`,
    });
    tables.answers.grantReadWriteData(restoreAnswerFn);

    // Get Timeline
    const getTimelineFn = new NodejsFunction(this, 'GetTimelineFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'answers/get-timeline.ts'),
      handler: 'handler',
      functionName: `${prefix}-answers-timeline`,
    });
    tables.follows.grantReadData(getTimelineFn);
    tables.blocks.grantReadData(getTimelineFn);
    tables.dailyQuestions.grantReadData(getTimelineFn);
    tables.questions.grantReadData(getTimelineFn);
    tables.answers.grantReadData(getTimelineFn);
    tables.users.grantReadData(getTimelineFn);
    tables.reactions.grantReadData(getTimelineFn);

    // Get User Answers
    const getUserAnswersFn = new NodejsFunction(this, 'GetUserAnswersFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'answers/get-user-answers.ts'),
      handler: 'handler',
      functionName: `${prefix}-answers-user`,
    });
    tables.users.grantReadData(getUserAnswersFn);
    tables.follows.grantReadData(getUserAnswersFn);
    tables.blocks.grantReadData(getUserAnswersFn);
    tables.answers.grantReadData(getUserAnswersFn);
    tables.questions.grantReadData(getUserAnswersFn);
    tables.reactions.grantReadData(getUserAnswersFn);

    // Get My Answers
    const getMyAnswersFn = new NodejsFunction(this, 'GetMyAnswersFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'answers/get-my-answers.ts'),
      handler: 'handler',
      functionName: `${prefix}-answers-me`,
    });
    tables.answers.grantReadData(getMyAnswersFn);
    tables.questions.grantReadData(getMyAnswersFn);

    // ====== REACTION LAMBDA FUNCTIONS ======

    // Add Reaction
    const addReactionFn = new NodejsFunction(this, 'AddReactionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'reactions/add-reaction.ts'),
      handler: 'handler',
      functionName: `${prefix}-reactions-add`,
    });
    tables.answers.grantReadWriteData(addReactionFn);
    tables.reactions.grantReadWriteData(addReactionFn);
    tables.blocks.grantReadData(addReactionFn);

    // Remove Reaction
    const removeReactionFn = new NodejsFunction(this, 'RemoveReactionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'reactions/remove-reaction.ts'),
      handler: 'handler',
      functionName: `${prefix}-reactions-remove`,
    });
    tables.answers.grantReadWriteData(removeReactionFn);
    tables.reactions.grantReadWriteData(removeReactionFn);

    // ====== FOLLOW LAMBDA FUNCTIONS ======

    // Follow User
    const followUserFn = new NodejsFunction(this, 'FollowUserFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'follows/follow-user.ts'),
      handler: 'handler',
      functionName: `${prefix}-follows-follow`,
    });
    tables.users.grantReadData(followUserFn);
    tables.follows.grantReadWriteData(followUserFn);
    tables.blocks.grantReadData(followUserFn);

    // Unfollow User
    const unfollowUserFn = new NodejsFunction(this, 'UnfollowUserFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'follows/unfollow-user.ts'),
      handler: 'handler',
      functionName: `${prefix}-follows-unfollow`,
    });
    tables.follows.grantReadWriteData(unfollowUserFn);

    // Get Followers
    const getFollowersFn = new NodejsFunction(this, 'GetFollowersFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'follows/get-followers.ts'),
      handler: 'handler',
      functionName: `${prefix}-follows-followers`,
    });
    tables.users.grantReadData(getFollowersFn);
    tables.follows.grantReadData(getFollowersFn);
    tables.blocks.grantReadData(getFollowersFn);

    // Get Following
    const getFollowingFn = new NodejsFunction(this, 'GetFollowingFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'follows/get-following.ts'),
      handler: 'handler',
      functionName: `${prefix}-follows-following`,
    });
    tables.users.grantReadData(getFollowingFn);
    tables.follows.grantReadData(getFollowingFn);
    tables.blocks.grantReadData(getFollowingFn);

    // ====== BLOCK LAMBDA FUNCTIONS ======

    // Block User
    const blockUserFn = new NodejsFunction(this, 'BlockUserFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'blocks/block-user.ts'),
      handler: 'handler',
      functionName: `${prefix}-blocks-block`,
    });
    tables.users.grantReadData(blockUserFn);
    tables.blocks.grantReadWriteData(blockUserFn);
    tables.follows.grantReadWriteData(blockUserFn);

    // Unblock User
    const unblockUserFn = new NodejsFunction(this, 'UnblockUserFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'blocks/unblock-user.ts'),
      handler: 'handler',
      functionName: `${prefix}-blocks-unblock`,
    });
    tables.blocks.grantReadWriteData(unblockUserFn);

    // Get Blocks (blocked users list)
    const getBlocksFn = new NodejsFunction(this, 'GetBlocksFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'blocks/get-blocks.ts'),
      handler: 'handler',
      functionName: `${prefix}-blocks-list`,
    });
    tables.blocks.grantReadData(getBlocksFn);
    tables.users.grantReadData(getBlocksFn);

    // ====== REPORT LAMBDA FUNCTIONS ======

    // Create Report
    const createReportFn = new NodejsFunction(this, 'CreateReportFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'reports/create-report.ts'),
      handler: 'handler',
      functionName: `${prefix}-reports-create`,
    });
    tables.users.grantReadData(createReportFn);
    tables.answers.grantReadData(createReportFn);
    tables.reports.grantReadWriteData(createReportFn);

    // ====== PUSH TOKEN LAMBDA FUNCTIONS ======

    // Register Push Token
    const registerPushTokenFn = new NodejsFunction(this, 'RegisterPushTokenFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'push-tokens/register-token.ts'),
      handler: 'handler',
      functionName: `${prefix}-push-tokens-register`,
    });
    tables.pushTokens.grantReadWriteData(registerPushTokenFn);

    // ====== QUESTION SUBMISSION LAMBDA FUNCTIONS ======

    // Submit Question
    const submitQuestionFn = new NodejsFunction(this, 'SubmitQuestionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'questions/submit-question.ts'),
      handler: 'handler',
      functionName: `${prefix}-questions-submit`,
    });
    tables.userQuestionSubmissions.grantReadWriteData(submitQuestionFn);

    // ====== ADMIN LAMBDA FUNCTIONS ======

    // Dashboard Stats
    const getDashboardStatsFn = new NodejsFunction(this, 'GetDashboardStatsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/get-dashboard-stats.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-dashboard-stats`,
    });
    tables.users.grantReadData(getDashboardStatsFn);
    tables.answers.grantReadData(getDashboardStatsFn);
    tables.reports.grantReadData(getDashboardStatsFn);
    tables.userQuestionSubmissions.grantReadData(getDashboardStatsFn);
    tables.dailyQuestions.grantReadData(getDashboardStatsFn);
    tables.questions.grantReadData(getDashboardStatsFn);

    // List NG Words
    const listNgWordsFn = new NodejsFunction(this, 'ListNgWordsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/list-ng-words.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-list-ng-words`,
    });
    tables.ngWords.grantReadData(listNgWordsFn);

    // Add NG Word
    const addNgWordFn = new NodejsFunction(this, 'AddNgWordFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/add-ng-word.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-add-ng-word`,
    });
    tables.ngWords.grantReadWriteData(addNgWordFn);

    // Delete NG Word
    const deleteNgWordFn = new NodejsFunction(this, 'DeleteNgWordFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/delete-ng-word.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-delete-ng-word`,
    });
    tables.ngWords.grantReadWriteData(deleteNgWordFn);

    // Set Daily Question
    const setDailyQuestionFn = new NodejsFunction(this, 'SetDailyQuestionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/set-daily-question.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-set-daily-question`,
    });
    tables.questions.grantReadData(setDailyQuestionFn);
    tables.dailyQuestions.grantReadWriteData(setDailyQuestionFn);

    // List Reports (Admin)
    const listReportsFn = new NodejsFunction(this, 'ListReportsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/list-reports.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-list-reports`,
    });
    tables.reports.grantReadData(listReportsFn);
    tables.users.grantReadData(listReportsFn);

    // Update Report (Admin)
    const updateReportFn = new NodejsFunction(this, 'UpdateReportFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/update-report.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-update-report`,
    });
    tables.reports.grantReadWriteData(updateReportFn);

    // List Question Submissions (Admin)
    const listQuestionSubmissionsFn = new NodejsFunction(this, 'ListQuestionSubmissionsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/list-question-submissions.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-list-question-submissions`,
    });
    tables.userQuestionSubmissions.grantReadData(listQuestionSubmissionsFn);
    tables.users.grantReadData(listQuestionSubmissionsFn);

    // Review Question Submission (Admin)
    const reviewQuestionSubmissionFn = new NodejsFunction(this, 'ReviewQuestionSubmissionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/review-question-submission.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-review-question-submission`,
    });
    tables.userQuestionSubmissions.grantReadWriteData(reviewQuestionSubmissionFn);
    tables.questions.grantReadWriteData(reviewQuestionSubmissionFn);

    // Create Question (Admin)
    const createQuestionFn = new NodejsFunction(this, 'CreateQuestionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/create-question.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-create-question`,
    });
    tables.questions.grantReadWriteData(createQuestionFn);

    // List Questions (Admin)
    const listQuestionsFn = new NodejsFunction(this, 'ListQuestionsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/list-questions.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-list-questions`,
    });
    tables.questions.grantReadData(listQuestionsFn);

    // List Users (Admin)
    const listUsersFn = new NodejsFunction(this, 'ListUsersFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/list-users.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-list-users`,
    });
    tables.users.grantReadData(listUsersFn);

    // Ban User (Admin)
    const banUserFn = new NodejsFunction(this, 'BanUserFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/ban-user.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-ban-user`,
    });
    tables.users.grantReadWriteData(banUserFn);

    // Unban User (Admin)
    const unbanUserFn = new NodejsFunction(this, 'UnbanUserFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/unban-user.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-unban-user`,
    });
    tables.users.grantReadWriteData(unbanUserFn);

    // List Flagged Posts (Admin)
    const listFlaggedPostsFn = new NodejsFunction(this, 'ListFlaggedPostsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/list-flagged-posts.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-list-flagged-posts`,
    });
    tables.answers.grantReadData(listFlaggedPostsFn);
    tables.users.grantReadData(listFlaggedPostsFn);

    // Review Flagged Post (Admin)
    const reviewFlaggedPostFn = new NodejsFunction(this, 'ReviewFlaggedPostFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/review-flagged-post.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-review-flagged-post`,
    });
    tables.answers.grantReadWriteData(reviewFlaggedPostFn);

    // List Admin Logs (Admin)
    const listAdminLogsFn = new NodejsFunction(this, 'ListAdminLogsFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'admin/list-admin-logs.ts'),
      handler: 'handler',
      functionName: `${prefix}-admin-list-logs`,
    });
    tables.adminLogs.grantReadData(listAdminLogsFn);

    // Grant admin logs write access to admin functions
    tables.adminLogs.grantWriteData(addNgWordFn);
    tables.adminLogs.grantWriteData(deleteNgWordFn);
    tables.adminLogs.grantWriteData(createQuestionFn);
    tables.adminLogs.grantWriteData(setDailyQuestionFn);
    tables.adminLogs.grantWriteData(updateReportFn);
    tables.adminLogs.grantWriteData(reviewQuestionSubmissionFn);
    tables.adminLogs.grantWriteData(banUserFn);
    tables.adminLogs.grantWriteData(unbanUserFn);
    tables.adminLogs.grantWriteData(reviewFlaggedPostFn);

    // ====== APP LAMBDA FUNCTIONS ======

    // Check Version (public - no auth required)
    const checkVersionFn = new NodejsFunction(this, 'CheckVersionFunction', {
      ...nodeJsFunctionProps,
      entry: path.join(lambdaDir, 'app/check-version.ts'),
      handler: 'handler',
      functionName: `${prefix}-app-check-version`,
    });

    // REST API
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${prefix}-api`,
      description: 'Q App REST API',
      deployOptions: {
        stageName: 'v1',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Cognito Authorizer (for protected routes)
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: `${prefix}-authorizer`,
    });

    const authorizerOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ====== API ROUTES ======

    // Auth routes (no auth required)
    const authResource = this.api.root.addResource('auth');

    const signupResource = authResource.addResource('signup');
    signupResource.addMethod('POST', new apigateway.LambdaIntegration(signupFn));

    const confirmResource = authResource.addResource('confirm');
    confirmResource.addMethod('POST', new apigateway.LambdaIntegration(confirmFn));

    const resendCodeResource = authResource.addResource('resend-code');
    resendCodeResource.addMethod('POST', new apigateway.LambdaIntegration(resendCodeFn));

    const loginResource = authResource.addResource('login');
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(loginFn));

    const refreshResource = authResource.addResource('refresh');
    refreshResource.addMethod('POST', new apigateway.LambdaIntegration(refreshFn));

    const forgotPasswordResource = authResource.addResource('forgot-password');
    forgotPasswordResource.addMethod('POST', new apigateway.LambdaIntegration(forgotPasswordFn));

    const resetPasswordResource = authResource.addResource('reset-password');
    resetPasswordResource.addMethod('POST', new apigateway.LambdaIntegration(resetPasswordFn));

    // User routes (protected)
    const usersResource = this.api.root.addResource('users');

    // GET /users/search?q=xxx
    const searchUsersResource = usersResource.addResource('search');
    searchUsersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(searchUsersFn),
      authorizerOptions
    );

    // PUT /users/me - Update own profile
    // NOTE: 固定パス 'me' は変数パス '{userId}' より先に定義する必要がある
    const meResource = usersResource.addResource('me');
    meResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateProfileFn),
      authorizerOptions
    );

    // POST /users/me/profile-image - Get presigned URL for profile image upload
    const profileImageResource = meResource.addResource('profile-image');
    profileImageResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(getProfileImageUploadUrlFn),
      authorizerOptions
    );

    // DELETE /users/me/profile-image - Delete profile image
    profileImageResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteProfileImageFn),
      authorizerOptions
    );

    // PUT /users/me/app-id - Set app ID (one time only)
    const appIdResource = meResource.addResource('app-id');
    appIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(setAppIdFn),
      authorizerOptions
    );

    // DELETE /users/me - Delete account
    meResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteAccountFn),
      authorizerOptions
    );

    // GET /users/me/blocks - Get blocked users list
    const blocksResource = meResource.addResource('blocks');
    blocksResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getBlocksFn),
      authorizerOptions
    );

    // GET /users/{userId} - Get user profile (use 'me' for self)
    const userByIdResource = usersResource.addResource('{userId}');
    userByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProfileFn),
      authorizerOptions
    );

    // GET /users/{userId}/answers - Get user's answers
    const userAnswersResource = userByIdResource.addResource('answers');
    userAnswersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getUserAnswersFn),
      authorizerOptions
    );

    // GET /users/{userId}/followers - Get user's followers
    const userFollowersResource = userByIdResource.addResource('followers');
    userFollowersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getFollowersFn),
      authorizerOptions
    );

    // GET /users/{userId}/following - Get user's following
    const userFollowingResource = userByIdResource.addResource('following');
    userFollowingResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getFollowingFn),
      authorizerOptions
    );

    // POST /users/{userId}/follow - Follow user
    const followResource = userByIdResource.addResource('follow');
    followResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(followUserFn),
      authorizerOptions
    );

    // DELETE /users/{userId}/follow - Unfollow user
    followResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(unfollowUserFn),
      authorizerOptions
    );

    // POST /users/{userId}/block - Block user
    const blockResource = userByIdResource.addResource('block');
    blockResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(blockUserFn),
      authorizerOptions
    );

    // DELETE /users/{userId}/block - Unblock user
    blockResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(unblockUserFn),
      authorizerOptions
    );

    // Question routes (protected)
    const questionsResource = this.api.root.addResource('questions');

    // GET /questions/today - Get today's question
    const todayQuestionResource = questionsResource.addResource('today');
    todayQuestionResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getDailyQuestionFn),
      authorizerOptions
    );

    // GET /questions/past - Get past questions
    const pastQuestionsResource = questionsResource.addResource('past');
    pastQuestionsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listPastQuestionsFn),
      authorizerOptions
    );

    // Answer routes (protected)
    const answersResource = this.api.root.addResource('answers');

    // POST /answers - Create answer
    answersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createAnswerFn),
      authorizerOptions
    );

    // GET /answers/timeline - Get timeline
    const timelineResource = answersResource.addResource('timeline');
    timelineResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getTimelineFn),
      authorizerOptions
    );

    // GET /answers/me - Get my answers
    const myAnswersResource = answersResource.addResource('me');
    myAnswersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getMyAnswersFn),
      authorizerOptions
    );

    // DELETE /answers/{answerId} - Delete answer
    const answerByIdResource = answersResource.addResource('{answerId}');
    answerByIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteAnswerFn),
      authorizerOptions
    );

    // POST /answers/{answerId}/reaction - Add reaction
    const reactionResource = answerByIdResource.addResource('reaction');
    reactionResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(addReactionFn),
      authorizerOptions
    );

    // DELETE /answers/{answerId}/reaction - Remove reaction
    reactionResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(removeReactionFn),
      authorizerOptions
    );

    // POST /answers/{answerId}/restore - Restore deleted answer
    const restoreResource = answerByIdResource.addResource('restore');
    restoreResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(restoreAnswerFn),
      authorizerOptions
    );

    // Report routes (protected)
    const reportsResource = this.api.root.addResource('reports');

    // POST /reports - Create report
    reportsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createReportFn),
      authorizerOptions
    );

    // Push token routes (protected)
    const pushTokensResource = this.api.root.addResource('push-tokens');

    // POST /push-tokens - Register push token
    pushTokensResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(registerPushTokenFn),
      authorizerOptions
    );

    // Question submission routes (protected)
    // POST /questions/submit - Submit question suggestion
    const submitQuestionResource = questionsResource.addResource('submit');
    submitQuestionResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(submitQuestionFn),
      authorizerOptions
    );

    // Admin routes (protected - should be restricted to admin users in production)
    const adminResource = this.api.root.addResource('admin');

    // Dashboard Stats
    const dashboardResource = adminResource.addResource('dashboard');
    dashboardResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getDashboardStatsFn),
      authorizerOptions
    );

    // NG Words
    const ngWordsResource = adminResource.addResource('ng-words');
    ngWordsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listNgWordsFn),
      authorizerOptions
    );
    ngWordsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(addNgWordFn),
      authorizerOptions
    );
    const ngWordByIdResource = ngWordsResource.addResource('{wordId}');
    ngWordByIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteNgWordFn),
      authorizerOptions
    );

    // Questions (Admin)
    const adminQuestionsResource = adminResource.addResource('questions');
    adminQuestionsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listQuestionsFn),
      authorizerOptions
    );
    adminQuestionsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createQuestionFn),
      authorizerOptions
    );

    // Daily Question (Admin)
    const dailyQuestionResource = adminResource.addResource('daily-question');
    dailyQuestionResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(setDailyQuestionFn),
      authorizerOptions
    );

    // Reports (Admin)
    const adminReportsResource = adminResource.addResource('reports');
    adminReportsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listReportsFn),
      authorizerOptions
    );
    const adminReportByIdResource = adminReportsResource.addResource('{reportId}');
    adminReportByIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateReportFn),
      authorizerOptions
    );

    // Question Submissions (Admin)
    const submissionsResource = adminResource.addResource('submissions');
    submissionsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listQuestionSubmissionsFn),
      authorizerOptions
    );
    const submissionByIdResource = submissionsResource.addResource('{submissionId}');
    submissionByIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(reviewQuestionSubmissionFn),
      authorizerOptions
    );

    // Users (Admin)
    const adminUsersResource = adminResource.addResource('users');
    adminUsersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listUsersFn),
      authorizerOptions
    );
    const adminUserByIdResource = adminUsersResource.addResource('{userId}');
    const banResource = adminUserByIdResource.addResource('ban');
    banResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(banUserFn),
      authorizerOptions
    );
    banResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(unbanUserFn),
      authorizerOptions
    );

    // Flagged Posts (Admin)
    const flaggedPostsResource = adminResource.addResource('flagged-posts');
    flaggedPostsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listFlaggedPostsFn),
      authorizerOptions
    );
    const flaggedPostByIdResource = flaggedPostsResource.addResource('{answerId}');
    flaggedPostByIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(reviewFlaggedPostFn),
      authorizerOptions
    );

    // Admin Logs (Admin)
    const adminLogsResource = adminResource.addResource('logs');
    adminLogsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listAdminLogsFn),
      authorizerOptions
    );

    // App routes (public - no auth required)
    const appResource = this.api.root.addResource('app');

    // GET /app/version - Check app version (for force update)
    const versionResource = appResource.addResource('version');
    versionResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(checkVersionFn)
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      exportName: `${prefix}-api-url`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      exportName: `${prefix}-api-id`,
    });
  }
}
