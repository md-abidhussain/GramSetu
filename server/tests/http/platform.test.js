import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { ORIGIN, makeCitizen, makeOfficial, resetState, signIn, startHarness, stopHarness } from '../helpers/harness.js';
import Notification from '../../models/Notification.js';

let app;
before(async () => { app = await startHarness(); });
after(stopHarness);
beforeEach(resetState);

describe('platform behaviour', () => {
  test('liveness and readiness', async () => {
    assert.equal((await request(app).get('/health/live')).status, 200);
    const ready = await request(app).get('/health/ready');
    assert.equal(ready.status, 200);
    assert.equal(ready.body.database, 'connected');
    assert.deepEqual(Object.keys(ready.body.features).sort(), ['cloudinaryConfigured', 'geminiConfigured', 'segmentationConfigured']);
    for (const value of Object.values(ready.body.features)) assert.equal(typeof value, 'boolean');
  });

  test('a write from a website that is not ours is refused (CSRF)', async () => {
    const response = await request(app).post('/api/auth/citizen/login').set('Origin', 'https://evil.example')
      .send({ identifier: 'x@example.com', password: 'whatever-password' });
    assert.equal(response.status, 403);
  });

  test('malformed JSON is a 400 and unknown API routes are 404', async () => {
    const bad = await request(app).post('/api/auth/citizen/login').set('Origin', ORIGIN)
      .set('Content-Type', 'application/json').send('{"identifier": ');
    assert.equal(bad.status, 400);
    assert.equal((await request(app).get('/api/does-not-exist')).status, 404);
  });

  test('responses carry security headers and no framework fingerprint', async () => {
    const response = await request(app).get('/health/live');
    assert.equal(response.headers['x-powered-by'], undefined);
    assert.ok(response.headers['x-content-type-options']);
    assert.ok(response.headers['x-request-id']);
  });

  test('server errors never expose internal details', async () => {
    const citizen = await signIn(app, await makeCitizen());
    await mongoose.connection.close();
    try {
      const response = await citizen.get('/api/citizen-reports');
      assert.ok(response.status >= 500);
      assert.doesNotMatch(JSON.stringify(response.body), /mongo|stack|at .*\.js/i);
    } finally {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  test('a user can only mark their own notifications as read', async () => {
    const owner = await makeOfficial('Inspector');
    const intruder = await signIn(app, await makeOfficial('Inspector'));
    const note = await Notification.create({ user: owner._id, userModel: 'Authority', message: 'Private' });
    const response = await intruder.patch(`/api/notifications/${note._id}/read`).set('Origin', ORIGIN);
    assert.equal(response.status, 404);
    assert.equal((await Notification.findById(note._id)).read, false);
  });

  test('a session check (/me) is not counted against the sign-in rate limit', async () => {
    const agent = await signIn(app, await makeCitizen());
    for (let index = 0; index < 30; index += 1) {
      assert.equal((await agent.get('/api/auth/me')).status, 200);
    }
  });
});
