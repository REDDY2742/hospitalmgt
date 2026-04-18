const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Hospital RS256 JWT & Token Utility
 * 
 * Implements Asymmetric RSA signing for identity management and 
 * high-security token lifecycle management.
 */

// Load RSA Keys (Prefers env content, falls back to local file paths)
const privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') || fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');
const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');

/**
 * @description Generates RS256 Signed Access Token
 */
const generateAccessToken = (payload) => {
  return jwt.sign({
    ...payload,
    jti: uuidv4()
  }, privateKey, { 
    algorithm: 'RS256', 
    expiresIn: '15m',
    issuer: 'Hospital_EMS'
  });
};

/**
 * @description Generates Opaque Refresh Token (Hashed for DB storage)
 */
const generateRefreshToken = (userId) => {
  const rawToken = uuidv4();
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return {
    rawToken,
    hashedToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
};

/**
 * @description Verifies RS256 JWT using Public Key
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw new Error('TokenExpiredError');
    if (error.name === 'JsonWebTokenError') throw new Error('JsonWebTokenError');
    throw error;
  }
};

/**
 * @description Generates 1-hour secure password reset link token
 */
const generatePasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return {
    rawToken,
    hashedToken,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000)
  };
};

/**
 * @description Standardized Token extraction from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('AuthenticationError: Malformed Authorization header');
  }
  return authHeader.split(' ')[1];
};

/**
 * @description Timing-safe hash comparison for tokens
 */
const compareHashedToken = (rawToken, hashedToken) => {
  const currentHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(hashedToken));
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  generatePasswordResetToken,
  extractTokenFromHeader,
  compareHashedToken,
  hashToken: (t) => crypto.createHash('sha256').update(t).digest('hex'),
  generateOTPToken: () => {
    const otp = crypto.randomInt(100000, 999999).toString();
    return {
      otp,
      hashedOtp: crypto.createHash('sha256').update(otp).digest('hex'),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
  }
};
