import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminGetUserCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

export interface SignUpParams {
  email: string;
  password: string;
  birthDate: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export async function signUp(params: SignUpParams): Promise<string> {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: params.email,
    Password: params.password,
    UserAttributes: [
      { Name: 'email', Value: params.email },
      { Name: 'custom:birthDate', Value: params.birthDate },
    ],
  });

  const result = await client.send(command);
  return result.UserSub!;
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });

  await client.send(command);
}

export async function resendConfirmationCode(email: string): Promise<void> {
  const command = new ResendConfirmationCodeCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });

  await client.send(command);
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const result = await client.send(command);
  const authResult = result.AuthenticationResult!;

  return {
    accessToken: authResult.AccessToken!,
    refreshToken: authResult.RefreshToken!,
    idToken: authResult.IdToken!,
    expiresIn: authResult.ExpiresIn!,
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthResult> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  const result = await client.send(command);
  const authResult = result.AuthenticationResult!;

  return {
    accessToken: authResult.AccessToken!,
    refreshToken: refreshToken, // Refresh token is not returned, use the same one
    idToken: authResult.IdToken!,
    expiresIn: authResult.ExpiresIn!,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const command = new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });

  await client.send(command);
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });

  await client.send(command);
}

export async function getUserByEmail(email: string) {
  const command = new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
  });

  return client.send(command);
}
