import {loadPrecomputedDB} from '../lib/server';
import {DBItem} from '../src/util/reverseEngine';

type TermsDB = {
  data: DBItem[];
};

export async function getStaticProps(): Promise<{props: TermsDB}> {
  return {
    props: {data: loadPrecomputedDB()},
  };
}

export default function ReadDB({data}: TermsDB) {
  return data.map(x => (
    <p key={x.id}>
      {x.definition};{x.term}
    </p>
  ));
}
