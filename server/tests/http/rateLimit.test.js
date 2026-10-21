// Its own file (own process) so the low limit applies only here.
process.env.AUTH_RATE_LIMIT_MAX = '3';

const { after, before, test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { default: request } = await import('supertest');
const { ORIGIN, startHarness, stopHarness } = await import('../helpers/harness.js');

let app;
before(async () => { app = await startHarness(); });
after(stopHarness);

test('repeated sign-in attempts are rate limited', async () => {
  const attempt = () => request(app).post('/api/auth/citizen/login').set('Origin', ORIGIN)
    .send({ identifier: 'someone@example.com', password: 'wrong-password-x' });
  for (let index = 0; index < 3; index += 1) assert.equal((await attempt()).status, 401);
  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers['ratelimit'] || blocked.headers['ratelimit-policy'], 'standard rate-limit headers present');
});
