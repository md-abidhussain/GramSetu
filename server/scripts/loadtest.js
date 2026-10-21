// A small, local load test of the busiest read endpoints. It measures THIS
// machine with a local database: useful for spotting regressions between
// versions, not a statement about production capacity.
//   node scripts/loadtest.js http://localhost:5055
import autocannon from 'autocannon';

const base = (process.argv[2] || 'http://localhost:5000').replace(/\/$/, '');
const scenarios = [
  { title: 'GET /api/projects (public list)', url: `${base}/api/projects` },
  { title: 'GET /health/ready', url: `${base}/health/ready` }
];

for (const scenario of scenarios) {
  const result = await autocannon({ url: scenario.url, connections: 20, duration: 10 });
  console.log(`${scenario.title}: ${Math.round(result.requests.average)} req/s, ` +
    `latency p50 ${result.latency.p50} ms, p99 ${result.latency.p99} ms, errors ${result.errors}, non-2xx ${result.non2xx}`);
}
