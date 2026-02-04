import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAuthenticatedUser } from '../common/auth';
import { updateItem, TABLES, now } from '../common/dynamodb';
import { success, validationError, unauthorized, serverError } from '../common/response';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.PROFILE_IMAGE_BUCKET!;
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadUrlRequest {
  contentType: string;
  fileName: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    const body: UploadUrlRequest = JSON.parse(event.body || '{}');

    if (!body.contentType || !body.fileName) {
      return validationError('contentType and fileName are required');
    }

    if (!ALLOWED_CONTENT_TYPES.includes(body.contentType)) {
      return validationError('Invalid content type. Allowed: jpeg, png, webp');
    }

    // Generate unique file key
    const extension = body.fileName.split('.').pop() || 'jpg';
    const key = `profiles/${authUser.userId}/${Date.now()}.${extension}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    // Update user profile with new image URL
    await updateItem({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
      UpdateExpression: 'SET profileImageUrl = :url, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':url': imageUrl,
        ':updatedAt': now(),
      },
    });

    return success({
      uploadUrl,
      imageUrl,
      expiresIn: 300,
    });
  } catch (err) {
    console.error('Get upload URL error:', err);
    return serverError('Failed to generate upload URL');
  }
};
