#!/usr/bin/env node
// -*- mode: js2 -*-

const program = require('commander');

const { color } = require('./utils/logging');
const xwrc = require('./utils/xwrc');
const { checkForUpdates } = require('./utils/check-update');

const enabledInfo = 'automatic update enabled, update would be checked every 24 hours.';
const disabledInfo =
  'automatic update disabled. If enabled, update would be checked every 24 hours.';

program
  .usage('[check|enable|disable]')
  .description(xwrc.isAutoUpdateEnabled() ? enabledInfo : disabledInfo);

program.command('check').action(() => {
  checkForUpdates();
});

program.command('enable').action(() => {
  const cfg = xwrc.load();
  cfg.auto_update = true;
  xwrc.save(cfg);
  console.log(color.info, enabledInfo);
});

program.command('disable').action(() => {
  const cfg = xwrc.load();
  cfg.auto_update = false;
  xwrc.save(cfg);
  console.log(color.info, disabledInfo);
});

program.parse(process.argv);
