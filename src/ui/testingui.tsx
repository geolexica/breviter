import {Button, Spinner} from '@blueprintjs/core';
import {Popover2} from '@blueprintjs/popover2';
import {useMemo, useState} from 'react';
import {UniversalSentenceEncoder} from '@tensorflow-models/universal-sentence-encoder';
import {convertBERT, DBItem} from '../util/reverseEngine';

type WordScore = {
  word: string;
  score: number;
};

type TopNScores = {
  top1: number;
  top3: number;
  top5: number;
  top10: number;
  top20: number;
};

type ResultEntry = {
  query: string;
  expected: string;
  answers: WordScore[];
};

const getRankOfExpected = (resultEntry: ResultEntry) => {
  const {answers, expected} = resultEntry;
  const rank = answers.map(({word}) => word).indexOf(expected);
  return rank;
};

const getScoreOfExpected = (resultEntry: ResultEntry) => {
  const {answers, expected} = resultEntry;
  const maybeAnswer = answers.find(({word}) => word.indexOf(expected));
  return maybeAnswer === undefined ? -1 : maybeAnswer.score;
};

// TODO
const overallFitScore = (results: ResultEntry[]): number => {
  const resultSize = results.length;
  const maxIndividualScore = Object.values(fitScores)[0];
  const maxOverallScore = resultSize * maxIndividualScore;
  // console.log('resultSize', resultSize);
  // console.log('maxIndividualScore', maxIndividualScore);
  // console.log('maxOverallScore', maxOverallScore);
  // const res1 = results.map(item => getScoreFromRank(getRankOfExpected(item)));
  // console.log('res1', res1);
  // const res2 = res1.reduce((acc, score) => acc + score, 0);
  // console.log('res2', res2);
  return (
    results
      .map(item => getScoreFromRank(getRankOfExpected(item)))
      .reduce((acc, score) => acc + score, 0) / maxOverallScore
  );
};
const displayOverallFitScoreFormula = (results: ResultEntry[]): string => {
  const resultSize = results.length;
  const maxIndividualScore = Object.values(fitScores)[0];
  const maxOverallScore = resultSize * maxIndividualScore;
  const rankPartitions = results.map(item =>
    getRankPartition(getRankOfExpected(item))
  );
  const overallScore = overallFitScore(results);
  const sortedByRankPartitions = rankPartitions.reduce((acc, partition) => {
    acc[partition] ||= 0;
    acc[partition] += 1;
    return acc;
  }, {} as {[key: number]: number});
  console.log('sortedByRankPartitions', sortedByRankPartitions);
  return (
    '(' +
    Object.keys(sortedByRankPartitions)
      .map(
        partition =>
          `${fitScores[parseInt(partition, 10)]} x ${
            sortedByRankPartitions[parseInt(partition, 10)]
          }`
      )
      .join(' + ') +
    `) / ${maxOverallScore} = ${overallScore}`
  );
};

/**
 * Rank 1     => 1st partition
 * Rank 2-3   => 2nd partition
 * Rank 4-5   => 3rd partition
 * Rank 6-10  => 4th partition
 * Rank 11-   => 5th partition
 * Default rank partition is the last one.
 *
 * It is used for calculating fit score.
 */
const getRankPartition = (rank: number) => {
  const defaultRankPartition = lens[lens.length - 1];
  if (rank < 0) {
    return defaultRankPartition;
  }
  return lens.find((i, idx) => rank < lens[idx]) || defaultRankPartition;
};

/**
 * Look up score from table
 */
const getScoreFromRank = (rank: number) => {
  return fitScores[getRankPartition(rank)];
};

const lens = [1, 3, 5, 10, 20] as const;

// type ValueOf<T> = T[keyof T];
// type Lens = ValueOf<typeof lens>;

// type RankPartition = {
//   [key in keyof typeof lens]: number;
// };

const properties: Record<number, keyof TopNScores> = {
  1: 'top1',
  3: 'top3',
  5: 'top5',
  10: 'top10',
  20: 'top20',
};

const fitScores: Record<number, number> = {
  1: 20,
  3: 10,
  5: 5,
  10: 3,
  20: 1,
};

const initScore = {top1: 0, top3: 0, top5: 0, top10: 0, top20: 0};

export default function TestingUI({data}: {data: DBItem[]}) {
  const [progress, setProgress] = useState<number>(0);
  const [ready, setReady] = useState<boolean>(false);
  const [task, setTask] = useState<number>(0);
  const [scores, setScores] = useState<TopNScores>(initScore);
  const [results, setResults] = useState<ResultEntry[]>([]);

  const loader = useMemo(() => {
    const l = new UniversalSentenceEncoder();
    if (typeof window !== 'undefined') {
      l.load({
        modelUrl: '/sbert/model.json',
        vocabUrl: '/sbert/vocab.json',
      }).then(() => setReady(true));
    }
    return l;
  }, []);

  async function test(c: [string, string]): Promise<ResultEntry> {
    const [query, expected] = c;
    const bertAnswer = await convertBERT(query, loader);
    const answer: WordScore[] = [];
    for (const item of data) {
      const score = dotProduct(item.vector, bertAnswer);
      answer.push({word: item.term, score});
    }
    const final = answer.sort((x, y) => y.score - x.score).slice(0, 20);
    const words = final.map(f => f.word);
    setScores(s => updateTopNScores(s, c, words));
    setProgress(p => p + 1);
    return {
      query,
      expected,
      answers: final,
    };
  }

  async function process(x: string) {
    const lines = x.split('\n');
    const cases: [string, string][] = lines
      .map(x => x.trim().split(';'))
      .filter(x => x.length === 2) as [string, string][];

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
        <Result scores={scores} task={task} results={results} />
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
  scores: TopNScores;
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
      <h2>Details</h2>
      <p>
        normalized fit score:{' '}
        <strong>{overallFitScore(results).toString()}</strong>
      </p>
      <p>{displayOverallFitScoreFormula(results)}</p>
      <TSV results={results} />
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
  const rank = getRankOfExpected(item);
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

const TSV: React.FC<{
  results: ResultEntry[];
}> = function ({results}) {
  const tsv = results
    .map(item => {
      const {query, expected} = item;
      const rank = getRankOfExpected(item);
      return `${expected}	${query}	${rank}\n`;
    })
    .join('');

  const asciidoc =
    '[%autowidth,frame=ends,format=tsv,cols="1,1,1"]\n|===\n' +
    `expected	query	rank\n\n${tsv}\n|===\n\n`;

  return (
    <>
      <Button
        onClick={() => {
          navigator.clipboard.writeText(tsv);
        }}
      >
        Copy TSV to clipboard
      </Button>
      <Button
        onClick={() => {
          navigator.clipboard.writeText(asciidoc);
        }}
      >
        Copy asciidoc table to clipboard
      </Button>
      <pre>{tsv}</pre>
    </>
  );
};

const AnswerList: React.FC<{
  list: WordScore[];
  expected: string;
}> = function ({list, expected}) {
  return (
    <>
      {list.map(({word, score}, index) => (
        <p
          style={{
            color: word === expected ? 'green' : 'black',
          }}
          key={index}
        >
          {index + 1}. {word} ({score})
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

function updateTopNScores(
  s: TopNScores,
  c: string[],
  words: string[]
): TopNScores {
  const newS = {...s};
  // if (words[0] !== c[1]) {
  //   console.debug(words[0], c[1], c[0]);
  // }
  for (const l of lens) {
    const parts = words.slice(0, l);
    if (parts.includes(c[1])) {
      newS[properties[l]]++;
    }
  }
  return newS;
}
