const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
for (const customPath of [undefined, path.join(os.tmpdir(), 'custom depot tools')]) {
  test(`depot path is consistent with ${customPath ? 'custom' : 'default'} configuration`, () => {
    const env = { ...process.env, NO_COLOR: '1' };
    delete env.FORCE_COLOR;
    delete env.DEPOT_TOOLS_DIR;
    if (customPath) env.DEPOT_TOOLS_DIR = customPath;
    const expected = customPath || path.join(root, 'third_party', 'depot_tools');
    const output = cp.execFileSync(
      process.execPath,
      [
        '-e',
        `
      const paths = require('./src/utils/paths');
      const depot = require('./src/utils/depot-tools');
      const key = require('path-key')();
      console.log(JSON.stringify({
        shared: paths.depotToolsPath,
        depot: depot.path,
        search: depot.opts({}).env[key].split(require('path').delimiter)[0],
      }));
    `,
      ],
      { cwd: root, env, encoding: 'utf8' },
    );
    assert.deepEqual(JSON.parse(output), { shared: expected, depot: expected, search: expected });
    for (const key of ['depot_tools_path', 'depot_tools_dir']) {
      const printed = cp.execFileSync(process.execPath, ['src/xw-print.js', key], {
        cwd: root,
        env,
        encoding: 'utf8',
      });
      assert.equal(printed.trim(), expected);
    }
  });
}
