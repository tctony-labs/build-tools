const fs = require('fs');
const ini = require('ini');

const { resolvePath } = require('./paths');

const filePath = resolvePath('~/.xwrc');

function ensure() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }
}

function load() {
  return ini.parse(fs.readFileSync(filePath, 'utf-8'));
}

function save(cfg) {
  return fs.writeFileSync(filePath, ini.stringify(cfg));
}

function update(updator) {
  const cfg = load();
  updator(cfg);
  save(cfg);
}

function isAutoUpdateEnabled() {
  return load().auto_update === true;
}

module.exports = {
  ensure,

  load,
  save,
  update,

  isAutoUpdateEnabled,
};
