import { APIGatewayProxyHandler } from 'aws-lambda';
import { getItem, updateItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, notFound, serverError } from '../common/response';

interface UpdateReportRequest {
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
}

const VALID_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const reportId = event.pathParameters?.reportId;
    if (!reportId) {
      return validationError('reportId is required');
    }

    const body: UpdateReportRequest = JSON.parse(event.body || '{}');

    if (!body.status) {
      return validationError('status is required');
    }

    if (!VALID_STATUSES.includes(body.status)) {
      return validationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Check if report exists
    const existing = await getItem({
      TableName: TABLES.REPORTS,
      Key: { reportId },
    });

    if (!existing) {
      return notFound('Report not found');
    }

    // Build update expression
    const updateExpressions = ['#status = :status', '#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status',
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ':status': body.status,
      ':updatedAt': now(),
    };

    if (body.adminNotes !== undefined) {
      updateExpressions.push('#adminNotes = :adminNotes');
      expressionAttributeNames['#adminNotes'] = 'adminNotes';
      expressionAttributeValues[':adminNotes'] = body.adminNotes;
    }

    await updateItem({
      TableName: TABLES.REPORTS,
      Key: { reportId },
      UpdateExpression: 'SET ' + updateExpressions.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    return success({
      message: 'Report updated successfully',
    });
  } catch (err) {
    console.error('Update report error:', err);
    return serverError('Failed to update report');
  }
};
