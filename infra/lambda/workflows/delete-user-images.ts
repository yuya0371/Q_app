import { Handler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.PROFILE_IMAGE_BUCKET!;

interface DeleteUserImagesEvent {
  userId: string;
}

interface DeleteUserImagesResult {
  userId: string;
  deletedImages: number;
}

export const handler: Handler<DeleteUserImagesEvent, DeleteUserImagesResult> = async (event) => {
  const { userId } = event;
  console.log(`Deleting user images for: ${userId}`);

  const prefix = `profiles/${userId}/`;
  let deletedImages = 0;

  try {
    // List all objects with the user's prefix
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })
    );

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const objectsToDelete = listResponse.Contents.map((obj) => ({
        Key: obj.Key!,
      }));

      // Delete all objects
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: objectsToDelete,
          },
        })
      );

      deletedImages = objectsToDelete.length;
      console.log(`Deleted ${deletedImages} images for user ${userId}`);
    } else {
      console.log(`No images found for user ${userId}`);
    }
  } catch (err) {
    console.error('Error deleting user images:', err);
    // Don't fail the workflow if image deletion fails
  }

  return {
    userId,
    deletedImages,
  };
};
