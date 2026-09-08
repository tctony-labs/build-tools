#!/usr/bin/env node
// -*- mode: js2 -*-

const path = require('path');
const fs = require('fs');
const program = require('commander');
const cp = require('child_process');

const { color } = require('./utils/logging');
const { toolsPath } = require('./utils/paths');

let tools = [];

for (const entry of fs.readdirSync(toolsPath)) {
  if (entry.startsWith('.')) {
    continue;
  }

  const entryPath = path.resolve(toolsPath, entry);

  if (fs.statSync(entryPath).isDirectory()) continue;

  tools.push({
    name: entry,
    path: entryPath,
  });
}

program
  .usage('name args...')
  .description(['Available tools:', ...tools.map((e) => e.name)].join('\n  '))
  .arguments('[name] [args...]')
  .allowUnknownOption()
  .action((name, args) => {
    if (!name) {
      console.log(program.helpInformation());
      return;
    }

    const hit = tools.find((e) => e.name === name);
    if (!hit) {
      console.log(`invalid tool name ${color.cmd(name)}`);
      return;
    }

    let cmd = hit.path;
    if (process.platform === 'win32') {
      cmd = cmd.replace(/\\/g, '/');
      const ext = path.extname(cmd);
      if (ext === '.sh') {
        args.unshift(cmd);
        cmd = 'bash';
      } else if (ext === '.py') {
        args.unshift(cmd);
        cmd = 'python';
      } else if (ext === '.js' || ext === '') {
        args.unshift(cmd);
        cmd = 'node';
      }
    }

    console.error(color.childExec(cmd, args));
    cp.execFileSync(cmd, args, { stdio: 'inherit' });
  });

program.parse(process.argv);
