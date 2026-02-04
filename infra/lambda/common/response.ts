import { APIGatewayProxyResult } from 'aws-lambda';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function success<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ data }),
  };
}

export function error(
  message: string,
  statusCode = 400,
  code?: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      error: {
        message,
        code: code || 'ERROR',
      },
    }),
  };
}

export function validationError(message: string): APIGatewayProxyResult {
  return error(message, 400, 'VALIDATION_ERROR');
}

export function notFound(message = 'Not found'): APIGatewayProxyResult {
  return error(message, 404, 'NOT_FOUND');
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResult {
  return error(message, 401, 'UNAUTHORIZED');
}

export function forbidden(message = 'Forbidden'): APIGatewayProxyResult {
  return error(message, 403, 'FORBIDDEN');
}

export function conflict(message = 'Conflict'): APIGatewayProxyResult {
  return error(message, 409, 'CONFLICT');
}

export function serverError(message = 'Internal server error'): APIGatewayProxyResult {
  return error(message, 500, 'SERVER_ERROR');
}
