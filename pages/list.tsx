import '@blueprintjs/popover2/lib/css/blueprint-popover2.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import {FocusStyleManager} from '@blueprintjs/core';
import {DBItem} from '../src/util/reverseEngine';
import {loadPrecomputedDB} from '../lib/server';
import ListUI from '../src/ui/listui';

FocusStyleManager.onlyShowFocusOnTabs();

type TermsDB = {
  data: DBItem[];
};

export async function getStaticProps(): Promise<{props: TermsDB}> {
  return {
    props: {data: loadPrecomputedDB()},
  };
}

export default function Reverse({data}: TermsDB) {
  return <ListUI data={data} />;
}
