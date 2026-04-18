const Redis = require('ioredis');
const logger = require('../utils/logger.util');

/**
 * Redis Configuration Module
 * 
 * Manages Redis client initialization with support for Single, Cluster, 
 * and Sentinel modes. Includes retry strategies and event logging.
 */

const REDIS_MODE = process.env.REDIS_MODE || 'single';
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

/**
 * Custom retry strategy for Redis connection failures.
 * - Max 10 retries
 * - Exponential backoff
 * - Max delay of 30 seconds
 */
const retryStrategy = (times) => {
  if (times > 10) {
    logger.error('Redis: Maximum retry attempts reached. Stopping reconnection.');
    return null; // stop retrying
  }
  const delay = Math.min(times * 100, 30000);
  logger.info(`Redis: Reconnecting in ${delay}ms... (Attempt ${times})`);
  return delay;
};

const getRedisConfig = () => {
  const commonConfig = {
    password: REDIS_PASSWORD,
    retryStrategy: retryStrategy,
    maxRetriesPerRequest: null, // Essential for Cluster/Sentinel
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true; // Reconnect on READONLY error
      }
      return false;
    }
  };

  if (REDIS_MODE === 'cluster') {
    const nodes = (process.env.REDIS_CLUSTER_NODES || `${REDIS_HOST}:${REDIS_PORT}`)
      .split(',')
      .map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port) };
      });
    
    return {
      type: 'cluster',
      nodes,
      options: { 
        ...commonConfig,
        redisOptions: commonConfig 
      }
    };
  }

  if (REDIS_MODE === 'sentinel') {
    return {
      type: 'sentinel',
      options: {
        ...commonConfig,
        sentinels: (process.env.REDIS_SENTINELS || `${REDIS_HOST}:${REDIS_PORT}`)
          .split(',')
          .map(s => {
            const [host, port] = s.split(':');
            return { host, port: parseInt(port) };
          }),
        name: process.env.REDIS_SENTINEL_NAME || 'mymaster'
      }
    };
  }

  // Default: Single Mode
  return {
    type: 'single',
    options: {
      ...commonConfig,
      host: REDIS_HOST,
      port: REDIS_PORT,
    }
  };
};

const config = getRedisConfig();

// Initialize Main Client
const redis = config.type === 'cluster' 
  ? new Redis.Cluster(config.nodes, config.options)
  : new Redis(config.options);

// Initialize Pub/Sub Client (Isolated)
const pubSubRedis = config.type === 'cluster'
  ? new Redis.Cluster(config.nodes, config.options)
  : new Redis(config.options);

/**
 * Attachment of Connection Event Listeners
 */
const setupEventListeners = (client, name) => {
  client.on('connect', () => logger.info(`Redis [${name}]: Connected`));
  client.on('error', (err) => logger.error(`Redis [${name}]: Error | ${err.message}`));
  client.on('reconnecting', () => logger.warn(`Redis [${name}]: Reconnecting`));
  client.on('close', () => logger.info(`Redis [${name}]: Connection closed`));
};

setupEventListeners(redis, 'Main');
setupEventListeners(pubSubRedis, 'PubSub');

/**
 * Health Check Function
 */
const isRedisAlive = async () => {
  try {
    const status = await redis.ping();
    return status === 'PONG';
  } catch (error) {
    logger.error(`Redis Health Check Failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  redis,
  pubSubRedis,
  isRedisAlive,
  REDIS_MODE
};
