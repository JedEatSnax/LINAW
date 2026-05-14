// Minimal stub for R2 storage so backend can load during local development/tests.
// Real implementation (Cloudflare R2) is out-of-scope for Phase 3.


/*
  TODO:
  - [x] Implement the R2StorageDao class to handle interactions with R2 storage.
  - [x] Integrate the R2StorageDao with the existing storage management system.
  - [x] Ensure that the R2StorageDao can upload and delete objects in R2 storage as needed.
  - [x] Add error handling and logging to the R2StorageDao for better debugging and monitoring.
  - [ ] Write unit tests for the R2StorageDao to validate its functionality and reliability.
*/

const { 
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { r2Client, bucketName } = require('../../config/r2Client');
class R2StorageDao {
async upload({key, buffer, contentType, metadata = {} }) {
    try {
      if (!key) {
        throw new Error('Key is required for uploading an object to R2 storage.');
      }

      if (!buffer) {
        throw new Error('Buffer is required for uploading an object to R2 storage.');
      }

      await r2Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata
      }));

      return {
        objectKey: key,
        bucketName: bucketName,
        contentType: contentType,
      }
    } catch (error) {
      console.error('[R2ObjectStorageDao] Error uploading object to R2 storage:', {
        key,
        contentType,
        error: error.message,
      });
      throw error;
    }
  } 

  async delete({ objectKey }) {
    try {
      if (!objectKey) {
        throw new Error('Object key is required for deleting an object from R2 storage.');
      }

      await r2Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey
      }));

      return {
        objectKey: objectKey,
        bucketName: bucketName
      };
    } catch (error) {
      console.error('[R2ObjectStorageDao] Error deleting object from R2 storage:', {
        objectKey,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new R2StorageDao();
