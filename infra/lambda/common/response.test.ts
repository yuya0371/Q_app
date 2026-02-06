import {
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  serverError,
  corsHeaders,
} from './response';

describe('corsHeaders', () => {
  test('必要なCORSヘッダーが含まれている', () => {
    expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*');
    expect(corsHeaders['Access-Control-Allow-Headers']).toBe('Content-Type,Authorization');
    expect(corsHeaders['Access-Control-Allow-Methods']).toBe('GET,POST,PUT,DELETE,OPTIONS');
  });
});

describe('success', () => {
  test('デフォルトで200を返す', () => {
    const result = success({ message: 'OK' });
    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual(corsHeaders);
  });

  test('カスタムステータスコード', () => {
    const result = success({ id: '123' }, 201);
    expect(result.statusCode).toBe(201);
  });

  test('dataプロパティでラップされる', () => {
    const result = success({ foo: 'bar' });
    const body = JSON.parse(result.body);
    expect(body).toEqual({ data: { foo: 'bar' } });
  });

  test('配列データ', () => {
    const result = success([1, 2, 3]);
    const body = JSON.parse(result.body);
    expect(body).toEqual({ data: [1, 2, 3] });
  });

  test('nullデータ', () => {
    const result = success(null);
    const body = JSON.parse(result.body);
    expect(body).toEqual({ data: null });
  });
});

describe('error', () => {
  test('デフォルトで400とERRORコード', () => {
    const result = error('Something went wrong');
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Something went wrong');
    expect(body.error.code).toBe('ERROR');
  });

  test('カスタムステータスコードとエラーコード', () => {
    const result = error('Not found', 404, 'NOT_FOUND');
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('CORSヘッダーが含まれる', () => {
    const result = error('Error');
    expect(result.headers).toEqual(corsHeaders);
  });
});

describe('validationError', () => {
  test('400 VALIDATION_ERRORを返す', () => {
    const result = validationError('Invalid input');
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Invalid input');
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('notFound', () => {
  test('デフォルトメッセージ', () => {
    const result = notFound();
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Not found');
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('カスタムメッセージ', () => {
    const result = notFound('User not found');
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('User not found');
  });
});

describe('unauthorized', () => {
  test('デフォルトメッセージ', () => {
    const result = unauthorized();
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Unauthorized');
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('カスタムメッセージ', () => {
    const result = unauthorized('Token expired');
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Token expired');
  });
});

describe('forbidden', () => {
  test('デフォルトメッセージ', () => {
    const result = forbidden();
    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Forbidden');
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('カスタムメッセージ', () => {
    const result = forbidden('Access denied');
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Access denied');
  });
});

describe('conflict', () => {
  test('デフォルトメッセージ', () => {
    const result = conflict();
    expect(result.statusCode).toBe(409);
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Conflict');
    expect(body.error.code).toBe('CONFLICT');
  });

  test('カスタムメッセージ', () => {
    const result = conflict('Already exists');
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Already exists');
  });
});

describe('serverError', () => {
  test('デフォルトメッセージ', () => {
    const result = serverError();
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.code).toBe('SERVER_ERROR');
  });

  test('カスタムメッセージ', () => {
    const result = serverError('Database connection failed');
    const body = JSON.parse(result.body);
    expect(body.error.message).toBe('Database connection failed');
  });
});
