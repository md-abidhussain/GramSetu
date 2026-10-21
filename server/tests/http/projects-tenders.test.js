import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  ORIGIN, ai, asset, makeCitizen, makeOfficial, makeProjectGraph, resetState, signIn, startHarness, stopHarness, storage
} from '../helpers/harness.js';
import Project from '../../models/Project.js';
import Tender from '../../models/Tender.js';
import Contractor from '../../models/Contractor.js';

let app;
before(async () => { app = await startHarness(); });
after(stopHarness);
beforeEach(resetState);

const comparisonReply = (overrides = {}) => ({
  completionScore: 86, riskLevel: 'Low', projectHealth: 'Healthy', notes: 'The new surface is visible.', ...overrides
});

describe('public project data', () => {
  test('anonymous visitors and citizens get public fields only', async () => {
    await makeProjectGraph();
    const citizen = await signIn(app, await makeCitizen());
    for (const client of [request(app), citizen]) {
      const response = await client.get('/api/projects');
      assert.equal(response.status, 200);
      const [project] = response.body;
      assert.equal(project.title, 'Village road');
      assert.equal(project.tender.title, 'Road tender');
      assert.equal(project.tender.extractedText, undefined);
      assert.equal(project.tender.fileUrl, undefined);
      assert.equal(project.tender.budgetAllocated, undefined);
      assert.equal(project.contractor.contactEmail, undefined);
      assert.equal(project.contractor.phone, undefined);
      assert.ok(project.contractor.name);
    }
  });

  test('officials get tender and contractor details', async () => {
    await makeProjectGraph();
    const official = await signIn(app, await makeOfficial('PWD Engineer'));
    const [project] = (await official.get('/api/projects')).body;
    assert.equal(project.tender.fileUrl, 'https://files.test/tender.pdf');
    assert.equal(project.contractor.contactEmail, 'private@contractor.test');
  });

  test('the project PDF report is for officials only', async () => {
    const { project } = await makeProjectGraph();
    const citizen = await signIn(app, await makeCitizen());
    assert.equal((await citizen.get(`/api/projects/${project._id}/report`)).status, 403);
    assert.equal((await request(app).get(`/api/projects/${project._id}/report`)).status, 401);
  });

  test('the public lifecycle view hides officials\' names', async () => {
    const { project } = await makeProjectGraph();
    await Project.updateOne({ _id: project._id }, { $push: { statusHistory: { status: 'Project Created', updatedBy: 'Er. Private Name' } } });
    const response = await request(app).get(`/api/projects/${project._id}/lifecycle`);
    assert.equal(response.body.history[0].updatedBy, undefined);
    assert.deepEqual(response.body.allowedNextStatuses, []);
  });
});

describe('project lifecycle', () => {
  const advance = (agent, project, status) =>
    agent.patch(`/api/projects/${project._id}/lifecycle`).set('Origin', ORIGIN).send({ status });

  const complete = (agent, project) =>
    agent.patch(`/api/projects/${project._id}/complete`).set('Origin', ORIGIN)
      .attach('image', asset('road-after.jpg'), { filename: 'after.jpg', contentType: 'image/jpeg' });

  test('nobody can mark a project "AI Verified" by hand', async () => {
    const { project } = await makeProjectGraph({ lifecycleStatus: 'Waiting for AI Verification' });
    const admin = await signIn(app, await makeOfficial('Admin'));
    const response = await advance(admin, project, 'AI Verified');
    assert.equal(response.status, 409);
    assert.equal((await Project.findById(project._id)).lifecycleStatus, 'Waiting for AI Verification');
  });

  test('completion photos before construction has started are refused before any cost', async () => {
    const { project } = await makeProjectGraph({ lifecycleStatus: 'Project Created' });
    const engineer = await signIn(app, await makeOfficial('PWD Engineer'));
    const response = await complete(engineer, project);
    assert.equal(response.status, 409);
    assert.equal(storage.uploads.length, 0);
    assert.equal(ai.calls, 0);
  });

  test('a real AI comparison moves the project to "AI Verified" with its score', async () => {
    const { project } = await makeProjectGraph({ lifecycleStatus: 'Construction Started' });
    const engineer = await signIn(app, await makeOfficial('PWD Engineer'));
    ai.reply(comparisonReply());

    const response = await complete(engineer, project);
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.lifecycleStatus, 'AI Verified');
    assert.equal(response.body.aiAssessment.status, 'completed');
    assert.equal(response.body.completionScore, 86);
    assert.equal(response.body.status, 'Verified');
  });

  test('if the AI is down, the project waits with no score, and can be retried', async () => {
    const { project } = await makeProjectGraph({ lifecycleStatus: 'Construction Started' });
    const engineer = await signIn(app, await makeOfficial('PWD Engineer'));

    const failed = await complete(engineer, project);
    assert.equal(failed.status, 200);
    assert.equal(failed.body.lifecycleStatus, 'Waiting for AI Verification');
    assert.equal(failed.body.aiAssessment.status, 'unavailable');
    assert.equal(failed.body.completionScore, null);
    assert.equal(failed.body.riskLevel, null);
    assert.equal(failed.body.status, 'Pending');

    ai.reply(comparisonReply({ completionScore: 55, riskLevel: 'High', projectHealth: 'At Risk' }));
    const retried = await engineer.post(`/api/projects/${project._id}/ai-verification`).set('Origin', ORIGIN);
    assert.equal(retried.status, 200);
    assert.equal(retried.body.lifecycleStatus, 'AI Verified');
    assert.equal(retried.body.completionScore, 55);
    assert.equal(retried.body.status, 'Flagged');
  });

  test('final approval needs a deciding role', async () => {
    const { project } = await makeProjectGraph({ lifecycleStatus: 'Under Authority Review' });
    const inspector = await signIn(app, await makeOfficial('Inspector'));
    assert.equal((await advance(inspector, project, 'Approved')).status, 403);
    const district = await signIn(app, await makeOfficial('District Authority'));
    assert.equal((await advance(district, project, 'Approved')).status, 200);
  });

  test('skipping stages is refused', async () => {
    const { project } = await makeProjectGraph({ lifecycleStatus: 'Project Created' });
    const district = await signIn(app, await makeOfficial('District Authority'));
    assert.equal((await advance(district, project, 'Approved')).status, 409);
  });

  test('only some roles may create projects', async () => {
    const { tender } = await makeProjectGraph();
    const inspector = await signIn(app, await makeOfficial('Inspector'));
    const response = await inspector.post('/api/projects').set('Origin', ORIGIN)
      .field('title', 'New').field('tenderId', String(tender._id)).field('lat', '25').field('lng', '82')
      .attach('image', asset('road-before.jpg'), { filename: 'b.jpg', contentType: 'image/jpeg' });
    assert.equal(response.status, 403);
  });
});

