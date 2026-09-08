#!/usr/bin/env node
// -*- mode: js2 -*-

const program = require('commander');

const { color } = require('./utils/logging');
const { rootPath, depotToolsPath } = require('./utils/paths');

// value might be a string or a function returns string
const keyValueMap = {
  version: color.config(require('../package.json').version),
  install_dir: color.path(rootPath),
  depot_tools_dir: color.path(depotToolsPath),
  install_path: color.path(rootPath),
  depot_tools_path: color.path(depotToolsPath),
};

program
  .usage('key')
  .description(['Available keys:', ...Object.keys(keyValueMap)].join('\n  '))
  .arguments('[key]')
  .action((key) => {
    if (!key) {
      console.log(program.helpInformation());
      return;
    }

    const v = keyValueMap[key];
    if (!v) {
      console.log(`invalid key ${key}`);
      return;
    }

    console.log(typeof v === 'string' ? v : v());
  });

program.parse(process.argv);
