const crypto = require('crypto');
const bcrypt = require('bcrypt');
const logger = require('./logger.util').createChildLogger('hms-cryptography-engine');

/**
 * Hospital Management System - HIPAA-Compliant Cryptography Infrastructure
 * 
 * Provides production-grade orchestration for protecting PHI/PII data.
 * Features: AES-256-GCM authenticated encryption, RSA-SHA256 digital signatures, 
 * deterministic searchable hashing, and HIPAA-compliant data masking.
 */

// --- Configuration & Key Derivation ---

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const MASTER_KEY = process.env.FIELD_ENCRYPTION_KEY || 'clinical-master-security-key-32-bytes!';
const SEARCH_HMAC_KEY = process.env.SEARCH_HMAC_KEY || 'hms-deterministic-search-key';

/**
 * @description Derive a cryptographically secure 32-byte key using HKDF
 */
const deriveKey = (context = 'field-encryption') => {
  return crypto.hkdfSync('sha256', MASTER_KEY, '', context, 32);
};

// --- Symmetric Encryption (AES-256-GCM) ---

/**
 * @description Clinical-grade encryption for sensitive objects or strings
 * Format: v{version}:{iv}:{tag}:{ciphertext}
 */
const encrypt = (plaintext, secretKey = deriveKey()) => {
  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, secretKey, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64url');
    ciphertext += cipher.final('base64url');
    
    const tag = cipher.getAuthTag().toString('base64url');
    const version = '1';

    return `v${version}:${iv.toString('base64url')}:${tag}:${ciphertext}`;
  } catch (err) {
    logger.error('CRYPT_FAILURE: Encryption failed', err);
    throw new Error('ENCRYPTION_ERROR');
  }
};

const encryptJSON = (obj, secretKey) => encrypt(JSON.stringify(obj), secretKey);
const decryptJSON = (encryptedStr, secretKey) => JSON.parse(decrypt(encryptedStr, secretKey));

// --- Field-Level Encryption & Batch Processing ---

const encryptField = (value) => {
  if (value === null || value === undefined) return value;
  return encrypt(value.toString());
};

const decryptField = (encryptedValue) => {
  if (!encryptedValue) return encryptedValue;
  return decrypt(encryptedValue);
};

const encryptSensitiveFields = (obj, sensitiveFields = []) => {
  const result = { ...obj };
  sensitiveFields.forEach(field => {
    if (result[field]) result[field] = encryptField(result[field]);
  });
  return result;
};

const decryptSensitiveFields = (obj, sensitiveFields = []) => {
  const result = { ...obj };
  sensitiveFields.forEach(field => {
    if (result[field]) result[field] = decryptField(result[field]);
  });
  return result;
};

/**
 * @description authenticated decryption with integrity verification
 */
const decrypt = (encryptedData, secretKey = deriveKey()) => {
  if (!encryptedData || !encryptedData.includes(':')) return encryptedData;

  try {
    const [version, ivBase64, tagBase64, ciphertext] = encryptedData.split(':');
    const iv = Buffer.from(ivBase64, 'base64url');
    const tag = Buffer.from(tagBase64, 'base64url');
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, secretKey, iv);
    decipher.setAuthTag(tag);
    
    let plaintext = decipher.update(ciphertext, 'base64url', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (err) {
    logger.error('CRYPT_FAILURE: Decryption/Integrity check failed', err);
    throw new Error('DECRYPTION_INTEGRITY_VIOLATION');
  }
};

// --- Searchable Encryption (Deterministic Hashing) ---

/**
 * @description Generates a deterministic HMAC for searching encrypted fields
 */
const encryptSearchable = (value) => {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  return crypto.createHmac('sha256', SEARCH_HMAC_KEY).update(normalized).digest('hex');
};

/**
 * @description Create search indices for partial matching on encrypted data
 */
const createSearchIndex = (value) => {
  if (!value || value.length < 3) return [];
  const normalized = value.toString().toLowerCase();
  const ngrams = [];
  for (let i = 0; i <= normalized.length - 3; i++) {
    ngrams.push(encryptSearchable(normalized.substring(i, i + 3)));
  }
  return ngrams;
};

// --- Password & Data Hashing ---

const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
};

const generateHMAC = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

const hashData = (data, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(data).digest('hex');
};

const generateDocumentHash = (buffer) => {
  return {
    hash: hashData(buffer, 'sha256'),
    algorithm: 'sha256',
    timestamp: new Date().toISOString()
  };
};

// --- HIPAA Masking Utilities ---

const maskAadhaar = (val) => val ? `XXXX-XXXX-${val.slice(-4)}` : null;
const maskPAN = (val) => val ? `XXXXX${val.slice(5, 9)}X` : null;
const maskPhone = (val) => val ? `${val.slice(0, 3)}XXXXXXX${val.slice(-3)}` : null;
const maskEmail = (val) => {
  if (!val) return null;
  const [user, domain] = val.split('@');
  return `${user[0]}***@${domain}`;
};
const maskBankAccount = (val) => val ? `*****${val.slice(-4)}` : null;
const maskCardNumber = (val) => val ? `**** **** **** ${val.slice(-4)}` : null;

const maskField = (value, maskChar = '*', start = 2, end = 2) => {
  if (!value) return value;
  const str = value.toString();
  if (str.length <= (start + end)) return str;
  const middle = maskChar.repeat(str.length - (start + end));
  return str.slice(0, start) + middle + str.slice(-end);
};

// --- Digital Signatures (RSA) ---

/**
 * @description Digital signature for prescriptions, lab reports, and billing
 */
const signData = (data, privateKey) => {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(typeof data === 'string' ? data : JSON.stringify(data));
  return signer.sign(privateKey, 'base64');
};

const verifySignature = (data, signature, publicKey) => {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(typeof data === 'string' ? data : JSON.stringify(data));
  return verifier.verify(publicKey, signature, 'base64');
};

// --- Random & Encoding Helpers ---

const generateUUID = () => crypto.randomUUID();

const generateSecureOTP = (length = 6) => {
  return crypto.randomInt(10 ** (length - 1), (10 ** length) - 1).toString();
};

const generateAlphanumericCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 (avoid ambiguity)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return result;
};

const constantTimeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// --- Export Configuration ---

module.exports = {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  encryptField,
  decryptField,
  encryptSensitiveFields,
  decryptSensitiveFields,
  encryptSearchable,
  createSearchIndex,
  hashPassword,
  comparePassword,
  hashData,
  generateHMAC,
  generateDocumentHash,
  maskAadhaar,
  maskPAN,
  maskPhone,
  maskEmail,
  maskBankAccount,
  maskCardNumber,
  maskField,
  signData,
  verifySignature,
  generateUUID,
  generateSecureOTP,
  generateAlphanumericCode,
  constantTimeEqual,
  deriveKey
};
