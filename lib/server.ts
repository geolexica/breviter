import fs from 'fs';
import path from 'path';
import {buildDatabase} from '../src/util/reverseEngine';
import {LocalUse} from '../src/util/local_use';

export function listFolder() {
  const testFolder = path.join(process.cwd(), 'data', 'concepts');
  const files = fs.readdirSync(testFolder);
  const contents = files.map(f => {
    const filename = path.join(testFolder, f);
    return fs.readFileSync(filename, 'utf8').toString();
  });

  return contents;
}

export function savePrecomputedDB() {
  const data = listFolder();
  buildDatabase(
    data,
    {
      modelPath: path.join(process.cwd(), 'public', 'sbert', 'model.json'),
      vocabPath: path.join(process.cwd(), 'public', 'sbert', 'vocab.json'),
    },
    new LocalUse(),
    d => {
      const filepath = path.join(process.cwd(), 'public', 'db.json');
      return fs.writeFileSync(filepath, JSON.stringify(d), 'utf8');
    }
  );
}

export function loadPrecomputedDB() {
  const filepath = path.join(process.cwd(), 'public', 'db.json');
  return JSON.parse(fs.readFileSync(filepath, 'utf8').toString());
}
