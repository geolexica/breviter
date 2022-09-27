import {slice, Tensor2D} from '@tensorflow/tfjs';
import {UniversalSentenceEncoder} from '@tensorflow-models/universal-sentence-encoder';

export type DBItem = {
  id: string;
  term: string;
  definition: string;
  vector: number[];
};

export type TSInput = Omit<DBItem, 'vector'>;

type YAMLDoc = {
  termid: string;
  term: string;
  eng: {
    definition: Array<{
      content: string;
    }>;
  };
};

type RawYAMLDoc = Partial<YAMLDoc>;

export async function buildDatabase(
  data: string[],
  callback: (db: DBItem[]) => void
) {
  const loader = new UniversalSentenceEncoder();
  console.log(`Got ${data.length} entries`);
  const yaml = require('js-yaml');
  const raws = data
    .map(x => yaml.load(x) as RawYAMLDoc)
    .map(x => validateYAML(x));
  console.log('YAML parsing done');
  const objs = raws.filter(x => x).map(x => x as YAMLDoc);
  const definitions: Array<string> = objs.map(x => x.eng.definition[0].content);
  await loader.load();
  console.log('BERT loaded');
  const embeddings = await loader.embed(definitions);
  console.log('Done transformation');
  const db = objs.map((x, index) => transform(x, index, embeddings));
  callback(db);
}

export async function convertBERT(
  text: string,
  loader: UniversalSentenceEncoder
) {
  const embed = await loader.embed(text);
  return Array.from(embed.dataSync());
}

function transform(x: YAMLDoc, index: number, embed: Tensor2D): DBItem {
  const v = Array.from(slice(embed, [index, 0], [1]).dataSync());
  return {
    id: x.termid,
    term: x.term,
    definition: x.eng.definition[0].content,
    vector: v,
  };
}

function validateYAML(x: RawYAMLDoc): YAMLDoc | undefined {
  const {termid, term, eng} = x;
  if (termid && term && eng && eng.definition) {
    return {termid, term, eng};
  }
  console.error('undefined object detected!', x);
  return undefined;
}

// const sentences = [
//   'I like my phone.', 'Your cellphone looks great.', 'How old are you?',
//   'What is your age?', 'An apple a day, keeps the doctors away.',
//   'Eating strawberries is healthy.'
// ];
// const loader = new UniversalSentenceEncoder();

// const init = async () => {
//   try {
//   await loader.load();
//   console.log('start');
//   const embeddings = await loader.embed(sentences);
//   for (let i = 0; i < sentences.length; i++) {
//     const sentenceI = slice(embeddings, [i, 0], [1]);
//     console.log(sentenceI.dataSync());
//   }
//   for (let i = 0; i < sentences.length; i++) {
//     for (let j = i; j < sentences.length; j++) {
//       const sentenceI = slice(embeddings, [i, 0], [1]);
//       const sentenceJ = slice(embeddings, [j, 0], [1]);
//       const sentenceITranspose = false;
//       const sentenceJTransepose = true;
//       const score =
//           matMul(
//                 sentenceI, sentenceJ, sentenceITranspose, sentenceJTransepose)
//               .dataSync();

//       console.log(sentences[i], sentences[j], score);
//     }
//   }
// } catch (e:any) {
//   console.error(e.message);
//   console.error(e.stack);
// }
// };

// if (typeof window !== 'undefined') {
//   init();
// }
