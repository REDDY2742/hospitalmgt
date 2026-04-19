const Redis = require('ioredis');
const zlib = require('zlib');
const crypto = require('crypto');
const logger = require('./logger.util').createChildLogger('cache-service');

/**
 * Hospital Management System - High-Performance Redis Caching Infrastructure
 * 
 * Purpose: Centralized orchestration for clinical session storage, real-time 
 * monitoring (vitals/GPS), distributed locks, and surgical performance optimization.
 */

// --- 1. KEY PATTERNS & TTL CONSTANTS ---

const KEY_PATTERNS = {
  USER: 'user:{userId}',
  USER_PERMISSIONS: 'user:{userId}:permissions',
  SESSION: 'session:{userId}:{sessionId}',
  PATIENT: 'patient:{patientId}',
  PATIENT_SUMMARY: 'patient:{patientId}:summary',
  DOCTOR: 'doctor:{doctorId}',
  DOCTOR_SLOTS: 'doctor:{doctorId}:slots:{date}',
  WARD_STATUS: 'ward:{wardId}:status',
  BED_STATUS: 'bed:{bedId}:status',
  MEDICINE_STOCK: 'pharmacy:stock:{medicineId}',
  PHARMACY_LOW_STOCK: 'pharmacy:low-stock',
  BLOOD_STOCK: 'blood:stock:{bloodGroup}',
  OTP: 'otp:{purpose}:{userId}',
  OTP_ATTEMPTS: 'otp:attempts:{purpose}:{userId}',
  BLACKLISTED_TOKEN: 'blacklisted:token:{jti}',
  REFRESH_TOKEN: 'refresh:token:{jti}',
  USER_SESSIONS: 'user_sessions:{userId}',
  RATE_LIMIT: 'ratelimit:{key}:{window}',
  LOCK: 'lock:{resource}:{resourceId}',
  SEARCH_CACHE: 'search:{entity}:{queryHash}'
};

const TTL = {
  REALTIME: 60,
  SENSITIVE: 300,
  VOLATILE: 900,
  STANDARD: 3600,
  LONG: 86400,
  PERSISTENT: 604800,
  BLACKLIST: 900,
  OTP: 300
};

// --- 2. MULTI-PURPOSE CLIENT INITIALIZATION ---

const clients = {
  cache: null,
  session: null,
  rateLimit: null,
  lock: null,
  pubsub: null,
  publish: null
};

/**
 * @description Creates an ioredis instance with production-grade reliability
 */
const createRedisClient = (db = 0) => {
  const options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: db,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'hms:',
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => (times > 10 ? null : Math.min(times * 200, 3000)),
    reconnectOnError: (err) => err.message.includes('READONLY'),
    enableReadyCheck: true
  };

  const client = new Redis(options);

  client.on('connect', () => logger.info(`Redis DB:${db} connected`));
  client.on('error', (err) => logger.error(`Redis DB:${db} error`, err));

  return client;
};

const initializeRedisClients = () => {
  clients.cache = createRedisClient(0);
  clients.session = createRedisClient(1);
  clients.rateLimit = createRedisClient(2);
  clients.lock = createRedisClient(3);
  clients.pubsub = createRedisClient(4);
  clients.publish = createRedisClient(4); // Shared DB for pub-sub
};

// --- 3. SMART SERIALIZATION & COMPRESSION ---

const serialize = (value) => {
  if (value === undefined) return null;
  const data = JSON.stringify(value);
  if (data.length > 10240) { // Compress if > 10KB
    return zlib.gzipSync(data).toString('base64') + ':gz';
  }
  return data;
};

const deserialize = (str) => {
  if (!str) return null;
  if (str.endsWith(':gz')) {
    const buffer = Buffer.from(str.slice(0, -3), 'base64');
    return JSON.parse(zlib.gunzipSync(buffer).toString());
  }
  try { return JSON.parse(str); } catch (e) { return str; }
};

// --- 4. CORE CACHE OPERATIONS ---

const get = async (key) => {
  const raw = await clients.cache.get(key);
  return deserialize(raw);
};

const set = async (key, value, ttl = TTL.STANDARD) => {
  const raw = serialize(value);
  return await clients.cache.set(key, raw, 'EX', ttl);
};

const getOrSet = async (key, fetchFn, ttl = TTL.STANDARD) => {
  const cached = await get(key);
  if (cached !== null) return cached;

  const lockKey = `lock:fetch:${key}`;
  const lock = await clients.cache.set(lockKey, 'fetching', 'EX', 10, 'NX');
  if (!lock) {
    await new Promise(r => setTimeout(r, 200));
    return getOrSet(key, fetchFn, ttl);
  }

  try {
    const data = await fetchFn();
    await set(key, data, ttl);
    return data;
  } finally {
    await clients.cache.del(lockKey);
  }
};

