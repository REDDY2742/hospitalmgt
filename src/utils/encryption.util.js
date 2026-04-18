const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Hospital Cryptography & Data Protection Utility
 * 
 * Enforces AES-256-GCM for sensitive field encryption and 
 * bcrypt for credentials, ensuring HIPAA-grade data sovereignty.
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * @description AES-256-GCM Authenticated Encryption
 * Used for Aadhaar, Bank Details, and PHI sensitive fields.
 */
const encrypt = (text, secretKey = process.env.FIELD_ENCRYPTION_KEY) => {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.scryptSync(secretKey, salt, 32);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64')
  });
};

/**
 * @description Decrypts GCM-authenticated payload
 */
const decrypt = (encryptedData, secretKey = process.env.FIELD_ENCRYPTION_KEY) => {
  if (!encryptedData) return null;
  
  try {
    const data = JSON.parse(encryptedData);
    const key = crypto.scryptSync(secretKey, Buffer.from(data.salt, 'base64'), 32);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(data.iv, 'base64'));
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(data.encrypted, 'base64')), decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('DecryptionError: Invalid key or tampered payload');
  }
};

/**
 * @description Password Hashing logic (Bcrypt 12 rounds)
 */
const hashPassword = async (password) => await bcrypt.hash(password, 12);

const verifyPassword = async (password, hash) => await bcrypt.compare(password, hash);

/**
 * @description Cryptographically secure numeric OTP generation
 */
const generateNumericOTP = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return crypto.randomInt(min, max).toString().padStart(digits, '0');
};

/**
 * @description Data masking for logs and UI display
 */
const maskSensitiveData = (data, type) => {
  if (!data) return '';
  switch (type) {
    case 'phone': return data.replace(/(\d{2})(\d{5})(\d{5})/, '$1XXXXX$3');
    case 'email': {
      const [user, domain] = data.split('@');
      return `${user[0]}***@${domain}`;
    }
    case 'aadhaar': return `XXXX-XXXX-${data.slice(-4)}`;
    case 'card': return `**** **** **** ${data.slice(-4)}`;
    default: return '***REDACTED***';
  }
};

const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateNumericOTP,
  maskSensitiveData,
  timingSafeEqual,
  hashToken: (token) => crypto.createHash('sha256').update(token).digest('hex'),
  generateSecureToken: (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
};
