#!/usr/bin/env node

import path from 'path';
import yargs from 'yargs';
import {savePrecomputedDB} from '../lib/server';
import * as compute from "./commands/compute";

// TODO: Move this code into the compute module.
const parser = yargs.command(
  compute.command,
  compute.desc,
  (yargs) =>
    yargs.options({
      output: {
        describe: 'Path to output computed database to',
        type: 'string',
        default: path.resolve(path.join(process.cwd(), 'public', 'db.json')),
        alias: 'o',
      },
      model: {
        describe: 'Path to model (must contain model.json and vocab.json)',
        type: 'string',
        default: path.resolve(path.join(process.cwd(), 'public', 'sbert')),
        alias: 'm',
      },
    })
    .positional('dataset', {
      describe: 'Path to the Geolexica concepts dataset',
      type: 'string',
      demandOption: true
    })
  ,
  (argv) => {
    process.stdout.write(`[breviter] Computing DB concept dataset at path "${argv.dataset}" ...`);
    savePrecomputedDB(argv.dataset, argv.output, argv.model).then(
      d => {
        process.stdout.write(`[breviter] Written precomputed DB to path "${argv.output}".`);
        process.exit(0);
      }
    );
  }
)
.help()
.demandCommand()
.fail(false)

// TODO: Do not exit process until the save is finished!
// try {
//   const argv = await parser.parse();
// } catch (err: any) {
//   console.info(`${err.message}\n ${await parser.getHelp()}`)
// }
// console.info('finish')
parser.parse();
