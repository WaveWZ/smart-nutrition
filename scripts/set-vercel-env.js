const { spawnSync } = require('child_process');
const fs = require('fs');

function parseEnv(file) {
  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[trimmed.slice(0, index).trim()] = value;
  }
  return values;
}

function redact(text, secrets) {
  let safe = text || '';
  for (const secret of secrets) {
    if (secret) safe = safe.split(secret).join('[redacted]');
  }
  return safe.slice(0, 400);
}

function setVar(name, value, sensitive) {
  const args = [
    '--yes',
    'vercel@latest',
    'env',
    'add',
    name,
    'production',
    '--yes',
    '--force',
    sensitive ? '--sensitive' : '--no-sensitive',
    '--value',
    value,
  ];
  const result = spawnSync('npx', args, {
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, VERCEL_TELEMETRY_DISABLED: '1' },
  });
  const output = redact(`${result.stdout || ''}\n${result.stderr || ''}`, [value]);
  if (result.status !== 0) {
    console.error(`fail ${name} ${result.status} ${output}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ok ${name}`);
}

const frontend = parseEnv('frontend/.env');
const account = JSON.parse(fs.readFileSync('backend/firebase-service-account.json', 'utf8'));

setVar('VITE_API_BASE_URL', '/api', false);
for (const name of [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]) {
  if (!frontend[name]) {
    console.error(`missing ${name}`);
    process.exitCode = 1;
    continue;
  }
  setVar(name, frontend[name], false);
}

setVar('FIREBASE_PROJECT_ID', account.project_id, false);
setVar('FIREBASE_CLIENT_EMAIL', account.client_email, true);
setVar('FIREBASE_PRIVATE_KEY', account.private_key, true);
