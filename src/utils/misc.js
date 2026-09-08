const { color } = require('./logging');

function ensureSpawnOk(spawnRet, spawnDesc) {
  if (spawnRet.status !== 0) {
    console.error(color.err, `'${spawnDesc}' failed.`);
    if (spawnRet.error) {
      console.error(spawnRet.error);
    }

    process.exit(spawnRet.status ?? 1);
  }
}

module.exports = {
  ensureSpawnOk,
};
