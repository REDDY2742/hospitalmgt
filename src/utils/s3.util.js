const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');
const sharp = require('sharp');
const { fileTypeFromBuffer } = require('file-type');
const logger = require('./logger.util').createChildLogger('cloud-storage-util');

/**
 * Hospital Management System - HIPAA-Compliant S3 Orchestration Engine
 * 
 * Provides production-grade object storage for clinical records and PII.
 * Features: AES-256 server-side encryption, multipart medical record uploads, 
 * pre-signed telemedicine recordings, and WebP clinical image optimization.
 */

// --- Constants & Folders ---

const S3_FOLDERS = {
  PATIENTS: { PHOTOS: 'patients/photos/', DOCUMENTS: 'patients/documents/' },
  MEDICAL: { PRESCRIPTIONS: 'medical/prescriptions/', RECORDS: 'medical/records/', LAB_REPORTS: 'medical/lab-reports/' },
  STAFF: { PHOTOS: 'staff/photos/', PAYSLIPS: 'staff/payslips/' },
  REPORTS: { GENERATED: 'reports/generated/' }
};

const BUCKET = process.env.AWS_S3_BUCKET_MAIN || 'hms-clinical-records';

// --- Client Singleton ---

let s3Client;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }
  return s3Client;
};

// --- Core Upload Functions ---

/**
 * @description Uploads a file with mandatory HIPAA-compliant AES-256 encryption
 */
const uploadFile = async (fileBuffer, key, options = {}) => {
  const client = getS3Client();
  const { contentType = 'application/octet-stream', metadata = {} } = options;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: { ...metadata, uploadedAt: new Date().toISOString() },
      ServerSideEncryption: 'AES256' // Mandated by HIPAA security guidelines
    });

    const result = await client.send(command);
    logger.info(`S3_UPLOAD_SUCCESS: Key ${key} | ETag: ${result.ETag}`);
    
    return {
      key,
      bucket: BUCKET,
      url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      etag: result.ETag
    };
  } catch (err) {
    logger.error(`S3_UPLOAD_FAILURE: Key ${key}`, err);
    throw new Error('CLOUD_STORAGE_UPLOAD_ERROR');
  }
};

/**
 * @description Handles high-concurrency multipart uploads for large clinical telemetry or MRI files
 */
const uploadMultipart = async (stream, key, options = {}) => {
  const client = getS3Client();
  try {
    const upload = new Upload({
      client,
      params: {
        Bucket: BUCKET,
        Key: key,
        Body: stream,
        ContentType: options.contentType,
        ServerSideEncryption: 'AES256'
      },
      partSize: 10 * 1024 * 1024, // 10MB parts
      leavePartsOnError: false
    });

    const result = await upload.done();
    return { key, url: result.Location };
  } catch (err) {
    logger.error('S3_MULTIPART_FAILURE', err);
    throw err;
  }
};

// --- specialized Clinical Helpers ---

/**
 * @description Optimized Patient Photo upload with WebP conversion and resizing
 */
const uploadPatientPhoto = async (imageBuffer, patientId) => {
  // Resize to standard 300x300 for ID cards/portals
  const processed = await sharp(imageBuffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `${S3_FOLDERS.PATIENTS.PHOTOS}${patientId}/${Date.now()}.webp`;
  return await uploadFile(processed, key, { contentType: 'image/webp' });
};

// --- Download & Access ---

/**
 * @description Generates a secure pre-signed URL for restricted PHI access
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  
  try {
    const url = await getSignedUrl(client, command, { expiresIn });
    return { url, expiresAt: Date.now() + (expiresIn * 1000) };
  } catch (err) {
    logger.error('S3_PRESIGN_FAILURE', err);
    throw new Error('URL_GENERATION_FAILED');
  }
};

/**
 * @description Streams a large medical file directly into an Express response
 */
const streamFileToResponse = async (key, res) => {
  const client = getS3Client();
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const response = await client.send(command);
    
    res.setHeader('Content-Type', response.ContentType);
    res.setHeader('Content-Length', response.ContentLength);
    response.Body.pipe(res);
  } catch (err) {
    logger.error('S3_STREAM_FAILURE', err);
    res.status(404).send('File not found');
  }
};

// --- Management Functions ---

/**
 * @description HIPAA-Compliant Soft Delete: Moves clinical file to archive prefix
 */
const softDeleteFile = async (key) => {
  const archiveKey = `archive/${key}`;
  const client = getS3Client();

  try {
    await client.send(new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${key}`,
      Key: archiveKey
    }));

    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return { archived: true, key: archiveKey };
  } catch (err) {
    logger.error('S3_ARCHIVE_FAILURE', err);
    throw err;
  }
};

const fileExists = async (key) => {
  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * @description Uploads base64 data (e.g., from frontend signatures)
 */
const uploadBase64 = async (base64Str, key, options = {}) => {
  const matches = base64Str.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches) throw new Error('INVALID_BASE64_FORMAT');
  const buffer = Buffer.from(matches[2], 'base64');
  return await uploadFile(buffer, key, { ...options, contentType: matches[1] });
};

/**
 * @description Generates a pre-signed URL for direct browser-to-S3 uploads
 */
const getPresignedUploadUrl = async (key, contentType, expiresIn = 900) => {
  const client = getS3Client();
  const command = new PutObjectCommand({ 
    Bucket: BUCKET, 
    Key: key, 
    ContentType: contentType,
    ServerSideEncryption: 'AES256'
  });
  return await getSignedUrl(client, command, { expiresIn });
};

/**
 * @description Batch download URL generation for patient records access
 */
const getBatchPresignedUrls = async (keys, expiresIn = 3600) => {
  return await Promise.all(keys.map(k => getPresignedUrl(k, expiresIn)));
};

// --- Image Processing & Thumbnails ---

const generateThumbnail = async (imageBuffer, size = 100) => {
  return await sharp(imageBuffer)
    .resize(size, size, { fit: 'inside' })
    .webp({ quality: 60 })
    .toBuffer();
};

/**
 * @description Upload original and generate clinical thumbnails in parallel
 */
const uploadWithThumbnails = async (imageBuffer, folder, entityId) => {
  const originalKey = `${folder}/${entityId}/original-${Date.now()}.webp`;
  const thumbKey = `${folder}/${entityId}/thumb-${Date.now()}.webp`;
  
  const original = await sharp(imageBuffer).webp().toBuffer();
  const thumb = await generateThumbnail(imageBuffer);

  return await Promise.all([
    uploadFile(original, originalKey, { contentType: 'image/webp' }),
    uploadFile(thumb, thumbKey, { contentType: 'image/webp' })
  ]);
};

// --- Utilities ---

const buildS3Key = (folder, entityId, filename) => {
  const sanitized = filename.replace(/\s+/g, '-').toLowerCase();
  return `${folder}${entityId}/${Date.now()}-${sanitized}`;
};

const validateFileType = async (buffer) => {
  const detected = await fileTypeFromBuffer(buffer);
  return detected;
};

// --- Management ---

const listFiles = async (prefix) => {
  const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix });
  const resp = await getS3Client().send(command);
  return resp.Contents || [];
};

module.exports = {
  uploadFile,
  uploadMultipart,
  uploadBase64,
  uploadPatientPhoto,
  uploadWithThumbnails,
  getPresignedUrl,
  getPresignedUploadUrl,
  getBatchPresignedUrls,
  streamFileToResponse,
  softDeleteFile,
  fileExists,
  listFiles,
  buildS3Key,
  validateFileType,
  S3_FOLDERS
};
