#!/usr/bin/env node

import * as yargs from 'yargs';

import {command, desc, builder, handler} from './commands/compute';

// Do not exit process until the save is finished!
yargs
  .command(command, desc, builder, handler)
  .help()
  .demandCommand()
  .fail(false)
  .parseSync(); //.fail(err => { console.info(`${err.message}\n ${parser.getHelp()}`); });

console.info('finish');
