import {loadPrecomputedDB} from '../lib/server';
import TestingUI from '../src/ui/testingui';
import {DBItem} from '../src/util/reverseEngine';

type TermsDB = {
  data: DBItem[];
};

export async function getStaticProps(): Promise<{props: TermsDB}> {
  return {
    props: {data: loadPrecomputedDB()},
  };
}

export default function Testing({data}: TermsDB) {
  return <TestingUI data={data} />;
}
