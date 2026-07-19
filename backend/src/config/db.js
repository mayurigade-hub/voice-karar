import mongoose from 'mongoose';
import config from './env.js';

// ─── Mongoose Global Settings ────────────────────────────────────────────────

/**
 * strictQuery: false
 *   Allows querying on fields not in the schema without throwing errors.
 *   Useful during rapid development; set to true once schema is stable.
 */
mongoose.set('strictQuery', false);

/**
 * Global toJSON transform
 * Automatically applied to every document.toJSON() call.
 * - Renames _id → id for a cleaner API surface (frontend never sees MongoDB internals)
 * - Strips __v (Mongoose version key) from every response
 */
mongoose.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// ─── Connection Options ───────────────────────────────────────────────────────
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 5000,   // fail fast if Atlas is unreachable
  socketTimeoutMS: 45000,            // close sockets after 45s of inactivity
  maxPoolSize: 10,                   // keep up to 10 connections in the pool
};

// ─── Connection Event Listeners ───────────────────────────────────────────────

mongoose.connection.on('connecting', () => {
  console.log('[DB] Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log(`[DB] ✓ Connected to MongoDB → ${mongoose.connection.host}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] ✗ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB] ↺ MongoDB reconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[DB] MongoDB connection error: ${err.message}`);
});

let mongod = null;

/**
 * Establishes the MongoDB connection.
 * Called once at server startup — before app.listen().
 * Falls back to an in-memory MongoDB instance if MONGO_URI is not configured in dev.
 */
export const connectDB = async () => {
  let uri = config.mongoUri;
  if (!uri) {
    console.log('[DB] No MONGO_URI provided in .env — starting in-memory MongoDB for local testing...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri, MONGOOSE_OPTIONS);
};

// ─── Disconnect ───────────────────────────────────────────────────────────────

/**
 * Cleanly closes the MongoDB connection.
 * Used during graceful server shutdown and test suite teardowns.
 */
export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
  console.log('[DB] MongoDB connection closed.');
};

// ─── Health check helper ─────────────────────────────────────────────────────

/**
 * Returns the current Mongoose connection state as a human-readable string.
 * Used by the /api/health endpoint to report DB status.
 *
 * Mongoose readyState values:
 *   0 = disconnected
 *   1 = connected
 *   2 = connecting
 *   3 = disconnecting
 */
const STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getDBStatus = () => {
  const state = mongoose.connection.readyState;
  return {
    status: STATE_LABELS[state] ?? 'unknown',
    ready: state === 1,
  };
};

export default connectDB;
