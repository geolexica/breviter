import fs from 'fs';
import path from 'path';
import {buildDatabase} from '../src/util/reverseEngine';
import {LocalUse} from '../src/util/local_use';

export function listFolder(datasetPath: string) {
  // the "concepts/" directory contains the relevant YAML files
  const conceptsYamlDir = path.resolve(path.join(datasetPath, 'concepts'));
  const files = fs.readdirSync(conceptsYamlDir);
  const contents = files.map(f => {
    const filename = path.join(conceptsYamlDir, f);
    return fs.readFileSync(filename, 'utf8').toString();
  });

  return contents;
}

const localLoadConfig = {
  modelPath: path.join(process.cwd(), 'public', 'sbert', 'model.json'),
  vocabPath: path.join(process.cwd(), 'public', 'sbert', 'vocab.json'),
}

function setLoadConfig(modelPath: string) {
  // TODO: check if the files don't exist, return error
  return {
    modelPath: path.join(path.resolve(modelPath), 'model.json'),
    vocabPath: path.join(path.resolve(modelPath), 'vocab.json'),
  };
}

export async function savePrecomputedDB(
  datasetPath: string,
  outputPath: string,
  modelPath: string,
) {
  const data = listFolder(datasetPath);
  const filepath = path.resolve(path.join(outputPath));
  const db = await buildDatabase(
    data,
    setLoadConfig(modelPath),
    new LocalUse(),
  );

  return fs.writeFileSync(filepath, JSON.stringify(db), 'utf8');
}

export function loadPrecomputedDB(precomputedPath?: string) {
  if (!precomputedPath) {
    precomputedPath = path.join(process.cwd(), 'public', 'db.json');
  }

  return JSON.parse(fs.readFileSync(precomputedPath, 'utf8').toString());
}
