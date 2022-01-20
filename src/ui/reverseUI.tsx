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
      buildDatabase(data, setDatabase);
    }
  }, [data]);

  return database ? (
    <div>{JSON.stringify(database)}</div>
  ) : (
    <Loading text={'Loading database'} />
  );
};

export default ReverseUI;
