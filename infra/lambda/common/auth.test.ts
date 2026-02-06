import { APIGatewayProxyEvent } from 'aws-lambda';
import { getAuthenticatedUser, getUserIdFromPath } from './auth';

const createMockEvent = (
  claims?: Record<string, string>,
  pathParameters?: Record<string, string>
): APIGatewayProxyEvent => {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/test',
    pathParameters: pathParameters || null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      authorizer: claims ? { claims } : null,
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test',
        userArn: null,
      },
      path: '/test',
      stage: 'test',
      requestId: 'test-request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test',
      resourcePath: '/test',
    },
    resource: '/test',
  };
};

describe('getAuthenticatedUser', () => {
  test('認証済みユーザーの情報を取得', () => {
    const event = createMockEvent({
      sub: 'user-123',
      email: 'test@example.com',
      'cognito:username': 'testuser',
    });

    const user = getAuthenticatedUser(event);

    expect(user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    });
  });

  test('cognito:usernameがない場合はemailを使用', () => {
    const event = createMockEvent({
      sub: 'user-123',
      email: 'test@example.com',
    });

    const user = getAuthenticatedUser(event);

    expect(user?.username).toBe('test@example.com');
  });

  test('authorizerがnullの場合はnullを返す', () => {
    const event = createMockEvent();

    const user = getAuthenticatedUser(event);

    expect(user).toBeNull();
  });

  test('claimsが空の場合はnullを返す', () => {
    const event: APIGatewayProxyEvent = {
      ...createMockEvent(),
      requestContext: {
        ...createMockEvent().requestContext,
        authorizer: {},
      },
    };

    const user = getAuthenticatedUser(event);

    expect(user).toBeNull();
  });
});

describe('getUserIdFromPath', () => {
  test('pathParametersからuserIdを取得', () => {
    const event = createMockEvent(undefined, { userId: 'user-456' });

    const userId = getUserIdFromPath(event);

    expect(userId).toBe('user-456');
  });

  test('meの場合は認証済みユーザーのIDを返す', () => {
    const event = createMockEvent(
      {
        sub: 'user-123',
        email: 'test@example.com',
      },
      { userId: 'me' }
    );

    const userId = getUserIdFromPath(event);

    expect(userId).toBe('user-123');
  });

  test('meで未認証の場合はnullを返す', () => {
    const event = createMockEvent(undefined, { userId: 'me' });

    const userId = getUserIdFromPath(event);

    expect(userId).toBeNull();
  });

  test('pathParametersがない場合はnullを返す', () => {
    const event = createMockEvent();

    const userId = getUserIdFromPath(event);

    expect(userId).toBeNull();
  });

  test('userIdがない場合はnullを返す', () => {
    const event = createMockEvent(undefined, { otherId: 'test' });

    const userId = getUserIdFromPath(event);

    expect(userId).toBeNull();
  });
});
