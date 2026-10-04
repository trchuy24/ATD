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
      serverSelectionTimeoutMS: 5000
    });
    global._mongoClientPromise = client.connect().catch(err => {
      global._mongoClientPromise = null;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

module.exports = {
  getDb,
  getClientPromise,
  get clientPromise() {
    return getClientPromise();
  }
};

