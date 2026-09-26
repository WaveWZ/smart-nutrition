const { loadEnv } = require('./env');
const { initFirestore } = require('./firestore');

function bootstrap() {
  const env = loadEnv();
  initFirestore(env);
  return env;
}

module.exports = { bootstrap };
