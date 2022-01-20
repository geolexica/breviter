import '../styles/globals.css';
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import type {AppProps} from 'next/app';
import {FocusStyleManager} from '@blueprintjs/core';

FocusStyleManager.onlyShowFocusOnTabs();

function MyApp({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />;
}
export default MyApp;