describe('tenders', () => {
  const upload = (agent, contractor, file = asset('sample-tender.pdf')) =>
    agent.post('/api/tenders').set('Origin', ORIGIN)
      .field('title', 'Rural road resurfacing')
      .field('contractorId', String(contractor._id))
      .attach('file', file, { filename: 'tender.pdf', contentType: 'application/pdf' });

  test('tenders are for officials only', async () => {
    assert.equal((await request(app).get('/api/tenders')).status, 401);
    const citizen = await signIn(app, await makeCitizen());
    assert.equal((await citizen.get('/api/tenders')).status, 403);
  });

  test('a real AI analysis is stored with its status', async () => {
    const { contractor } = await makeProjectGraph();
    const engineer = await signIn(app, await makeOfficial('PWD Engineer'));
    ai.reply({
      summary: 'Road resurfacing.', budgetAllocated: 'Rs 45 lakh',
      budgetAnalysis: { flagged: false, reason: 'Consistent.' }, timelineAnalysis: { flagged: true, reason: 'Tight.' },
      riskScore: 35, riskLevel: 'Low', recommendation: 'Proceed.'
    });
    const response = await upload(engineer, contractor);
    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(response.body.aiAssessment.status, 'completed');
    assert.equal(response.body.riskScore, 35);
    assert.equal(response.body.extractedText, undefined, 'large text is not sent back');
  });

  test('without AI, the tender is stored with no risk rating at all', async () => {
    const { contractor } = await makeProjectGraph();
    const engineer = await signIn(app, await makeOfficial('PWD Engineer'));
    const response = await upload(engineer, contractor);
    assert.equal(response.status, 201);
    assert.equal(response.body.aiAssessment.status, 'unavailable');
    assert.equal(response.body.riskLevel, null);
    assert.equal(response.body.riskScore, undefined);
    assert.equal(response.body.aiSummary, undefined);
  });

  test('a damaged PDF is a 400 and nothing is stored', async () => {
    const { contractor } = await makeProjectGraph();
    const engineer = await signIn(app, await makeOfficial('PWD Engineer'));
    const before = await Tender.countDocuments();
    const broken = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('garbage that is not a pdf body')]);
    const response = await upload(engineer, contractor, broken);
    assert.equal(response.status, 400);
    assert.equal(storage.uploads.length, 0);
    assert.equal(await Tender.countDocuments(), before);
  });

  test('an image renamed to .pdf is refused', async () => {
    const { contractor } = await makeProjectGraph();
    const engineer = await signIn(app, await makeOfficial('PWD Engineer'));
    assert.equal((await upload(engineer, contractor, asset('road-before.jpg'))).status, 400);
  });

  test('an Inspector cannot upload tenders', async () => {
    const { contractor } = await makeProjectGraph();
    const inspector = await signIn(app, await makeOfficial('Inspector'));
    assert.equal((await upload(inspector, contractor)).status, 403);
  });
});

describe('contractors', () => {
  test('scores in the request are clamped and an Inspector cannot create contractors', async () => {
    const district = await signIn(app, await makeOfficial('District Authority'));
    const created = await district.post('/api/contractors').set('Origin', ORIGIN)
      .send({ name: 'New Co', registrationId: 'reg-1', performanceScore: 9999 });
    assert.equal(created.status, 201);
    assert.equal(created.body.performanceScore, 100);
    assert.equal(created.body.registrationId, 'REG-1');

    const duplicate = await district.post('/api/contractors').set('Origin', ORIGIN).send({ name: 'Again', registrationId: 'REG-1' });
    assert.equal(duplicate.status, 409);

    const inspector = await signIn(app, await makeOfficial('Inspector'));
    assert.equal((await inspector.post('/api/contractors').set('Origin', ORIGIN).send({ name: 'X', registrationId: 'Y' })).status, 403);
  });

  test('analysis reports no average when nothing has a real AI score', async () => {
    const { contractor } = await makeProjectGraph();
    const official = await signIn(app, await makeOfficial('Government Officer'));
    const response = await official.get(`/api/contractors/${contractor._id}/analysis`);
    assert.equal(response.status, 200);
    assert.equal(response.body.metrics.averageCompletionScore, null);
    assert.equal(response.body.metrics.trustScore, 90);
    assert.ok(await Contractor.exists({ _id: contractor._id }));
  });
});
