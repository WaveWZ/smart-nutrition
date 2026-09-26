const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let db;

function normalizePrivateKey(value) {
  let key = value.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

function buildCredential(firebase) {
  if (firebase.projectId && firebase.clientEmail && firebase.privateKey) {
    return cert({
      projectId: firebase.projectId,
      clientEmail: firebase.clientEmail,
      privateKey: normalizePrivateKey(firebase.privateKey),
    });
  }

  if (firebase.serviceAccountPath) {
    const absolutePath = path.resolve(firebase.serviceAccountPath);
    const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    return cert(parsed);
  }

  throw new Error(
    'Missing Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Set them in backend/.env or provide FIREBASE_SERVICE_ACCOUNT_PATH.',
  );
}

function initFirestore(env) {
  if (db) return db;

  const credential = buildCredential(env.firebase);
  const app = getApps()[0] || initializeApp({ credential });
  db = env.firebase.databaseId
    ? getFirestore(app, env.firebase.databaseId)
    : getFirestore(app);

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Firestore has not been initialized');
  }
  return db;
}

module.exports = { initFirestore, getDb };
