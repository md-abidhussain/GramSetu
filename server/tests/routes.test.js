import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

// Importing a route file runs it, so a middleware used without being imported
// throws here. That is a mistake no other test catches: the server only fails
// when it starts, and the unit tests never load these files.
const ROUTE_FILES = [
  'authRoutes',
  'tenderRoutes',
  'projectRoutes',
  'citizenRoutes',
  'dashboardRoutes',
  'notificationRoutes',
  'rewardRoutes',
  'contractorRoutes'
];

describe('route files', () => {
  for (const name of ROUTE_FILES) {
    test(`${name} loads and exports a router`, async () => {
      const module = await import(`../routes/${name}.js`);
      const router = module.default;

      assert.ok(router, `${name} has no default export`);
      assert.equal(typeof router, 'function', `${name} does not export a router`);
      assert.ok(Array.isArray(router.stack), `${name} is not an Express router`);
      assert.ok(router.stack.length > 0, `${name} registers no routes`);
    });
  }
});

describe('the registration endpoint stays behind an admin check', () => {
  test('POST /authority/register runs two guards before the handler', async () => {
    const { default: router } = await import('../routes/authRoutes.js');

    const register = router.stack.find(
      (layer) => layer.route?.path === '/authority/register' && layer.route.methods.post
    );

    assert.ok(register, 'the registration route is missing');
    // protect, restrictTo, then the controller. Dropping a guard would leave
    // two, which is how this endpoint was open to anyone in the first place.
    assert.equal(register.route.stack.length, 3, 'a guard was removed from the registration route');
  });
});
