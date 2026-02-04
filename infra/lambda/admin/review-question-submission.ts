import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, putItem, updateItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, notFound, serverError } from '../common/response';
import { v4 as uuidv4 } from 'uuid';

interface ReviewSubmissionRequest {
  status: 'approved' | 'rejected';
  modifiedText?: string;
  category?: string;
}

interface QuestionSubmission {
  submissionId: string;
  text: string;
  category?: string;
  status: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const submissionId = event.pathParameters?.submissionId;
    if (!submissionId) {
      return validationError('submissionId is required');
    }

    const body: ReviewSubmissionRequest = JSON.parse(event.body || '{}');

    if (!body.status) {
      return validationError('status is required');
    }

    if (!['approved', 'rejected'].includes(body.status)) {
      return validationError('status must be "approved" or "rejected"');
    }

    // Get submission
    const submission = await getItem<QuestionSubmission>({
      TableName: TABLES.USER_QUESTION_SUBMISSIONS,
      Key: { submissionId },
    });

    if (!submission) {
      return notFound('Submission not found');
    }

    const timestamp = now();
    let questionId: string | null = null;

    // If approved, create a question
    if (body.status === 'approved') {
      questionId = uuidv4();

      await putItem({
        TableName: TABLES.QUESTIONS,
        Item: {
          questionId,
          text: body.modifiedText || submission.text,
          category: body.category || submission.category || null,
          sourceSubmissionId: submissionId,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });
    }

    // Update submission status
    await updateItem({
      TableName: TABLES.USER_QUESTION_SUBMISSIONS,
      Key: { submissionId },
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': body.status,
        ':updatedAt': timestamp,
      },
    });

    return success({
      message: `Submission ${body.status}`,
      questionId,
    });
  } catch (err) {
    console.error('Review question submission error:', err);
    return serverError('Failed to review submission');
  }
};
