import path from 'path';
import '@tensorflow/tfjs-node';
import {savePrecomputedDB} from '../../lib/server';
import type { ArgumentsCamelCase, CommandBuilder } from 'yargs';

export const command = 'compute <dataset>';
export const desc = 'Compute semantic database for concept dataset at <dataset>';

// TODO: Somehow I can't get yargs to read the "builder" and "handler" functions...

// export type Options = {
//   dataset: string;
//   output: string;
//   model: string;
// };

// export function builder (yargs: any) {
//   return yargs
//     .options({
//       output: {
//         describe: 'Path to output computed database to',
//         type: 'string',
//         default: path.resolve(path.join(process.cwd(), 'public', 'db.json')),
//         alias: 'o',
//       },
//       model: {
//         describe: 'Path to model (must contain model.json and vocab.json)',
//         type: 'string',
//         default: path.resolve(path.join(process.cwd(), 'public', 'sbert')),
//         alias: 'm',
//       },
//     })
//     .positional('dataset', {
//       describe: 'Path to the Geolexica concepts dataset',
//       type: 'string',
//       demandOption: true
//     });
// };

// export function handler (argv: ArgumentsCamelCase<Options>) {
//   const { dataset, output, model } = argv;
//   console.log("hello!")
//   process.stdout.write(`[breviter] Computing DB concept dataset at ${dataset} ...`);
//   savePrecomputedDB(dataset, output, model).then(
//     d => {
//       process.stdout.write(`[breviter] Written precomputed DB to ${output}.`);
//       process.exit(0);
//     }
//   );
// };
