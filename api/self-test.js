const assert = require('assert');
const { normalizeTarget, targetType, runCheck } = require('./monitor');

(async () => {
  assert.strictEqual(normalizeTarget('example.com'), 'https://example.com/');
  assert.strictEqual(normalizeTarget('http://example.com'), 'http://example.com/');
  assert.strictEqual(normalizeTarget('tcp://31.220.56.145:22'), 'tcp://31.220.56.145:22');
  assert.strictEqual(targetType('tcp://31.220.56.145:22'), 'tcp');
  assert.strictEqual(targetType('https://example.com/'), 'http');

  const website = await runCheck('https://example.com');
  assert.strictEqual(typeof website.ok, 'boolean');
  assert.strictEqual(typeof website.responseTimeMs, 'number');
  assert.ok(website.checkedAt);

  const tcp = await runCheck('tcp://31.220.56.145:22');
  assert.strictEqual(tcp.type, 'tcp');
  assert.strictEqual(typeof tcp.ok, 'boolean');
  assert.strictEqual(typeof tcp.responseTimeMs, 'number');

  console.log('PulsePage self-test passed');
})();
