const test = require('node:test');
const assert = require('node:assert/strict');
const cp = require('child_process');
const rc = require('../src/utils/xwrc');
const { checkForUpdates, maybeCheckForUpdates } = require('../src/utils/check-update');

test('Git update preserves argument boundaries and installs changed dependencies from the public registry', (t) => {
  t.mock.method(rc, 'load', () => ({}));
  const calls = [];
  let heads = 0;
  t.mock.method(cp, 'execFileSync', (command, args, options) => {
    calls.push([command, args, options]);
    if (args[0] === 'rev-parse') return Buffer.from(heads++ ? 'new' : 'old');
    if (args[0] === 'remote') return Buffer.from('https://github.com/tctony-labs/build-tools.git');
    if (args[0] === 'ls-remote') return Buffer.from('new refs/heads/main');
    if (args[0] === 'branch') return Buffer.from('main');
    return Buffer.from('');
  });
  checkForUpdates();
  assert(
    calls.some(([cmd, args]) => cmd === 'git' && args.join(' ') === 'pull --rebase --autostash'),
  );
  const install = calls.find(([cmd]) => cmd.startsWith('npx'));
  assert(install[1].includes('--registry=https://registry.npmjs.org/'));
  assert(install[1].includes('--frozen-lockfile'));
  assert.deepEqual(install[2].stdio, ['inherit', 2, 2]);
});

test('unchanged checkout does not reinstall dependencies', (t) => {
  t.mock.method(rc, 'load', () => ({}));
  const calls = [];
  t.mock.method(cp, 'execFileSync', (command, args) => {
    calls.push(command);
    return Buffer.from(args[0] === 'branch' ? 'main' : 'same');
  });
  checkForUpdates();
  assert(calls.every((command) => command === 'git'));
});

test('automatic update respects disabled state and the daily interval', (t) => {
  const load = t.mock.method(rc, 'load', () => ({}));
  t.mock.method(cp, 'execFileSync', () => assert.fail('unexpected update'));
  assert.equal(maybeCheckForUpdates(), false);
  load.mock.mockImplementation(() => ({ auto_update: true, last_update_time: Date.now() }));
  assert.equal(maybeCheckForUpdates(), false);
});
