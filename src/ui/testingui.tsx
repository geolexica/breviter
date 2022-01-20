import {Button, Spinner} from '@blueprintjs/core';
import {Popover2} from '@blueprintjs/popover2';
import {useMemo, useState} from 'react';
import {UniversalSentenceEncoder} from '../sent';
import {convertBERT, DBItem} from '../util/reverseEngine';

type Answer = {
  word: string;
  score: number;
};

type Scores = {
  top1: number;
  top3: number;
  top5: number;
  top10: number;
  top20: number;
};

type ResultEntry = {
  query: string;
  expected: string;
  answers: [string, number][];
};

const lens = [1, 3, 5, 10, 20] as const;

const properties: Record<number, keyof Scores> = {
  1: 'top1',
  3: 'top3',
  5: 'top5',
  10: 'top10',
  20: 'top20',
};

const initScore = {top1: 0, top3: 0, top5: 0, top10: 0, top20: 0};

export default function TestingUI({data}: {data: DBItem[]}) {
  const [progress, setProgress] = useState<number>(0);
  const [ready, setReady] = useState<boolean>(false);
  const [task, setTask] = useState<number>(0);
  const [scores, setScores] = useState<Scores>(initScore);
  const [result, setResults] = useState<ResultEntry[]>([]);

  const loader = useMemo(() => {
    const l = new UniversalSentenceEncoder();
    if (typeof window !== 'undefined') {
      l.load().then(() => setReady(true));
    }
    return l;
  }, []);

  async function test(c: string[]): Promise<ResultEntry> {
    const query = await convertBERT(c[0], loader);
    const answer: Answer[] = [];
    for (const item of data) {
      const score = dotProduct(item.vector, query);
      answer.push({word: item.term, score});
    }
    const final = answer.sort((x, y) => y.score - x.score).slice(0, 20);
    const words = final.map(f => f.word);
    setScores(s => updateScore(s, c, words));
    setProgress(p => p + 1);
    return {
      query: c[0],
      expected: c[1],
      answers: final.map(w => [w.word, w.score]),
    };
  }

  async function process(x: string) {
    const lines = x.split('\n');
    const cases = lines
      .map(x => x.trim().split(';'))
      .filter(x => x.length === 2);
    setTask(cases.length);
    setProgress(0);
    const results: ResultEntry[] = [];
    for (const c of cases) {
      results.push(await test(c));
    }
    setResults(results);
  }

  function onFileInput(list: FileList | null) {
    if (list !== null && ready) {
      setScores(initScore);
      setResults([]);
      const task = list[0].text();
      task.then(process);
    }
  }

  return (
    <div>
      {!ready && <p>Wait. Loading the AI engine.</p>}
      Upload test case
      <input
        type="file"
        value={''}
        onChange={x => onFileInput(x.target.files)}
      />
      {task !== 0 && progress !== task && (
        <Progress progress={progress} task={task} />
      )}
      {task !== 0 && progress === task && (
        <Result scores={scores} task={task} results={result} />
      )}
    </div>
  );
}

const Progress: React.FC<{
  progress: number;
  task: number;
}> = function ({progress, task}) {
  return (
    <div>
      <Spinner />
      Test cases: {progress} / {task}
    </div>
  );
};

const Result: React.FC<{
  scores: Scores;
  task: number;
  results: ResultEntry[];
}> = function ({scores, task, results}) {
  return (
    <div>
      {Object.entries(scores).map(([key, score]) => (
        <div key={key}>
          {key} score: {score} / {task}
        </div>
      ))}
      Details:
      {results.map((r, index) => (
        <ResultItemDisplay key={index} item={r} pos={index + 1} />
      ))}
    </div>
  );
};

const ResultItemDisplay: React.FC<{
  item: ResultEntry;
  pos: number;
}> = function ({item, pos}) {
  const rank = item.answers.map(x => x[0]).indexOf(item.expected);
  return (
    <fieldset
      style={{
        backgroundColor:
          rank === 0 ? 'lightgreen' : rank !== -1 ? 'lightyellow' : 'lightpink',
      }}
    >
      <legend>Test {pos}</legend>
      <p>Search: {item.query}</p>
      <p>Expected: {item.expected}</p>
      <p>Result: rank {rank !== -1 ? rank + 1 : 'Not in Top 20'}</p>
      <Popover2
        content={<AnswerList list={item.answers} expected={item.expected} />}
      >
        <Button>Details</Button>
      </Popover2>
    </fieldset>
  );
};

const AnswerList: React.FC<{
  list: [string, number][];
  expected: string;
}> = function ({list, expected}) {
  return (
    <>
      {list.map((x, index) => (
        <p
          style={{
            color: x[0] === expected ? 'green' : 'black',
          }}
          key={index}
        >
          {index + 1}. {x[0]} ({x[1]})
        </p>
      ))}
    </>
  );
};

function dotProduct(x: number[], y: number[]): number {
  let sum = 0;
  for (let i = 0; i < x.length && i < y.length; i++) {
    sum += x[i] * y[i];
  }
  return sum;
}

function updateScore(s: Scores, c: string[], words: string[]): Scores {
  const newS = {...s};
  if (words[0] !== c[1]) {
    console.log(words[0], c[1], c[0]);
  }
  for (const l of lens) {
    const parts = words.slice(0, l);
    if (parts.includes(c[1])) {
      newS[properties[l]]++;
    }
  }
  return newS;
}
