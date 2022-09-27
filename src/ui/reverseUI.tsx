import {UniversalSentenceEncoder} from '@tensorflow-models/universal-sentence-encoder';
import {useMemo, useState} from 'react';
import {buildDatabase, DBItem} from '../util/reverseEngine';
import Loading from './loading';

const ReverseUI: React.FC<{
  data: string[];
}> = function ({data}) {
  const [database, setDatabase] = useState<DBItem[] | undefined>(undefined);

  useMemo(() => {
    if (typeof window !== 'undefined') {
      setDatabase(undefined);
      buildDatabase(
        data,
        {
          modelUrl: 'xxx/public/sbert/model.json',
          vocabUrl: 'xxx/public/sbert/vocab.json',
        },
        new UniversalSentenceEncoder(),
        setDatabase
      );
    }
  }, [data]);

  return database ? (
    <div>{JSON.stringify(database)}</div>
  ) : (
    <Loading text={'Loading database'} />
  );
};

export default ReverseUI;
