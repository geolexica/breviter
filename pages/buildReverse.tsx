import path from 'path';
import {listFolder} from '../lib/server';
import ReverseUI from '../src/ui/reverseUI';
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import {FocusStyleManager} from '@blueprintjs/core';

FocusStyleManager.onlyShowFocusOnTabs();

type TermsYAML = {
  data: string[];
};

export async function getStaticProps(): Promise<{props: TermsYAML}> {
  const datasetPath = path.join(process.cwd(), 'data');
  const data = listFolder(datasetPath);
  return {
    props: {data},
  };
}

export default function Reverse({data}: TermsYAML) {
  return <ReverseUI data={data} />;
}
