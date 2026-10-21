import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  ORIGIN, ai, asset, complaintReply, fileComplaint, makeCitizen, makeOfficial, makeProjectGraph, network,
  resetState, signIn, startHarness, stopHarness, storage
} from '../helpers/harness.js';
import CitizenReport from '../../models/CitizenReport.js';
import Citizen from '../../models/Citizen.js';
import Contractor from '../../models/Contractor.js';
import Project from '../../models/Project.js';
import Reward from '../../models/Reward.js';

let app;
before(async () => { app = await startHarness(); });
after(stopHarness);
beforeEach(resetState);

describe('filing a complaint', () => {
  test('stores a real AI review when the AI answers', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    ai.reply(complaintReply({ detectedIssues: ['Pothole', 'cracks', 'something-unknown'] }));

    const response = await fileComplaint(agent, project);
    assert.equal(response.status, 201, JSON.stringify(response.body));
    assert.equal(response.body.aiAssessment.status, 'completed');
    // Normalised to the allowed list; unknown labels dropped instead of failing the complaint.
    assert.deepEqual(response.body.detectedIssues, ['pothole', 'crack']);
    assert.equal(response.body.matchScore, 40);
    assert.equal(response.body.severity, 'Medium');
    assert.equal(response.body.geoVerified, true);
    assert.equal(storage.uploads.length, 1);
  });

  test('when the AI is down, the complaint is saved with NO invented scores', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    // empty queue: every call fails as a provider outage

    const response = await fileComplaint(agent, project);
    assert.equal(response.status, 201);
    assert.equal(response.body.aiAssessment.status, 'unavailable');
    assert.equal(response.body.matchScore, null);
    assert.equal(response.body.aiReport, undefined);
    assert.deepEqual(response.body.detectedIssues, []);
    assert.equal(response.body.severity, 'Unassessed');
    assert.equal(ai.calls, 3, 'a transient failure is retried twice, then given up');
  });

  test('malformed or out-of-range AI output is rejected, not stored', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    ai.raw('this is not json');
    ai.reply(complaintReply({ matchScore: 140 }));
    ai.reply(complaintReply({ matchScore: 'high' }));

    const response = await fileComplaint(agent, project);
    assert.equal(response.status, 201);
    assert.equal(response.body.aiAssessment.status, 'invalid_response');
    assert.equal(response.body.matchScore, null);
  });

  test('a rejected API key is not retried', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    ai.fail(403);
    const response = await fileComplaint(agent, project);
    assert.equal(response.body.aiAssessment.status, 'unavailable');
    assert.equal(response.body.aiAssessment.reason, 'not_authorized');
    assert.equal(ai.calls, 1);
  });

  test('simulated detections are labelled and never raise severity', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    process.env.SEGMENTATION_SERVICE_URL = 'http://segmentation.test';
    network.segmentation = () => ({
      status: 200,
      body: {
        inferenceMode: 'demo_simulation',
        defects: [{ type: 'pothole', confidence: 0.88, areaFractionOfImage: 0.5, boundingBoxPixels: { x: 1, y: 1, width: 10, height: 10 } }]
      }
    });

    const response = await fileComplaint(agent, project);
    assert.equal(response.status, 201);
    assert.equal(response.body.segmentation.status, 'simulated');
    assert.equal(response.body.segmentation.defects[0].simulated, true);
    assert.equal(response.body.segmentation.defects[0].confidence, null, 'no made-up confidence');
    assert.equal(response.body.severity, 'Unassessed', 'AI was down and the only detection was simulated');
  });

  test('real detections are stored and inform severity', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    process.env.SEGMENTATION_SERVICE_URL = 'http://segmentation.test';
    network.segmentation = () => ({
      status: 200,
      body: {
        inferenceMode: 'real_inference',
        modelTask: 'detect',
        defects: [{ type: 'openmanhole', confidence: 0.71, measurementBasis: 'bounding_box', areaPixels: 900, areaFractionOfImage: 0.02, boundingBoxPixels: { x: 1, y: 1, width: 30, height: 30 } }]
      }
    });

    const response = await fileComplaint(agent, project);
    assert.equal(response.body.segmentation.status, 'completed');
    assert.equal(response.body.segmentation.defects[0].type, 'open_manhole');
    assert.equal(response.body.severity, 'High', 'an open manhole is an immediate hazard');
    assert.deepEqual(response.body.severityBasis, ['defect_detection']);
  });

  test('a model that is not loaded is recorded as such', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    process.env.SEGMENTATION_SERVICE_URL = 'http://segmentation.test';
    network.segmentation = () => ({ status: 503, body: { inferenceMode: 'model_unavailable', detail: 'weights missing' } });
    const response = await fileComplaint(agent, project);
    assert.equal(response.body.segmentation.status, 'model_unavailable');
    assert.deepEqual(response.body.segmentation.defects, []);
  });

  test('a far-away photo is stored as not geo-verified', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    const response = await fileComplaint(agent, project, { lat: '25.40', lng: '83.10' });
    assert.equal(response.body.geoVerified, false);
    assert.ok(response.body.distanceFromProjectMeters > 1000);
  });

  test('a renamed non-image is refused before anything is stored or analysed', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    const response = await fileComplaint(agent, project, { image: Buffer.from('MZ\x90\x00 pretend program') });
    assert.equal(response.status, 400);
    assert.equal(storage.uploads.length, 0);
    assert.equal(ai.calls, 0);
  });

  test('an oversized photo gets 413', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    const big = Buffer.concat([asset('road-after.jpg'), Buffer.alloc(6 * 1024 * 1024)]);
    const response = await fileComplaint(agent, project, { image: big });
    assert.equal(response.status, 413);
  });

  test('missing fields and bad coordinates are 400s', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    assert.equal((await fileComplaint(agent, project, { lat: '' })).status, 400);
    assert.equal((await fileComplaint(agent, project, { lat: '200' })).status, 400);
    assert.equal((await fileComplaint(agent, project, { projectId: 'not-an-id' })).status, 400);
    assert.equal((await fileComplaint(agent, project, { description: '   ' })).status, 400);
  });

  test('if storage fails, the citizen gets an error and nothing half-saved remains', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    storage.failNext = true;
    const response = await fileComplaint(agent, project);
    assert.equal(response.status, 502);
    assert.equal(await CitizenReport.countDocuments(), 0);
  });

  test('officials and anonymous callers cannot file citizen complaints', async () => {
    const { project } = await makeProjectGraph();
    const official = await signIn(app, await makeOfficial('District Authority'));
    assert.equal((await fileComplaint(official, project)).status, 403);
    assert.equal((await fileComplaint(request.agent(app), project)).status, 401);
  });

  test('an unreviewed complaint does not change the project or the contractor', async () => {
    const { project, contractor } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    for (let index = 0; index < 3; index += 1) {
      ai.reply(complaintReply());
      await fileComplaint(agent, project, { lat: String(25.3176 + index * 0.001) }).expect(201);
    }
    const unchangedProject = await Project.findById(project._id);
    const unchangedContractor = await Contractor.findById(contractor._id);
    assert.equal(unchangedProject.projectHealth, 'Healthy');
    assert.equal(unchangedProject.status, 'Pending');
    assert.equal(unchangedContractor.trustScore, 90);
  });

  test('a second complaint at the same spot is marked as a possible duplicate', async () => {
    const { project } = await makeProjectGraph();
    const agent = await signIn(app, await makeCitizen());
    const first = await fileComplaint(agent, project);
    const second = await fileComplaint(agent, project);
    assert.equal(second.body.status, 'Duplicate Detected');
    assert.equal(String(second.body.duplicateOf), String(first.body._id));
  });
});

