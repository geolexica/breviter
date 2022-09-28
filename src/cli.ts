#!/usr/bin/env node

import * as yargs from 'yargs';

import {command, desc, builder, handler} from './commands/compute';

const parser = yargs
  .strict()
  .command(command, desc, builder, handler)
  .help()
  .demandCommand()
  .fail((msg, err, yargs) => {
    if (err) throw err; // preserve stack
    console.error(msg);
    console.error(yargs.help());
    process.exitCode = 1;
  });

parser.parseSync();

// const argv = parser.parseSync();
// console.debug('Finished!', argv);
