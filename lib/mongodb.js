const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Auto-load env from atlas-credentials.env or .env if MONGODB_URI is not set
if (!process.env.MONGODB_URI) {
  const candidatePaths = [
    path.resolve(__dirname, '../atlas-credentials.env'),
    path.resolve(process.cwd(), 'atlas-credentials.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), '.env')
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      if (process.env.MONGODB_URI) break;
    }
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'trac_nghiem';

if (!uri) {
  console.warn('[WARN] MONGODB_URI is not set. Please configure atlas-credentials.env or environment variables.');
}

let clientInstance;
let clientPromise;

function getClientPromise() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000
    });
    global._mongoClientPromise = client.connect().then(async (connectedClient) => {
      try {
        const db = connectedClient.db(dbName);
        await Promise.all([
          db.collection('questions').createIndex({ subjectId: 1, id: 1 }, { background: true }),
          db.collection('questions').createIndex({ parentSubjectID: 1 }, { background: true }),
          db.collection('subjects').createIndex({ parentId: 1, order: 1 }, { background: true })
        ]);
      } catch (e) {}
      return connectedClient;
    }).catch(err => {
      global._mongoClientPromise = null;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

// Fast in-memory cache for API responses
if (!global._apiMemoryCache) {
  global._apiMemoryCache = new Map();
}

function getCache(key) {
  const entry = global._apiMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    global._apiMemoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttlMs = 60000) {
  global._apiMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function clearCache() {
  if (global._apiMemoryCache) {
    global._apiMemoryCache.clear();
  }
}

async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

module.exports = {
  getDb,
  getClientPromise,
  getCache,
  setCache,
  clearCache,
  get clientPromise() {
    return getClientPromise();
  }
};

