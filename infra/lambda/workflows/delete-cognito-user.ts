import { Handler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminUserGlobalSignOutCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

interface DeleteCognitoUserEvent {
  userId: string;
  username: string;
}

interface DeleteCognitoUserResult {
  userId: string;
  cognitoDeleted: boolean;
}

export const handler: Handler<DeleteCognitoUserEvent, DeleteCognitoUserResult> = async (event) => {
  const { userId, username } = event;
  console.log(`Deleting Cognito user: ${username} (${userId})`);

  try {
    // Sign out the user globally
    await cognitoClient.send(
      new AdminUserGlobalSignOutCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );
    console.log(`User ${username} signed out globally`);
  } catch (err: any) {
    // Ignore if user is not signed in
    if (err.name !== 'UserNotFoundException') {
      console.warn('Error signing out user:', err);
    }
  }

  try {
    // Delete the user from Cognito
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );
    console.log(`User ${username} deleted from Cognito`);
  } catch (err: any) {
    if (err.name === 'UserNotFoundException') {
      console.log('User already deleted from Cognito');
    } else {
      throw err;
    }
  }

  return {
    userId,
    cognitoDeleted: true,
  };
};
