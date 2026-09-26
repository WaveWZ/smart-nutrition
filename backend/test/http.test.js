const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../server');

async function withServer(run) {
  const app = createApp({
    nodeEnv: 'test',
    frontendOrigin: 'http://localhost:5173',
    port: 0,
  });
  const server = app.listen(0);
  await once(server, 'listening');

  try {
    return await run(server.address().port);
  } finally {
    server.close();
  }
}

async function request(port, method, path, body) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

test('health and unknown routes', async () => {
  await withServer(async (port) => {
    const health = await request(port, 'GET', '/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.status, 'ok');

    const missing = await request(port, 'GET', '/api/unknown');
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, 'route_not_found');
  });
});

test('profile onboarding rejects an incomplete body before touching Firestore', async () => {
  await withServer(async (port) => {
    const response = await request(port, 'POST', '/api/profiles', { age: 22 });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'validation_error');
    assert.ok(response.body.error.details.some((detail) => detail.includes('gender')));
  });
});

test('recommendations require a local calendar date', async () => {
  await withServer(async (port) => {
    const response = await request(port, 'GET', '/api/profiles/demo-22m-80kg-179cm/recommendations');
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'invalid_date');
  });
});
