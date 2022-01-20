import {TextArea} from '@blueprintjs/core';
import {useMemo, useState} from 'react';
import {DBItem} from '../util/reverseEngine';

const ListUI: React.FC<{
  data: DBItem[];
}> = function ({data}) {
  const [filter, setFilter] = useState<string>('');

  const flower = filter.toLowerCase();
  const filtered = useMemo(
    () => data.filter(x => x.term.toLowerCase().includes(flower)),
    [filter]
  );

  return (
    <div>
      Filter:
      <TextArea value={filter} onChange={x => setFilter(x.target.value)} />
      {filtered.map((x, index) => (
        <WordField word={x} key={index} />
      ))}
    </div>
  );
};

const WordField: React.FC<{word: DBItem}> = function ({word: answer}) {
  return (
    <fieldset>
      <legend>{answer.term}</legend>
      <p>{answer.definition}</p>
    </fieldset>
  );
};

export default ListUI;
