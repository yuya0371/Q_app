import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  QueryCommandInput,
  ScanCommandInput,
  BatchGetCommandInput,
  BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table names from environment
export const TABLES = {
  USERS: process.env.USERS_TABLE!,
  QUESTIONS: process.env.QUESTIONS_TABLE!,
  ANSWERS: process.env.ANSWERS_TABLE!,
  REACTIONS: process.env.REACTIONS_TABLE!,
  FOLLOWS: process.env.FOLLOWS_TABLE!,
  BLOCKS: process.env.BLOCKS_TABLE!,
  REPORTS: process.env.REPORTS_TABLE!,
  NG_WORDS: process.env.NG_WORDS_TABLE!,
  DAILY_QUESTIONS: process.env.DAILY_QUESTIONS_TABLE!,
  USER_QUESTION_SUBMISSIONS: process.env.USER_QUESTION_SUBMISSIONS_TABLE!,
  PUSH_TOKENS: process.env.PUSH_TOKENS_TABLE!,
};

// Helper functions
export async function getItem<T>(params: GetCommandInput): Promise<T | null> {
  const result = await docClient.send(new GetCommand(params));
  return (result.Item as T) || null;
}

export async function putItem(params: PutCommandInput): Promise<void> {
  await docClient.send(new PutCommand(params));
}

export async function updateItem(params: UpdateCommandInput): Promise<void> {
  await docClient.send(new UpdateCommand(params));
}

export async function deleteItem(params: DeleteCommandInput): Promise<void> {
  await docClient.send(new DeleteCommand(params));
}

export async function queryItems<T>(params: QueryCommandInput): Promise<T[]> {
  const result = await docClient.send(new QueryCommand(params));
  return (result.Items as T[]) || [];
}

export async function scanItems<T>(params: ScanCommandInput): Promise<T[]> {
  const result = await docClient.send(new ScanCommand(params));
  return (result.Items as T[]) || [];
}

export async function batchGetItems<T>(params: BatchGetCommandInput): Promise<T[]> {
  const result = await docClient.send(new BatchGetCommand(params));
  const responses = result.Responses || {};
  return Object.values(responses).flat() as T[];
}

export async function batchWriteItems(params: BatchWriteCommandInput): Promise<void> {
  await docClient.send(new BatchWriteCommand(params));
}

// Generate ISO timestamp
export function now(): string {
  return new Date().toISOString();
}

// Generate date string (YYYY-MM-DD) in JST
export function todayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split('T')[0];
}