describe('who can see a complaint', () => {
  test('a citizen sees only their own, by list, by id and as a PDF', async () => {
    const { project } = await makeProjectGraph();
    const alice = await signIn(app, await makeCitizen());
    const bob = await signIn(app, await makeCitizen());
    const alicesComplaint = (await fileComplaint(alice, project)).body;

    assert.equal((await bob.get(`/api/citizen-reports/${alicesComplaint._id}`)).status, 404);
    assert.equal((await bob.get(`/api/citizen-reports/${alicesComplaint._id}/report`)).status, 404);
    assert.deepEqual((await bob.get('/api/citizen-reports')).body, []);

    assert.equal((await alice.get(`/api/citizen-reports/${alicesComplaint._id}`)).status, 200);
    assert.equal((await alice.get('/api/citizen-reports')).body.length, 1);
  });

  test('officials see all complaints with the reporter\'s contact details', async () => {
    const { project } = await makeProjectGraph();
    const citizen = await makeCitizen();
    await fileComplaint(await signIn(app, citizen), project);
    const official = await signIn(app, await makeOfficial('Government Officer'));
    const list = await official.get('/api/citizen-reports');
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].citizen.email, citizen.email);
    assert.equal(list.headers['x-total-count'], '1');
  });

  test('a malformed id is a 400, not a server error', async () => {
    const agent = await signIn(app, await makeCitizen());
    assert.equal((await agent.get('/api/citizen-reports/not-a-real-id')).status, 400);
  });
});

