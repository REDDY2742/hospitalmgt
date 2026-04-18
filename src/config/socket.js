const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const { redis, pubSubRedis } = require('./redis');
const logger = require('../utils/logger.util');

/**
 * Socket.io Configuration Module
 * 
 * Handles real-time communication with Redis-backed scaling, 
 * JWT authentication, and role-based access control.
 */

let io;

const NAMESPACES = ['/emergency', '/appointments', '/notifications', '/ambulance', '/ot'];
const ONLINE_USERS_KEY = 'hms:online_users';
const RATE_LIMIT_PREFIX = 'hms:socket_limit:';

/**
 * JWT Authentication Middleware for Sockets
 */
const authMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
  
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');
    socket.user = decoded; // { id, role, wardId, ... }
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Rate Limiting Middleware for Socket Events
 */
const rateLimitMiddleware = async (socket, packet, next) => {
  const userId = socket.user.id;
  const key = `${RATE_LIMIT_PREFIX}${userId}`;
  
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60); // 1 minute window
    }
    
    if (count > 30) {
      logger.warn(`Socket Rate Limit Exceeded | User: ${userId}`);
      return; // Silently drop or emit error
    }
    next();
  } catch (error) {
    next(); // Fallback if Redis fails
  }
};

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 1. Setup Redis Adapter for scaling
  io.adapter(createAdapter(redis, pubSubRedis));

  // 2. Global Middleware
  io.use(authMiddleware);

  // 3. Namespace Initialization
  NAMESPACES.forEach(ns => {
    const namespace = io.of(ns);
    namespace.use(authMiddleware);
    setupNamespace(namespace, ns);
  });

  // 4. Default Namespace connection logic
  setupNamespace(io, 'default');

  logger.info('Socket.io: Initialized with Redis Adapter');
  return io;
};

const setupNamespace = (nsInstance, nsName) => {
  nsInstance.on('connection', async (socket) => {
    const { id: userId, role, wardId } = socket.user;

    // A. Tracking Online Status
    await redis.hset(ONLINE_USERS_KEY, userId, socket.id);
    await redis.expire(ONLINE_USERS_KEY, 86400); // 1 day cleanup

    // B. Role-Based Room Joining
    socket.join(`${role}:${userId}`); // e.g., doctor:101
    socket.join(role); // e.g., admin
    if (wardId) socket.join(`ward:${wardId}`);
    if (role === 'doctor' || role === 'nurse') socket.join('emergency');

    logger.info(`Socket Connected | User: ${userId} | Role: ${role} | Namespace: ${nsName}`, {
      userId, role, socketId: socket.id, namespace: nsName
    });

    // C. Event Listeners
    socket.use((packet, next) => rateLimitMiddleware(socket, packet, next));

    socket.on('disconnect', async () => {
      await redis.hdel(ONLINE_USERS_KEY, userId);
      // Broadcast offline status if needed
      nsInstance.to('admin').emit('user_offline', { userId });
      
      logger.info(`Socket Disconnected | User: ${userId}`, { userId });
    });

    // Handle errors
    socket.on('error', (err) => {
      logger.error(`Socket Error | User: ${userId} | ${err.message}`);
    });
  });
};

/**
 * Helper to get the IO instance for service layers
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};
