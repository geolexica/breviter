import fs from 'fs';
import path from 'path';

export function listFolder() {
  const testFolder = path.join(process.cwd(), 'data', 'concepts');
  const files = fs.readdirSync(testFolder);
  const contents = files.map(f => {
    const filename = path.join(testFolder, f);
    return fs.readFileSync(filename, 'utf8').toString();
  });

  return contents;
}

export function loadPrecomputedDB() {
  const filepath = path.join(process.cwd(), 'public', 'db.json');
  return JSON.parse(fs.readFileSync(filepath, 'utf8').toString());
}
