#!/usr/bin/env node
// -*- mode: js2; -*-

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '_xw');

function getInterestedLines(lines, start, end) {
  let index = lines.findIndex((l) => l.startsWith(start));
  lines.splice(0, index + 1);

  index = lines.findIndex((l) => l.startsWith(end));
  lines.splice(index, lines.length - index);

  const ret = [];
  const regex = /^  \w/;
  lines.forEach((l) => {
    if (regex.test(l)) {
      ret.push(l.trim());
    } else {
      if (l.trim().length) {
        ret[ret.length - 1] += ' ' + l.trim();
      }
    }
  });
  return ret;
}

const lines = fs.readFileSync(file).toString().split('\n');

(function () {
  const commandLines = getInterestedLines(
    cp.spawnSync('xw').stderr.toString().split('\n'),
    'Commands',
    'Checkout',
  );
  const commands = commandLines.map((one) => {
    const index = one.indexOf(' ');
    let cmd = one.substring(0, index);
    let rest = one.substring(index + 1);
    rest = rest.split(']');
    const desc = rest[rest.length - 1].trim();
    return `${cmd}:${desc}`;
  });

  const commandStartIndex = lines.findIndex((str) => str.trim() === '# command begin');
  const commandEndIndex = lines.findIndex((str) => str.trim() === '# command end');
  const indent = lines[commandStartIndex].split('#')[0];
  lines.splice(
    commandStartIndex + 1,
    commandEndIndex - 1 - (commandStartIndex + 1) + 1,
    ...commands.flatMap((one) => {
      let [cmd, desc] = one.split(':');
      const cs = cmd.split('|');
      const ret = [`${indent}'${cs[0]}:${desc}'`];
      cs.slice(1).forEach((c) => {
        ret.push(`${indent}"${c}:alias for ${cs[0]}"`);
      });
      return ret;
    }),
  );

  const dispatchs = commands.flatMap((cmd) => {
    const cs = cmd.split(':')[0].split('|');
    const paddingSpace = (str, fl) => {
      let p = '';
      let l = fl - str.length;
      while (l-- > 0) {
        p += ' ';
      }
      return p;
    };
    const ret = [`(${cs[0]})${paddingSpace(cs[0], 15)}__xw-${cs[0]}${paddingSpace(cs[0], 20)};;`];
    cs.slice(1).forEach((c) => {
      ret.push([`(${c})${paddingSpace(c, 15)}__xw-${cs[0]}${paddingSpace(cs[0], 20)};;`]);
    });
    return ret;
  });
  const dispatchStartIndex = lines.findIndex((str) => str.trim() === '# command dispatch begin');
  const dispatchEndIndex = lines.findIndex((str) => str.trim() === '# command dispatch end');
  const dispatchIndent = lines[dispatchStartIndex].split('#')[0];
  lines.splice(
    dispatchStartIndex + 1,
    dispatchEndIndex - 1 - (dispatchStartIndex + 1) + 1,
    ...dispatchs.map((one) => `${dispatchIndent}${one}`),
  );
})();

function genSubCommand(inputLines, inputStart, inputEnd, formator, outputStart, outputEnd) {
  if (!inputLines) return;

  const cmds = getInterestedLines(inputLines, inputStart, inputEnd).map(formator);

  const startIndex = lines.findIndex((str) => str.trim() === outputStart);
  const endIndex = lines.findIndex((str) => str.trim() === outputEnd);
  const indent = lines[startIndex].split('#')[0];
  lines.splice(
    startIndex + 1,
    endIndex - 1 - (startIndex + 1) + 1,
    ...cmds.map((one) => `${indent}"${one}"`),
  );
}

genSubCommand(
  cp
    .spawnSync('xw', ['gc'])
    .stdout.toString()
    .split('\n')
    .map((l) => {
      return l.replace('\x1B[32m', '').replace('\x1B[39m', ':');
    }),
  'Commands are',
  'Options',
  (s) =>
    s
      .split(':')
      .map((o) => o.trim())
      .join(':'),
  '# gclient begin',
  '# gclient end',
);

// need a gn binary named ggn in PATH
genSubCommand(
  cp.spawnSync('ggn', ['-h']).stdout.toString().split('\n'),
  'Commands ',
  'Target ',
  (s) =>
    s
      .split(':')
      .map((o) => o.trim())
      .join(':'),
  '# gn begin',
  '# gn end',
);

genSubCommand(
  cp.spawnSync('xw', ['auto-update']).stderr.toString().split('\n'),
  'Commands',
  '  help [',
  (s) => `${s}:`,
  '# update begin',
  '# update end',
);

const result = lines.join('\n');
if (process.argv.length > 2 && process.argv[2] === '-w') {
  fs.writeFileSync(file, result);
} else {
  console.log(result);
}
