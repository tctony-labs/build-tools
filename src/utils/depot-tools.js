const fs = require('fs');
const path = require('path');
const os = require('os');
const childProcess = require('child_process');
const pathKey = require('path-key');

const { color } = require('./logging');
const { rootPath, gitCachePath, depotToolsPath } = require('./paths');

function updateDepotTools() {
  const depot_dir = depotToolsPath;
  console.error(`Updating ${color.path(depot_dir)}`);
  const opts = {
    env: { DEPOT_TOOLS_UPDATE: 0 },
    stdio: ['inherit', 2, 2],
  };
  if (os.platform() === 'win32') {
    depotExecFileSync(
      {},
      'cmd.exe',
      ['/c', path.resolve(depot_dir, 'update_depot_tools.bat')],
      opts,
    );
  } else {
    depotExecFileSync({}, path.resolve(depot_dir, 'update_depot_tools'), [], opts);
  }
}

function ensureDepotTools() {
  const depot_dir = depotToolsPath;

  // If it doesn't exist, create it.
  if (!fs.existsSync(depot_dir)) {
    console.error(`Cloning ${color.cmd('depot_tools')} into ${color.path(depot_dir)}`);
    const url = 'https://chromium.googlesource.com/chromium/tools/depot_tools.git';
    childProcess.execFileSync('git', ['clone', '-q', url, depot_dir], { stdio: ['inherit', 2, 2] });
    updateDepotTools();
  }

  // If it's been awhile, update it.
  const now = new Date();
  const msec_per_day = 86400000;
  const days_before_pull = 14;
  const days_untouched = (now.getTime() - fs.statSync(depot_dir).mtimeMs) / msec_per_day;
  if (days_untouched >= days_before_pull) {
    updateDepotTools();
    fs.utimesSync(depot_dir, now, now);
  }
}

function depotOpts(config, opts) {
  // some defaults
  opts = {
    encoding: 'utf8',
    stdio: 'inherit',
    ...opts,
  };

  opts.env = {
    XIAOWEI_BUILD_TOOLS_PATH: rootPath,

    // set these defaults that can be overridden via process.env
    PYTHONDONTWRITEBYTECODE: '1', // depot needs it
    DEPOT_TOOLS_METRICS: '0', // disable depot metrics

    GIT_CACHE_PATH: gitCachePath,
    GOMA_DISABLED: true,
    DEPOT_TOOLS_UPDATE: 0,

    ...process.env,
    ...config.env,
    ...opts.env,
  };

  // put depot tools at the front of the path
  const key = pathKey();
  const paths = [depotToolsPath];

  // On apple silicon the default python2 binary does not work
  // with vpython.  The one depot tools vends _does_ work.  So we
  // add that one to the path ahead of your default python
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    const pythonRelDirFile = path.resolve(depotToolsPath, 'python_bin_reldir.txt');
    if (fs.existsSync(pythonRelDirFile)) {
      paths.push(path.resolve(depotToolsPath, fs.readFileSync(pythonRelDirFile, 'utf8').trim()));
    }
  }
  // Remove any duplicates on path so that depotToolsPath isn't added if it is already there
  const currentPath = process.env[key].split(path.delimiter);
  opts.env[key] = Array.from(new Set([...paths, ...currentPath])).join(path.delimiter);

  return opts;
}

function depotSpawnSync(config, cmd, args, opts_in) {
  const opts = depotOpts(config, opts_in);
  if (os.platform() === 'win32' && ['python', 'python3'].includes(cmd)) {
    cmd = `${cmd}.bat`;
  }
  if (opts.msg) {
    console.error(opts.msg);
  } else {
    console.error(color.childExec(cmd, args, opts));
  }
  return childProcess.spawnSync(cmd, args, opts);
}

function depotExecFileSync(config, exec, args, opts_in) {
  const opts = depotOpts(config, opts_in);
  if (['python', 'python3'].includes(exec) && !opts.cwd && !path.isAbsolute(args[0])) {
    args[0] = path.resolve(depotToolsPath, args[0]);
  }
  if (os.platform() === 'win32' && ['python', 'python3'].includes(exec)) {
    exec = `${exec}.bat`;
  }
  console.error(color.childExec(exec, args, opts));
  return childProcess.execFileSync(exec, args, opts);
}

module.exports = {
  opts: depotOpts,
  path: depotToolsPath,
  ensure: ensureDepotTools,
  execFileSync: depotExecFileSync,
  spawnSync: depotSpawnSync,
};
