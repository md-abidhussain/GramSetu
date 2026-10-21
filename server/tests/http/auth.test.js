import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import {
  ORIGIN, PASSWORD, makeCitizen, makeOfficial, resetState, signIn, startHarness, stopHarness
} from '../helpers/harness.js';
import Citizen from '../../models/Citizen.js';
import Authority from '../../models/Authority.js';

let app;
before(async () => { app = await startHarness(); });
after(stopHarness);
beforeEach(resetState);

const sessionCookie = (response) => (response.headers['set-cookie'] || []).find((cookie) => cookie.startsWith('token='));

describe('citizen registration and sign-in', () => {
  test('registration sets an HttpOnly SameSite=Lax cookie and never returns the token', async () => {
    const response = await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
      .send({ name: 'Asha', email: 'Asha@Example.com', password: PASSWORD });

    assert.equal(response.status, 201);
    assert.equal(response.body.token, undefined, 'token must not be in the body');
    assert.equal(response.body.email, 'asha@example.com');
    const cookie = sessionCookie(response);
    assert.ok(cookie, 'session cookie set');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.doesNotMatch(cookie, /Secure/, 'not Secure outside production');
  });

  test('the cookie is Secure in production', async () => {
    process.env.NODE_ENV = 'production';
    try {
      const response = await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
        .send({ name: 'Ravi', phone: '9876543210', password: PASSWORD });
      assert.equal(response.status, 201);
      assert.match(sessionCookie(response), /Secure/);
    } finally {
      process.env.NODE_ENV = 'test';
    }
  });

  test('phone numbers are stored in one form, so +91 duplicates are caught', async () => {
    await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
      .send({ name: 'A', phone: '98765 43210', password: PASSWORD }).expect(201);
    const second = await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
      .send({ name: 'B', phone: '+919876543210', password: PASSWORD });
    assert.equal(second.status, 409);
  });

  test('a duplicate gets one generic message that does not say which field matched', async () => {
    await makeCitizen({ email: 'taken@example.com' });
    const response = await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
      .send({ name: 'X', email: 'taken@example.com', password: PASSWORD });
    assert.equal(response.status, 409);
    assert.doesNotMatch(response.body.message, /email|mobile/i);
  });

  test('rejects short passwords and bad emails', async () => {
    const short = await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
      .send({ name: 'X', email: 'x@example.com', password: 'short' });
    assert.equal(short.status, 400);
    const badEmail = await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
      .send({ name: 'X', email: 'not-an-email', password: PASSWORD });
    assert.equal(badEmail.status, 400);
  });

  test('a role in the registration body is ignored: citizens cannot register as officials', async () => {
    const response = await request(app).post('/api/auth/citizen/register').set('Origin', ORIGIN)
      .send({ name: 'Mallory', email: 'm@example.com', password: PASSWORD, role: 'Admin', isAuthority: true });
    assert.equal(response.status, 201);
    assert.equal(response.body.role, 'citizen');
    assert.equal(await Authority.countDocuments(), 0);
  });

  test('login with a query operator instead of an identifier is refused', async () => {
    await makeCitizen();
    const response = await request(app).post('/api/auth/citizen/login').set('Origin', ORIGIN)
      .send({ identifier: { $ne: null }, password: { $ne: null } });
    assert.equal(response.status, 400);
  });

  test('wrong password and unknown account give the same answer', async () => {
    const citizen = await makeCitizen();
    const wrong = await request(app).post('/api/auth/citizen/login').set('Origin', ORIGIN)
      .send({ identifier: citizen.email, password: 'wrong-password-here' });
    const unknown = await request(app).post('/api/auth/citizen/login').set('Origin', ORIGIN)
      .send({ identifier: 'nobody@example.com', password: 'wrong-password-here' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.message, unknown.body.message);
  });
});

describe('sessions', () => {
  test('/me works with the cookie and fails without it', async () => {
    const citizen = await makeCitizen();
    const agent = await signIn(app, citizen);
    const me = await agent.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.role, 'citizen');
    assert.equal((await request(app).get('/api/auth/me')).status, 401);
  });

  test('a Bearer header is not accepted: sessions are cookie-only', async () => {
    const citizen = await makeCitizen();
    const token = jwt.sign({ id: String(citizen._id), kind: 'citizen', tv: 0 }, process.env.JWT_SECRET);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(response.status, 401);
  });

  test('a token signed with a different secret is refused', async () => {
    const citizen = await makeCitizen();
    const forged = jwt.sign({ id: String(citizen._id), kind: 'citizen', tv: 0 }, 'super_secure_jwt_token_secret_phrase');
    const response = await request(app).get('/api/auth/me').set('Cookie', `token=${forged}`);
    assert.equal(response.status, 401);
  });

  test('a citizen id cannot be presented as an official (kind is checked)', async () => {
    const citizen = await makeCitizen();
    const token = jwt.sign({ id: String(citizen._id), kind: 'authority', tv: 0 }, process.env.JWT_SECRET);
    const response = await request(app).get('/api/dashboard/summary').set('Cookie', `token=${token}`);
    assert.equal(response.status, 401);
  });

  test('logout revokes the token everywhere, including a copy taken earlier', async () => {
    const citizen = await makeCitizen();
    const agent = await signIn(app, citizen);
    const copied = jwt.sign({ id: String(citizen._id), kind: 'citizen', tv: 0 }, process.env.JWT_SECRET);

    await agent.post('/api/auth/logout').set('Origin', ORIGIN).expect(200);

    assert.equal((await agent.get('/api/auth/me')).status, 401);
    assert.equal((await request(app).get('/api/auth/me').set('Cookie', `token=${copied}`)).status, 401);
    assert.equal((await Citizen.findById(citizen._id)).tokenVersion, 1);
  });

  test('an expired token is refused', async () => {
    const citizen = await makeCitizen();
    const expired = jwt.sign({ id: String(citizen._id), kind: 'citizen', tv: 0, exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET);
    assert.equal((await request(app).get('/api/auth/me').set('Cookie', `token=${expired}`)).status, 401);
  });
});

describe('official accounts', () => {
  test('only an Admin can create officials', async () => {
    const officer = await makeOfficial('District Authority');
    const agent = await signIn(app, officer);
    const response = await agent.post('/api/auth/authority/register').set('Origin', ORIGIN)
      .send({ name: 'New', email: 'new@officials.test', password: PASSWORD, role: 'Admin' });
    assert.equal(response.status, 403);

    const anonymous = await request(app).post('/api/auth/authority/register').set('Origin', ORIGIN)
      .send({ name: 'New', email: 'new@officials.test', password: PASSWORD, role: 'Admin' });
    assert.equal(anonymous.status, 401);
  });

  test('an Admin creating an official stays signed in as the Admin', async () => {
    const admin = await makeOfficial('Admin');
    const agent = await signIn(app, admin);
    const response = await agent.post('/api/auth/authority/register').set('Origin', ORIGIN)
      .send({ name: 'Insp', email: 'insp@officials.test', password: PASSWORD, role: 'Inspector' });

    assert.equal(response.status, 201);
    assert.equal(sessionCookie(response), undefined, 'no session issued for the new account');
    const me = await agent.get('/api/auth/me');
    assert.equal(String(me.body._id), String(admin._id));
    assert.equal(me.body.role, 'Admin');
  });

  test('officials sign in with their official id regardless of case', async () => {
    const official = await makeOfficial('Inspector', { uniqueUserId: 'AUTH-2026-123456789' });
    const response = await request(app).post('/api/auth/authority/login').set('Origin', ORIGIN)
      .send({ identifier: 'auth-2026-123456789', password: PASSWORD });
    assert.equal(response.status, 200);
    assert.equal(response.body.uniqueUserId, official.uniqueUserId);
    assert.equal(response.body.token, undefined);
  });

  test('a citizen session cannot reach official routes', async () => {
    const agent = await signIn(app, await makeCitizen());
    for (const path of ['/api/dashboard/summary', '/api/tenders', '/api/contractors', '/api/auth/inspectors']) {
      assert.equal((await agent.get(path)).status, 403, path);
    }
  });
});
