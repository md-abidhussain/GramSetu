// Post-deploy smoke test. Read-only except for one sign-in/sign-out with a demo
// account. Usage:
//   node scripts/smoke.js https://gramsetu-india.vercel.app
// (Use the front-end URL: it proxies /api, which is the path real users take.)
const base = (process.argv[2] || process.env.SMOKE_URL || '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: node scripts/smoke.js <front-end URL>');
  process.exit(2);
}

const results = [];
const check = async (name, run) => {
  try {
    await run();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
  }
};
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const get = (path, init) => fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(90_000) });

await check('API answers (cold start may take a minute)', async () => {
  const response = await get('/api/projects');
  expect(response.ok, `status ${response.status}`);
});

await check('public projects do not expose tender documents or contractor contacts', async () => {
  const projects = await (await get('/api/projects')).json();
  for (const project of projects) {
    expect(project.tender?.fileUrl === undefined, 'tender fileUrl exposed');
    expect(project.tender?.extractedText === undefined, 'tender text exposed');
    expect(project.contractor?.phone === undefined && project.contractor?.contactEmail === undefined, 'contractor contact exposed');
  }
});

await check('tenders require sign-in', async () => {
  expect((await get('/api/tenders')).status === 401, 'expected 401');
});

await check('a query-operator login is refused', async () => {
  const response = await get('/api/auth/citizen/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ identifier: { $ne: null }, password: { $ne: null } })
  });
  expect(response.status === 400, `status ${response.status}`);
});

await check('demo sign-in sets a secure HttpOnly cookie and no token in the body', async () => {
  const response = await get('/api/auth/citizen/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ identifier: 'citizen@gmail.com', password: 'citizen123' })
  });
  if (response.status === 401) throw new Error('demo citizen account not present (was the database seeded?)');
  expect(response.ok, `status ${response.status}`);
  const body = await response.json();
  expect(body.token === undefined, 'token returned in body');
  const cookie = response.headers.get('set-cookie') || '';
  expect(/HttpOnly/i.test(cookie), 'cookie not HttpOnly');
  if (base.startsWith('https://')) expect(/Secure/i.test(cookie), 'cookie not Secure: set NODE_ENV=production');
  const token = cookie.split(';')[0];
  const me = await get('/api/auth/me', { headers: { Cookie: token } });
  expect(me.ok, `/me status ${me.status}`);
  await get('/api/auth/logout', { method: 'POST', headers: { Cookie: token, Origin: base } });
  expect((await get('/api/auth/me', { headers: { Cookie: token } })).status === 401, 'token still valid after logout');
});

await check('the old public Admin password is rejected', async () => {
  const response = await get('/api/auth/authority/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ identifier: 'admin@gramsetu.gov', password: 'authority123' })
  });
  expect(response.status === 401, `status ${response.status}`);
});

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.ok ? '' : `  -> ${result.error}`}`);
}
process.exit(results.every((result) => result.ok) ? 0 : 1);
