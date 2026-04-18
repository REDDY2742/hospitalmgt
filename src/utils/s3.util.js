const { 
  S3Client, 
  PutObjectCommand, 
  GetSignedUrlCommand, 
  DeleteObjectCommand, 
  CopyObjectCommand, 
  ListObjectsV2Command, 
  HeadObjectCommand 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('./logger.util').createChildLogger('S3_STORAGE');

/**
 * Hospital Cloud Storage (S3) Utility
 * 
 * Manages medical document archiving, pre-signed clinical record access, 
 * and HIPAA-compliant asset lifecycle management.
 */

// Initialized from centralized AWS configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const uploadFile = async (fileBuffer, key, bucket, options = {}) => {
  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: options.contentType,
    ServerSideEncryption: 'AES256',
    Metadata: {
      uploadedBy: options.userId || 'SYSTEM',
      module: options.module || 'UNKNOWN',
      environment: process.env.NODE_ENV
    }
  };

  try {
    const startTime = Date.now();
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    logger.info(`UPLOAD_SUCCESS | Key: ${key} | Duration: ${Date.now() - startTime}ms`);
    
    return {
      key,
      bucket,
      url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      etag: result.ETag,
      versionId: result.VersionId
    };
  } catch (error) {
    logger.error(`UPLOAD_FAILURE | Key: ${key} | Error: ${error.message}`);
    throw error;
  }
};

const getSignedUrlForGet = async (key, bucket, expiresIn = 900) => {
  const command = new GetSignedUrlCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

const deleteFile = async (key, bucket) => {
  try {
    if (process.env.SOFT_DELETE_S3 === 'true') {
      const archiveBucket = process.env.AWS_S3_ARCHIVE_BUCKET;
      await s3Client.send(new CopyObjectCommand({
        Bucket: archiveBucket,
        CopySource: `${bucket}/${key}`,
        Key: `deleted/${Date.now()}_${key}`
      }));
    }

    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    logger.info(`DELETE_SUCCESS | Key: ${key} | Soft: ${process.env.SOFT_DELETE_S3}`);
    return true;
  } catch (error) {
    logger.error(`DELETE_FAILURE | Key: ${key} | Error: ${error.message}`);
    return false;
  }
};

const generateUploadPresignedUrl = async (key, bucket, contentType, expiresIn = 600) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return { uploadUrl, key, expiresAt: new Date(Date.now() + expiresIn * 1000) };
};

const listFiles = async (prefix, bucket, maxKeys = 100, continuationToken = null) => {
  const result = await s3Client.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken
  }));

  return {
    items: result.Contents?.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag
    })) || [],
    nextContinuationToken: result.NextContinuationToken
  };
};

module.exports = {
  uploadFile,
  getSignedUrl: getSignedUrlForGet,
  deleteFile,
  generateUploadPresignedUrl,
  listFiles,
  getFileMetadata: async (key, bucket) => {
    const result = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      contentType: result.ContentType,
      size: result.ContentLength,
      lastModified: result.LastModified,
      metadata: result.Metadata,
      etag: result.ETag
    };
  },
  moveFile: async (srcKey, srcBucket, destKey, destBucket) => {
    await s3Client.send(new CopyObjectCommand({
      Bucket: destBucket,
      CopySource: `${srcBucket}/${srcKey}`,
      Key: destKey
    }));
    await s3Client.send(new DeleteObjectCommand({ Bucket: srcBucket, Key: srcKey }));
    logger.info(`MOVE_SUCCESS | From: ${srcKey} | To: ${destKey}`);
  }
};
