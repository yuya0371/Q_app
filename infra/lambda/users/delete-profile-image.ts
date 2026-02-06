import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getAuthenticatedUser } from '../common/auth';
import { getItem, updateItem, TABLES, now } from '../common/dynamodb';
import { success, notFound, unauthorized, serverError } from '../common/response';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.PROFILE_IMAGE_BUCKET!;

interface User {
  userId: string;
  profileImageUrl?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authUser = getAuthenticatedUser(event);
    if (!authUser) {
      return unauthorized();
    }

    // Get current user profile
    const user = await getItem<User>({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
    });

    if (!user) {
      return notFound('User not found');
    }

    // Check if user has a profile image
    if (!user.profileImageUrl) {
      return success({ message: 'No profile image to delete' });
    }

    // Extract the S3 key from the URL
    const url = new URL(user.profileImageUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    // Delete from S3
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      // Continue even if S3 delete fails - we still want to clear the URL from DB
    }

    // Update user profile to remove the image URL
    await updateItem({
      TableName: TABLES.USERS,
      Key: { userId: authUser.userId },
      UpdateExpression: 'REMOVE profileImageUrl SET updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':updatedAt': now(),
      },
    });

    return success({ message: 'Profile image deleted successfully' });
  } catch (err) {
    console.error('Delete profile image error:', err);
    return serverError('Failed to delete profile image');
  }
};
