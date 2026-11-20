import './env.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import { createApp } from '../../app.js';
import { __setStorageForTests } from '../../services/cloudinaryService.js';
import { __setGeminiTransportForTests } from '../../services/ai/geminiClient.js';
import Authority from '../../models/Authority.js';
import Citizen from '../../models/Citizen.js';
import Contractor from '../../models/Contractor.js';
import Tender from '../../models/Tender.js';
import Project from '../../models/Project.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const asset = (name) => {
  if (name === 'sample-tender.pdf' || name === 'sample-road-repair-tender.pdf') {
    return readFileSync(path.join(here, '../../../assets/samples/tenderDocuments/sample-road-repair-tender.pdf'));
  }
  return readFileSync(path.join(here, '../../../test-assets', name));
};

export const ORIGIN = 'http://localhost:3000';
export const PASSWORD = 'correct-horse-battery';

// ---------------------------------------------------------------- fakes

/** In-memory file storage that records every upload and removal. */
export const storage = {
  uploads: [],
  removed: [],
  failNext: false,
  reset() {
    this.uploads = [];
    this.removed = [];
    this.failNext = false;
  },
  async upload(buffer, folder, mimetype) {
    if (this.failNext) {
      this.failNext = false;
      const error = new Error('The file could not be stored. Please try again.');
      error.status = 502;
      throw error;
    }
    const publicId = `test/${folder}/${this.uploads.length + 1}`;
    this.uploads.push({ publicId, folder, mimetype, bytes: buffer.length, buffer });
    return { url: `https://files.test/${publicId}.jpg`, publicId };
  },
  async remove(publicId) {
    this.removed.push(publicId);
  }
};

/**
 * Fake Gemini. Queue replies with ai.reply(obj) / ai.fail(error) / ai.raw(text);
 * with an empty queue every call fails as a provider outage.
 */
export const ai = {
  queue: [],
  calls: 0,
  reset() {
    this.queue = [];
    this.calls = 0;
  },
  reply(object) { this.queue.push({ text: JSON.stringify(object) }); },
  raw(text) { this.queue.push({ text }); },
  fail(status = 503) {
    const error = new Error(`provider error ${status}`);
    error.status = status;
    this.queue.push({ error });
  },
  transport: async () => {
    ai.calls += 1;
    const next = ai.queue.shift();
    if (!next) {
      const error = new Error('provider unavailable');
      error.status = 503;
      throw error;
    }
    if (next.error) throw next.error;
    return next.text;
  }
};

// Stored photos (baseline/before images) are fetched over HTTP by the server;
// this answers those fetches with a real JPEG, and lets tests fake the
// segmentation service.
const realFetch = globalThis.fetch;
export const network = {
  segmentation: null, // (form) => ({ status, body })
  reset() { this.segmentation = null; }
};
globalThis.fetch = async (url, options = {}) => {
  const target = String(url);
  if (target.startsWith('https://files.test/') || target.startsWith('https://images.test/')) {
    return new Response(asset('road-before.jpg'), { status: 200, headers: { 'content-type': 'image/jpeg' } });
  }
  if (target.startsWith('http://segmentation.test/') && network.segmentation) {
    const { status, body } = await network.segmentation(options.body);
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }
  if (target.startsWith('http://127.0.0.1') || target.startsWith('http://localhost')) return realFetch(url, options);
  throw new TypeError(`fetch failed: unexpected network call in test to ${target}`);
};

// ---------------------------------------------------------------- lifecycle

let replSet;

export const startHarness = async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    ...(process.env.MONGOMS_SYSTEM_BINARY ? { binary: { systemBinary: process.env.MONGOMS_SYSTEM_BINARY } } : {})
  });
  process.env.MONGODB_URI = replSet.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  __setStorageForTests(storage);
  __setGeminiTransportForTests(ai.transport);
  return createApp();
};

export const stopHarness = async () => {
  await mongoose.disconnect();
  await replSet?.stop();
};

export const resetState = async () => {
  storage.reset();
  ai.reset();
  network.reset();
  delete process.env.SEGMENTATION_SERVICE_URL;
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
};

// ---------------------------------------------------------------- factories

const hash = bcrypt.hashSync(PASSWORD, 4);
let counter = 0;
const unique = () => `${Date.now().toString(36)}${(counter += 1)}`;

export const makeOfficial = (role, overrides = {}) =>
  Authority.create({
    name: `${role} ${unique()}`,
    email: `${unique()}@officials.test`,
    uniqueUserId: `AUTH-TEST-${unique()}`.toUpperCase(),
    passwordHash: hash,
    role,
    ...overrides
  });

export const makeCitizen = (overrides = {}) =>
  Citizen.create({ name: `Citizen ${unique()}`, email: `${unique()}@citizens.test`, passwordHash: hash, ...overrides });

export const makeProjectGraph = async (overrides = {}) => {
  const contractor = await Contractor.create({
    name: `Contractor ${unique()}`,
    registrationId: `REG-${unique()}`,
    contactEmail: 'private@contractor.test',
    phone: '9876543210',
    baselineScore: 90,
    performanceScore: 90,
    trustScore: 90
  });
  const tender = await Tender.create({
    title: 'Road tender',
    contractor: contractor._id,
    fileUrl: 'https://files.test/tender.pdf',
    extractedText: 'CONFIDENTIAL TENDER TEXT',
    budgetAllocated: 'Rs 45,00,000'
  });
  const project = await Project.create({
    title: 'Village road',
    tender: tender._id,
    contractor: contractor._id,
    location: { lat: 25.3176, lng: 82.9739, address: 'Main junction' },
    beforeImageUrl: 'https://files.test/before.jpg',
    lifecycleStatus: 'Project Created',
    ...overrides
  });
  return { contractor, tender, project };
};

/** A supertest agent (keeps cookies) signed in as the given account. */
export const signIn = async (app, account) => {
  const agent = request.agent(app);
  const isOfficial = account instanceof Authority;
  const response = await agent
    .post(isOfficial ? '/api/auth/authority/login' : '/api/auth/citizen/login')
    .set('Origin', ORIGIN)
    .send({ identifier: account.email, password: PASSWORD });
  if (response.status !== 200) throw new Error(`sign-in failed: ${response.status} ${JSON.stringify(response.body)}`);
  return agent;
};

export const complaintReply = (overrides = {}) => ({
  detectedIssues: ['pothole'],
  matchScore: 40,
  flaggedAsDiscrepancy: true,
  aiReport: 'A pothole is visible on the road surface.',
  ...overrides
});

/** Files a complaint as the given citizen agent. */
export const fileComplaint = (agent, project, fields = {}) =>
  agent
    .post('/api/citizen-reports')
    .set('Origin', ORIGIN)
    .field('projectId', fields.projectId ?? String(project._id))
    .field('lat', fields.lat ?? '25.3177')
    .field('lng', fields.lng ?? '82.9740')
    .field('description', fields.description ?? 'Large pothole near the junction')
    .attach('image', fields.image ?? asset('road-after.jpg'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
