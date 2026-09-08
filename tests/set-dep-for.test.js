const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
for (const scenario of ['existing', 'update', 'clone']) {
  test(`dependency paths stay clean during depot ${scenario}`, (t) => {
    const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'set-dep-test-')));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const workspace = path.join(directory, 'workspace with spaces');
    fs.mkdirSync(path.join(workspace, 'src', 'dependency'), { recursive: true });
    fs.writeFileSync(path.join(workspace, '.gclient'), '# build_tools_path\n');
    const depot = path.join(directory, 'depot');
    if (scenario !== 'clone') {
      fs.mkdirSync(depot);
      if (scenario === 'update') {
        const old = new Date(Date.now() - 15 * 86400000);
        fs.utimesSync(depot, old, old);
      }
    }
    const preload = path.join(directory, 'preload.js');
    fs.writeFileSync(
      preload,
      `
      const fs = require('fs');
      const cp = require('child_process');
      require('os').homedir = () => ${JSON.stringify(directory)};
      const execFile = cp.execFileSync;
      const spawn = cp.spawnSync;
      cp.execFileSync = (command, args, options) => {
        if (command === 'git' && args[0] === 'rev-parse') return Buffer.from('abc123');
        if (command === 'xw' || command === 'xw.cmd') {
          console.log(JSON.stringify(args));
          return Buffer.from('');
        }
        if (command === 'git' && args[0] === 'clone') fs.mkdirSync(args.at(-1));
        else if (!command.includes('update_depot_tools') && command !== 'cmd.exe') {
          throw new Error('Unexpected command: ' + command);
        }
        return execFile(process.execPath, ['-e',
          'console.log("setup stdout"); console.error("setup stderr");'
        ], options);
      };
      cp.spawnSync = (command, args, options) => {
        if (command === 'xw' || command === 'xw.cmd') {
          return spawn(process.execPath, ['--require', ${JSON.stringify(preload)},
            ${JSON.stringify(path.join(root, 'src/xw'))}, ...args], options);
        }
        if (command === 'gclient' || command.endsWith('gclient.bat')) {
          return spawn(process.execPath, ['-e',
            'console.log(' + JSON.stringify(${JSON.stringify(workspace)}) + ')'
          ], options);
        }
        throw new Error('Unexpected command: ' + command);
      };
    `,
    );
    const result = cp.spawnSync(
      process.execPath,
      ['--require', preload, path.join(root, 'tools/set-dep-for'), 'src/dependency'],
      {
        cwd: workspace,
        env: { ...process.env, DEPOT_TOOLS_DIR: depot, NO_COLOR: '1' },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), [
      'gc',
      'setdep',
      '-r',
      'src/dependency@abc123',
      '--deps-file',
      path.join('src', 'DEPS'),
    ]);
    assert.match(result.stderr, /Creating/);
    if (scenario !== 'existing') {
      assert.match(result.stderr, /Updating/);
      assert.match(result.stderr, /setup stdout/);
      assert.match(result.stderr, /setup stderr/);
    }
    if (scenario === 'clone') assert.match(result.stderr, /Cloning/);
  });
}
