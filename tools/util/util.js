const cp = require('child_process');

const xwcmd = process.platform === 'win32' ? 'xw.cmd' : 'xw';

function get_gclient_root() {
  const ret = cp.spawnSync(xwcmd, ['gc', 'root'], { stdio: ['inherit', 'pipe', 'inherit'] });
  ensure_spawn_ok(ret, 'get gclient root');
  return ret.stdout.toString().trim();
}

// execFileSync如果失败，会直接抛异常
// spawnSync则通过这个函数检查一下返回值
function ensure_spawn_ok(spawn_ret, spawn_desc) {
  if (spawn_ret.status !== 0) {
    console.error(`'${spawn_desc}' failed.`);
    if (spawn_ret.error) {
      console.error(spawn_ret.error);
    }

    process.exit(spawn_ret.status ?? 1);
  }
}

module.exports = {
  xwcmd,
  get_gclient_root,
  ensure_spawn_ok,
};