describe('the inspection and decision workflow', () => {
  const setup = async () => {
    const { project, contractor } = await makeProjectGraph();
    const citizen = await makeCitizen();
    const citizenAgent = await signIn(app, citizen);
    ai.reply(complaintReply());
    const complaint = (await fileComplaint(citizenAgent, project)).body;
    const district = await signIn(app, await makeOfficial('District Authority'));
    const inspectorAccount = await makeOfficial('Inspector');
    const inspector = await signIn(app, inspectorAccount);
    const otherInspector = await signIn(app, await makeOfficial('Inspector'));
    return { project, contractor, citizen, complaint, district, inspector, inspectorAccount, otherInspector };
  };

  const assign = (agent, complaint, inspectorAccount) =>
    agent.post('/api/citizen-reports/assign-inspector').set('Origin', ORIGIN)
      .send({ reportId: complaint._id, inspectorId: inspectorAccount._id });

  const uploadEvidence = (agent, complaint) =>
    agent.post('/api/citizen-reports/upload-verification').set('Origin', ORIGIN)
      .field('reportId', String(complaint._id))
      .field('inspectorNotes', 'Patched and compacted.')
      .attach('image', asset('road-before.jpg'), { filename: 'after.jpg', contentType: 'image/jpeg' });

  const decide = (agent, complaint, decision) =>
    agent.post('/api/citizen-reports/resolve').set('Origin', ORIGIN)
      .send({ reportId: complaint._id, decision, resolutionSummary: 'Checked on site.' });

  test('only the assigned inspector can schedule or upload evidence', async () => {
    const { complaint, district, inspector, inspectorAccount, otherInspector } = await setup();
    await assign(district, complaint, inspectorAccount).expect(200);

    const date = new Date(Date.now() + 86_400_000).toISOString();
    const wrong = await otherInspector.post('/api/citizen-reports/schedule-inspection').set('Origin', ORIGIN)
      .send({ reportId: complaint._id, date });
    assert.equal(wrong.status, 403);
    assert.equal((await uploadEvidence(otherInspector, complaint)).status, 403);

    const right = await inspector.post('/api/citizen-reports/schedule-inspection').set('Origin', ORIGIN)
      .send({ reportId: complaint._id, date });
    assert.equal(right.status, 200);
  });

  test('a complaint cannot be accepted before an inspection', async () => {
    const { complaint, district } = await setup();
    const response = await decide(district, complaint, 'Accepted');
    assert.equal(response.status, 409);
    assert.equal((await CitizenReport.findById(complaint._id)).status, 'Authority Notification');
  });

  test('an inspector cannot make the final decision', async () => {
    const { complaint, inspector } = await setup();
    assert.equal((await decide(inspector, complaint, 'Rejected')).status, 403);
  });

  test('evidence upload records a real repair review and one honest status', async () => {
    const { complaint, district, inspector, inspectorAccount } = await setup();
    await assign(district, complaint, inspectorAccount).expect(200);
    ai.reply({ repairVisible: true, notes: 'The pothole has been filled.' });

    const response = await uploadEvidence(inspector, complaint);
    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'Inspector Uploads Verification');
    assert.equal(response.body.repairAssessment.status, 'completed');
    assert.equal(response.body.repairAssessment.repairVisible, true);
  });

  test('accepting pays the citizen once, even if the request is sent twice at the same moment', async () => {
    const { complaint, district, inspector, inspectorAccount, citizen, project, contractor } = await setup();
    await assign(district, complaint, inspectorAccount).expect(200);
    await uploadEvidence(inspector, complaint).expect(200);

    const [first, second] = await Promise.all([decide(district, complaint, 'Accepted'), decide(district, complaint, 'Accepted')]);
    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, [200, 409]);

    const third = await decide(district, complaint, 'Accepted');
    assert.equal(third.status, 409);

    assert.equal((await Citizen.findById(citizen._id)).points, 150);
    assert.equal(await Reward.countDocuments({ citizen: citizen._id }), 1);

    // Only now, after an official accepted it, does it count against the project.
    const updatedProject = await Project.findById(project._id);
    assert.equal(updatedProject.verifiedComplaintCount, 1);
    assert.equal(updatedProject.status, 'Flagged');
    const updatedContractor = await Contractor.findById(contractor._id);
    assert.ok(updatedContractor.trustScore < 90, 'contractor score reflects the verified complaint');
  });

  test('a rejected complaint cannot be reopened by accepting it', async () => {
    const { complaint, district } = await setup();
    await decide(district, complaint, 'Rejected').expect(200);
    assert.equal((await decide(district, complaint, 'Accepted')).status, 409);
  });

  test('an unknown decision value is refused', async () => {
    const { complaint, district } = await setup();
    assert.equal((await decide(district, complaint, 'Resolution Published')).status, 400);
  });
});
