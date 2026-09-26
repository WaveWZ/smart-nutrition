const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

function loadEnv() {
  const port = Number(process.env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return {
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
      serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
      databaseId: process.env.FIREBASE_DATABASE_ID || '',
    },
  };
}

function parseOriginList(value) {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = { loadEnv, parseOriginList };