// --- 5. ADVANCED OPERATIONS ---

/**
 * @description Sliding Window Rate Limiter using Sorted Sets
 */
const checkRateLimit = async (key, windowMs, maxRequests) => {
  const now = Date.now();
  const identifier = `ratelimit:${key}`;
  const pipeline = clients.rateLimit.pipeline();

  pipeline.zadd(identifier, now, now);
  pipeline.zremrangebyscore(identifier, 0, now - windowMs);
  pipeline.zcard(identifier);
  pipeline.expire(identifier, Math.ceil(windowMs / 1000));

  const results = await pipeline.exec();
  const requestCount = results[2][1];

  return {
    allowed: requestCount <= maxRequests,
    count: requestCount,
    remaining: Math.max(0, maxRequests - requestCount)
  };
};

/**
 * @description Safe pattern deletion using SCAN (O(N) non-blocking)
 */
const delByPattern = async (pattern) => {
  const fullPattern = `${clients.cache.options.keyPrefix}${pattern}`;
  let cursor = '0';
  let deletedCount = 0;

  do {
    const [newCursor, keys] = await clients.cache.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
    cursor = newCursor;
    if (keys.length > 0) {
      // Remove prefix from keys before passing to del (ioredis re-adds it)
      const sanitizedKeys = keys.map(k => k.replace(clients.cache.options.keyPrefix, ''));
      const deleted = await clients.cache.del(...sanitizedKeys);
      deletedCount += deleted;
    }
  } while (cursor !== '0');

  return deletedCount;
};

// --- 5. CLINICAL INVALIDATION HELPERS ---

const invalidateUserCache = async (userId) => {
  const pipeline = clients.cache.pipeline();
  pipeline.del(`user:${userId}`);
  pipeline.del(`user:${userId}:permissions`);
  pipeline.del(`notifications:unread:${userId}`);
  return await pipeline.exec();
};

const invalidateDoctorCache = async (doctorId) => {
  await delByPattern(`doctor:${doctorId}:*`);
  await clients.cache.del(`doctor:${doctorId}`);
};

// --- 6. HASH & COLLECTION OPS ---

const hset = async (key, field, value) => {
  return await clients.cache.hset(key, field, JSON.stringify(value));
};

const hgetall = async (key) => {
  const data = await clients.cache.hgetall(key);
  if (!data) return null;
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, deserialize(v)]));
};

// --- 7. ANALYTICS & WARMING ---

const getCacheStats = async () => {
  const info = await clients.cache.info();
  return { info }; // Simplification for length
};

const warmCache = async () => {
  logger.info('Cache warming initiated: Department List, Medication Catalog...');
  // Logic: trigger service calls to populate critical lists
};

// --- 5. DISTRIBUTED LOCKING ---

/**
 * @description Executes an async function inside a distributed Redis lock
 */
const withLock = async (resource, resourceId, ttlMs = 5000, fn) => {
  const lockKey = `lock:${resource}:${resourceId}`;
  const token = crypto.randomBytes(16).toString('hex');
  
  const acquired = await clients.lock.set(lockKey, token, 'PX', ttlMs, 'NX');
  if (!acquired) throw new Error(`Resource [${resource}:${resourceId}] is currently locked.`);

  try {
    return await fn();
  } finally {
    // Lua script for atomic safe release (ensure we only delete OUR lock)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await clients.lock.eval(script, 1, lockKey, token);
  }
};

// --- 6. HEALTH & LIFECYCLE ---

const checkHealth = async () => {
  const latency = await clients.cache.ping();
  return { status: latency === 'PONG' ? 'healthy' : 'unhealthy' };
};

const closeAllConnections = async () => {
  await Promise.all(Object.values(clients).filter(c => c).map(c => c.quit()));
  logger.warn('All Redis connections gracefully terminated');
};

module.exports = {
  initializeRedisClients,
  get,
  set,
  getOrSet,
  hset,
  hgetall,
  delByPattern,
  checkRateLimit,
  invalidateUserCache,
  invalidateDoctorCache,
  warmCache,
  getCacheStats,
  publishAlert: (channel, data) => clients.publish.publish(`hms:${channel}`, JSON.stringify(data)),
  withLock,
  checkHealth,
  closeAllConnections,
  KEY_PATTERNS,
  TTL,
  clients
};
