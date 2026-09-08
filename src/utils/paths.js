const fs = require('fs');
const os = require('os');
const path = require('path');
const { color } = require('./logging');

function resolvePath(p) {
  if (path.isAbsolute(p)) return p;
  if (p.startsWith('~/')) return path.resolve(os.homedir(), p.substr(2));
  return path.resolve(process.cwd(), p);
}

function ensureDir(dir) {
  dir = resolvePath(dir);
  if (!fs.existsSync(dir)) {
    console.error(`Creating ${color.path(dir)}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resolveBinScript(name) {
  return process.platform !== 'win32' ? name : `${name}.bat`;
}

function escapeWindowsPath(path) {
  return path.replace(/\\/g, '\\\\');
}

const rootPath = path.resolve(__dirname, '../..');

const gitCachePath = resolvePath('~/.git_cache');

const depotToolsPath =
  process.env.DEPOT_TOOLS_DIR || path.resolve(rootPath, 'third_party', 'depot_tools');

const toolsPath = path.resolve(rootPath, 'tools');

function findFileInCurrentOrParent(file, dir) {
  for (;;) {
    const filePath = path.resolve(dir, file);
    if (fs.existsSync(filePath)) return filePath;

    const parentDir = path.dirname(dir);
    if (parentDir === dir) return null;
    dir = parentDir;
  }
}

module.exports = {
  resolvePath,
  ensureDir,
  resolveBinScript,
  escapeWindowsPath,
  rootPath,
  gitCachePath,
  depotToolsPath,
  toolsPath,
  findFileInCurrentOrParent,
};
