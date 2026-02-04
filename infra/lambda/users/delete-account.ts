import { APIGatewayProxyHandler } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, TABLES } from '../common/dynamodb';
import { success, unauthorized, serverError } from '../common/response';

const sfnClient = new SFNClient({});
const STATE_MACHINE_ARN = process.env.DELETE_USER_STATE_MACHINE_ARN!;

interface User {
  userId: string;
  username: string;
  email: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    // Get user data
    const user = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
    });

    if (!user) {
      return unauthorized('User not found');
    }

    // Start the deletion workflow
    const executionName = `delete-user-${authUser.userId}-${Date.now()}`;

    await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        name: executionName,
        input: JSON.stringify({
          userId: authUser.userId,
          username: user.username,
          email: user.email,
        }),
      })
    );

    console.log(`Started account deletion workflow: ${executionName}`);

    return success({
      message: 'Account deletion initiated. Your account will be deleted shortly.',
      executionName,
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return serverError('Failed to initiate account deletion');
  }
};
