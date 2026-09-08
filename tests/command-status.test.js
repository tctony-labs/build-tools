const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

for (const command of ['gn', 'nj']) {
  for (const status of [0, 7, null]) {
    test(`${command} propagates child status ${status}`, (t) => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'command-status-'));
      t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
      const preload = path.join(directory, 'preload.js');
      const depotPath = path.resolve(__dirname, '../src/utils/depot-tools.js');
      fs.writeFileSync(
        preload,
        [
          "require('os').homedir = () => process.env.BUILD_TOOLS_TEST_HOME;",
          `const depot = require(${JSON.stringify(depotPath)});`,
          'depot.ensure = () => {};',
          `depot.spawnSync = () => ({ status: ${status} });`,
        ].join('\n'),
      );
      const result = cp.spawnSync(
        process.execPath,
        ['--require', preload, path.resolve(__dirname, '../src/xw'), command],
        {
          cwd: directory,
          env: { ...process.env, BUILD_TOOLS_TEST_HOME: directory },
          encoding: 'utf8',
        },
      );
      assert.equal(result.status, status ?? 1, result.stderr);
    });
  }
}
