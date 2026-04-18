const { S3Client } = require('@aws-sdk/client-s3');
const { ConfiguredRetryStrategy } = require('@aws-sdk/util-retry');
const logger = require('../utils/logger.util');

/**
 * AWS S3 Configuration Module
 * 
 * Initializes the S3 client with credentials, region, and retry logic.
 * Buckets are configured via environment variables.
 */

// Environment variable validation (Basic)
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_PATIENT_DOCUMENTS',
  'S3_BUCKET_LAB_REPORTS',
  'S3_BUCKET_PRESCRIPTIONS',
  'S3_BUCKET_PROFILE_IMAGES'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    logger.warn(`AWS Configuration: Missing environment variable ${varName}`);
  }
});

/**
 * Custom retry strategy with 3 retries and exponential delay.
 * SDK v3 default already uses exponential backoff, but we explicitly 
 * define it here to meet the "advanced" requirement.
 */
const retryStrategy = new ConfiguredRetryStrategy(
  3, // max attempts
  (attempt) => Math.min(2000, 100 * Math.pow(2, attempt)) // exponential backoff function
);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  retryStrategy: retryStrategy
});

const buckets = {
  PATIENT_DOCUMENTS: process.env.S3_BUCKET_PATIENT_DOCUMENTS,
  LAB_REPORTS: process.env.S3_BUCKET_LAB_REPORTS,
  PRESCRIPTIONS: process.env.S3_BUCKET_PRESCRIPTIONS,
  PROFILE_IMAGES: process.env.S3_BUCKET_PROFILE_IMAGES,
};

module.exports = {
  s3Client,
  buckets
};
