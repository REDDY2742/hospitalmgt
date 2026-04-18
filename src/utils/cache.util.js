const { redis } = require('../config/redis');
const logger = require('./logger.util');

/**
 * Cache Utility Module
 * 
 * Provides a high-level wrapper for Redis caching operations, including
 * namespace isolation, invalidation helpers, and cache stampede protection.
 */

/**
 * Generate a consistent key based on the HMS prefixing strategy.
 * Format: hms:{module}:{id}
 */
const formatKey = (module, id) => `hms:${module}:${id}`;

/**
 * SET value in cache
 * @param {string} module - Module name (e.g., 'patients')
 * @param {string} id - Unique identifier
 * @param {any} value - Value to store (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (optional)
 */
const set = async (module, id, value, ttl = null) => {
  const key = formatKey(module, id);
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.set(key, serialized, 'EX', ttl);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (error) {
    logger.error(`Cache SET Error | Key: ${key} | ${error.message}`);
    return false;
  }
};

/**
 * GET value from cache
 */
const get = async (module, id) => {
  const key = formatKey(module, id);
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Cache GET Error | Key: ${key} | ${error.message}`);
    return null;
  }
};

/**
 * DELETE specific key from cache
 */
const del = async (module, id) => {
  const key = formatKey(module, id);
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error(`Cache DEL Error | Key: ${key} | ${error.message}`);
    return false;
  }
};

/**
 * FLUSH all keys matching the HMS prefix (Dangerous in shared environments)
 */
const flush = async () => {
  try {
    const keys = await redis.keys('hms:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    logger.info(`Cache Flush: Cleared ${keys.length} hms keys`);
    return true;
  } catch (error) {
    logger.error(`Cache FLUSH Error | ${error.message}`);
    return false;
  }
};

/**
 * INVALIDATE by ID (Wrapper for del)
 */
const invalidateById = async (module, id) => del(module, id);

/**
 * INVALIDATE by Pattern (e.g., all keys in a module)
 */
const invalidateByPattern = async (pattern) => {
  const fullPattern = pattern.startsWith('hms:') ? pattern : `hms:${pattern}*`;
  try {
    // In production, SCAN is preferred over KEYS for large datasets
    let cursor = '0';
    let totalDeleted = 0;
    
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== '0');

    logger.info(`Cache Invalidation Pattern: ${fullPattern} | Deleted: ${totalDeleted}`);
    return totalDeleted;
  } catch (error) {
    logger.error(`Cache Invalidate Pattern Error | Pattern: ${fullPattern} | ${error.message}`);
    return 0;
  }
};

/**
 * MUTEX LOCK for Cache Stampede Protection
 * @param {string} lockKey - Unique key for the lock
 * @param {number} ttl - Lock expiration (ms)
 */
const acquireLock = async (lockKey, ttl = 5000) => {
  const result = await redis.set(`lock:${lockKey}`, 'locked', 'PX', ttl, 'NX');
  return result === 'OK';
};

const releaseLock = async (lockKey) => {
  await redis.del(`lock:${lockKey}`);
};

/**
 * PROTECTIVE GET with Mutex Pattern
 * Helps prevent multiple simultaneous requests from hitting the DB during cache miss.
 */
const getOrFetch = async (module, id, fetchFn, ttl = 3600) => {
  const key = formatKey(module, id);
  
  // 1. Try Cache
  let data = await get(module, id);
  if (data) return data;

  // 2. Cache Miss - Acquire Mutex
  const lockKey = `${module}:${id}`;
  const locked = await acquireLock(lockKey);

  if (locked) {
    try {
      // Re-check cache after getting lock (another process might have filled it)
      data = await get(module, id);
      if (data) return data;

      // Fetch from DB/Source
      logger.info(`Cache MISS | Fetching from source: ${key}`);
      data = await fetchFn();
      
      if (data) {
        await set(module, id, data, ttl);
      }
      return data;
    } finally {
      await releaseLock(lockKey);
    }
  } else {
    // Wait slightly and retry GET (Simple backoff)
    await new Promise(resolve => setTimeout(resolve, 100));
    return getOrFetch(module, id, fetchFn, ttl);
  }
};

module.exports = {
  set,
  get,
  del,
  flush,
  invalidateById,
  invalidateByPattern,
  getOrFetch,
  formatKey,
  isRedisAlive: require('../config/redis').isRedisAlive
};
