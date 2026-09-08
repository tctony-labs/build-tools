const path = require('path');
const cp = require('child_process');

const xwrc = require('./xwrc');
const { color, fatal } = require('./logging');

function maybeCheckForUpdates() {
  const cfg = xwrc.load();
  if (cfg.auto_update !== true) {
    return false;
  }
  const lastUpdateTime = parseInt(cfg.last_update_time || '0', 10);
  if (Date.now() < lastUpdateTime + 24 * 60 * 60 * 1000) {
    return false;
  }

  checkForUpdates();
  xwrc.update((cfg) => {
    cfg.last_update_time = Date.now();
  });
  return true;
}

function checkForUpdates() {
  if (parseInt(xwrc.load().last_update_time || '0', 10) + 1000 > Date.now()) {
    // 刚刚自动更新完
    return;
  }

  try {
    const execOpts = { cwd: path.resolve(__dirname, '../..') };
    const git = (args) => cp.execFileSync('git', args, execOpts).toString('utf8').trim();

    const headCmd = ['rev-parse', '--verify', 'HEAD'];
    const headBefore = git(headCmd);

    const originUrl = git(['remote', 'get-url', 'origin']);
    const mainExists = !!git(['ls-remote', '--heads', originUrl, 'main']);
    const desiredBranch = mainExists ? 'main' : 'master';

    const currentBranch = git(['branch', '--show-current']);
    if (currentBranch !== desiredBranch) {
      fatal(
        `build-tools is checked out on ${currentBranch} and not '${desiredBranch}' - please switch and try again.`,
      );
    }

    console.error(color.childExec('git', ['pull', '--rebase', '--autostash'], execOpts));
    git(['pull', '--rebase', '--autostash']);

    if (headBefore === git(headCmd)) {
      console.error('build-tools is up-to-date');
    } else {
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const args = [
        '--yes',
        '--registry=https://registry.npmjs.org/',
        'yarn@1.22.22',
        'install',
        '--frozen-lockfile',
        '--registry=https://registry.npmjs.org/',
      ];
      console.error(color.childExec(command, args, execOpts));
      cp.execFileSync(command, args, {
        ...execOpts,
        stdio: ['inherit', 2, 2],
        shell: process.platform === 'win32',
      });
      console.error('build-tools updated to latest version!');
    }
  } catch (e) {
    fatal(e);
  }
}

module.exports = {
  maybeCheckForUpdates,
  checkForUpdates,
};
