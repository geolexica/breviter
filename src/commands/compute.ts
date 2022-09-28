import * as path from 'path';
import '@tensorflow/tfjs-node';
import {savePrecomputedDB} from '../../lib/server';
import type {ArgumentsCamelCase, CommandBuilder} from 'yargs';
import * as yargs from 'yargs';

export const command = 'compute <dataset>';
export const desc =
  'Compute semantic database for concept dataset at <dataset>';

export type Options = {
  dataset: string;
  output: string;
  model: string;
};

export const builder = (yargs: yargs.Argv<{}>) => {
  return yargs
    .options({
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
      demandOption: true,
    });
};

export const handler = (argv: ArgumentsCamelCase<Options>) => {
  const {dataset, output, model} = argv;
  console.log('cli handler');
  process.stdout.write(
    `[breviter] Computing DB concept dataset at ${dataset} ...`
  );
  savePrecomputedDB(dataset, output, model).then(d => {
    process.stdout.write(`[breviter] Written precomputed DB to ${output}.`);
    process.exitCode = 0;
  });
};
