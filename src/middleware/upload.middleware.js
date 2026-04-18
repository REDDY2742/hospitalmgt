const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const sharp = require('sharp');
const { fileTypeFromBuffer } = require('file-type');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, buckets } = require('../config/aws');
const { getSignedUrl } = require('../utils/s3.util');
const logger = require('../utils/logger.util');

/**
 * Advanced File Upload Middleware (Medical Grade)
 * 
 * Implements: 
 * - Memory-to-S3 streaming (Zero Disk)
 * - True MIME validation (file-type)
 * - Sharp Image Compression (>500KB)
 * - Clinical Tagging & UUID Namespacing
 */

// Memory Storage ensures no disk writes, keeping the process purely in memory/streams
const storage = multer.memoryStorage();

/**
 * Unique Key Generator
 */
const generateKey = (module, originalname) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const uuid = uuidv4();
  const sanitizedName = originalname.replace(/\s+/g, '-').toLowerCase();
  return `${module}/${year}/${month}/${uuid}-${sanitizedName}`;
};

/**
 * Placeholder Virus Scan Hook
 */
const scanFile = async (buffer) => {
  // Integrate ClamAV/GuardDuty here
  return true; 
};

/**
 * Core S3 Upload Logic
 * Handles file-type validation and image compression
 */
const processAndUpload = (options) => async (req, res, next) => {
  if (!req.file) return next();

  try {
    const { buffer, originalname, size, mimetype } = req.file;
    const { module, bucketKey, allowedExts } = options;

    // 1. Validate MIME Type with file-type (Header sniffing)
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !allowedExts.includes(type.ext)) {
      return res.status(400).json({ 
        status: 'error', 
        message: `Security rejection: File content (${type ? type.ext : 'unknown'}) does not match allowed types.` 
      });
    }

    // 2. Virus Scan Hook
    const isSafe = await scanFile(buffer);
    if (!isSafe) return res.status(403).json({ status: 'error', message: 'Security rejection: Virus detected.' });

    // 3. Image Compression with Sharp (if > 500KB)
    let processedBuffer = buffer;
    let finalSize = size;
    const isImage = ['jpg', 'jpeg', 'png'].includes(type.ext);

    if (isImage && size > 500 * 1024) {
      processedBuffer = await sharp(buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      finalSize = processedBuffer.length;
      logger.info(`Sharp Compression: Reducted ${originalname} from ${size} to ${finalSize}`);
    }

    // 4. Upload to S3
    const key = generateKey(module, originalname);
    const bucket = buckets[bucketKey];

    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: processedBuffer,
      ContentType: type.mime,
      Metadata: {
        uploadedBy: req.user ? String(req.user.id) : 'system',
        patientId: req.body.patientId || 'N/A',
        documentType: module,
        module: module,
        uploadedAt: new Date().toISOString()
      }
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // 5. Generate Pre-signed URL
    const signedUrl = await getSignedUrl({ bucketName: bucket, key: key });

    // 6. Attach result to request
    req.uploadedFile = {
      key,
      url: signedUrl,
      size: finalSize,
      mimetype: type.mime,
      originalname
    };

    logger.info(`S3 Upload Success | Key: ${key} | Size: ${finalSize}`, {
      uploader: req.user ? req.user.id : 'N/A',
      fileType: type.mime,
      s3Key: key,
      timestamp: new Date()
    });

    next();
  } catch (error) {
    logger.error(`S3 Upload Transformation Failed: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'File processing and storage failed' });
  }
};

/**
 * Specialized Handlers
 */

// 1. Profile Photo
const configureProfilePhoto = multer({ 
  storage, 
  limits: { fileSize: 2 * 1024 * 1024 } 
}).single('profilePhoto');

const uploadProfilePhoto = [
  configureProfilePhoto,
  processAndUpload({ module: 'profile', bucketKey: 'PROFILE_IMAGES', allowedExts: ['jpg', 'jpeg', 'png'] })
];

// 2. Medical Document
const configureMedicalDoc = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } 
}).single('document');

const uploadMedicalDocument = [
  configureMedicalDoc,
  processAndUpload({ module: 'medical', bucketKey: 'PATIENT_DOCUMENTS', allowedExts: ['pdf', 'jpg', 'jpeg', 'png', 'dcm'] })
];

// 3. Lab Report
const configureLabReport = multer({ 
  storage, 
  limits: { fileSize: 15 * 1024 * 1024 } 
}).single('labReport');

const uploadLabReport = [
  configureLabReport,
  processAndUpload({ module: 'labs', bucketKey: 'LAB_REPORTS', allowedExts: ['pdf', 'jpg', 'jpeg', 'png', 'dcm'] })
];

// 4. Prescription
const configurePrescription = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } 
}).single('prescription');

const uploadPrescription = [
  configurePrescription,
  processAndUpload({ module: 'prescriptions', bucketKey: 'PRESCRIPTIONS', allowedExts: ['pdf', 'jpg', 'jpeg', 'png'] })
];

/**
 * Multer Error Handler
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ status: 'error', message: 'File too large' });
    return res.status(400).json({ status: 'error', message: err.message });
  }
  if (err) return res.status(400).json({ status: 'error', message: err.message });
  next();
};

module.exports = {
  uploadProfilePhoto,
  uploadMedicalDocument,
  uploadLabReport,
  uploadPrescription,
  handleUploadError
};
