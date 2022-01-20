import {util} from '@tensorflow/tfjs';
import {
  CLS_TOKEN,
  NFKC_TOKEN,
  SEPERATOR,
  SEP_TOKEN,
  UNK_INDEX,
} from './BERTconstants';
import {
  createTrieNode,
  findFromTrie,
  getTrieWord,
  insertToTrie,
  TrieNode,
} from './tire';

const VOCAB_URL = '/bert/processed_vocab.json';
const PUNCTUATIONS = '[~`!@#$%^&*(){}[];:"\'<,.>?/\\|-_+=';

export type Token = {
  text: string;
  index: number;
};

export type BERT = {
  vocab: string[];
  root: TrieNode;
};

export async function initBERT(): Promise<BERT> {
  const vocab = await loadVocab();
  const root = createTrieNode();
  for (let i = 999; i < vocab.length; i++) {
    const word = vocab[i];
    insertToTrie(root, word, 1, i);
  }
  return {vocab, root};
}

async function loadVocab(): Promise<string[]> {
  return util.fetch(VOCAB_URL).then(d => d.json());
}

export function processBERTInput(text: string): Token[] {
  const [words, oriIndex] = processText(text);

  let shift = 0;
  const tokens = words.flatMap(w => {
    const tokens = runSplitOnPunc(w.toLocaleLowerCase(), shift, oriIndex);
    shift += w.length;
    return tokens;
  });

  return tokens;
}

function processText(text: string): [string[], number[]] {
  const oriIndex: number[] = [];
  let stringBuilder: string[] = [];
  const words: string[] = [];
  let ori = 0;
  let lastSpace = true;
  for (const ch of text) {
    if (!isInvalid(ch)) {
      const isSpace = isWhitespace(ch);
      if (isSpace) {
        if (!lastSpace) {
          words.push(stringBuilder.join(''));
          stringBuilder = [];
        }
      } else {
        stringBuilder.push(ch);
        oriIndex.push(ori);
      }
      lastSpace = isSpace;
    }
    ori += ch.length;
  }
  if (stringBuilder.length > 0) {
    words.push(stringBuilder.join(''));
  }
  return [words, oriIndex];
}

function runSplitOnPunc(
  text: string,
  shift: number,
  oriIndex: number[]
): Token[] {
  const tokens: Token[] = [];
  let startNewWord = true;
  for (const ch of text) {
    if (isPunctuation(ch)) {
      tokens.push({text: ch, index: oriIndex[shift]});
      shift++;
      startNewWord = true;
    } else {
      if (startNewWord) {
        tokens.push({text: '', index: oriIndex[shift]});
        startNewWord = false;
      }
      tokens[tokens.length - 1].text += ch;
      shift += ch.length;
    }
  }
  return tokens;
}

export function tokenizeBERT(bert: BERT, text: string) {
  const tokens = processBERTInput(text);

  let outputTokens: number[] = [];

  tokens.forEach(t => {
    if (t.text !== CLS_TOKEN && t.text !== SEP_TOKEN) {
      t.text = `${SEPERATOR}${t.text.normalize(NFKC_TOKEN)}`;
    }
  });

  for (const t of tokens) {
    const chars = t.text.split('');

    let isUnknown = false;
    let start = 0;
    const subTokens: number[] = [];

    const charsLength = chars.length;

    while (start < charsLength) {
      let end = charsLength;
      let currIndex: number | undefined = undefined;

      while (start < end) {
        const substr = chars.slice(start, end).join('');

        const match = findFromTrie(bert.root, substr);
        if (
          match !== null &&
          match !== undefined &&
          match.end !== null &&
          match.end !== undefined
        ) {
          currIndex = getTrieWord(match)[2];
          break;
        }

        end = end - 1;
      }

      if (currIndex === undefined) {
        isUnknown = true;
        break;
      }

      subTokens.push(currIndex);
      start = end;
    }

    if (isUnknown) {
      outputTokens.push(UNK_INDEX);
    } else {
      outputTokens = outputTokens.concat(subTokens);
    }
  }

  return outputTokens;
}

function isWhitespace(ch: string): boolean {
  return /\s/.test(ch);
}

function isInvalid(ch: string): boolean {
  return ch.charCodeAt(0) === 0 || ch.charCodeAt(0) === 0xfffd;
}

function isPunctuation(ch: string): boolean {
  return PUNCTUATIONS.indexOf(ch) !== -1;
}
