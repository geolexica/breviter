import {Button, TextArea} from '@blueprintjs/core';
import {useMemo, useState} from 'react';
import {UniversalSentenceEncoder} from '@tensorflow-models/universal-sentence-encoder';
import {convertBERT, DBItem} from '../util/reverseEngine';
import Link from 'next/link';

type WordScoreWithIdDefn = {
  word: string;
  score: number;
  id: string;
  definition: string;
};

const LookupUI: React.FC<{
  data: DBItem[];
}> = function ({data}) {
  const [query, setQuery] = useState<string>('');
  const [ready, setReady] = useState<boolean>(false);
  const [answer, setAnswers] = useState<WordScoreWithIdDefn[]>([]);

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

  async function search() {
    if (ready) {
      console.log('Computing');
      const vector = await convertBERT(query, loader);
      console.log('Done computing', vector);
      const answer: WordScoreWithIdDefn[] = [];
      for (const item of data) {
        const score = dotProduct(item.vector, vector);
        answer.push({
          id: item.id,
          word: item.term,
          definition: item.definition,
          score,
        });
      }
      const final = answer.sort((x, y) => y.score - x.score).slice(0, 20);
      console.log(final.length);
      setAnswers(final);
    }
  }

  return (
    <div>
      Search phrase:
      <TextArea value={query} onChange={x => setQuery(x.target.value)} />
      <Button onClick={search}>Search</Button>
      {answer.length > 0 && (
        <div>
          Top-{answer.length} answers:
          {answer.map((x, index) => (
            <AnswerField answer={x} key={index} />
          ))}
        </div>
      )}
    </div>
  );
};

function dotProduct(x: number[], y: number[]): number {
  let sum = 0;
  for (let i = 0; i < x.length && i < y.length; i++) {
    sum += x[i] * y[i];
  }
  return sum;
}

const AnswerField: React.FC<{answer: WordScoreWithIdDefn}> = function ({
  answer,
}) {
  return (
    <fieldset>
      <legend>
        <Link href={'/concepts/' + answer.id}>{answer.word}</Link>
      </legend>
      <p>Definition: {answer.definition}</p>
      <p>BERT score: {answer.score}</p>
    </fieldset>
  );
};

export default LookupUI;
