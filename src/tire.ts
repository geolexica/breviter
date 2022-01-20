export type TrieIndex = [string[], number, number];

export type TrieNode = {
  parent?: TrieNode;
  children: Record<string, TrieNode>;
  end: boolean;
  score: number;
  index: number;
  key: string;
};

export function createTrieNode(): TrieNode {
  return {
    children: {},
    end: false,
    score: 0,
    index: 0,
    key: '',
  };
}

export function getTrieWord(trie: TrieNode): TrieIndex {
  const output: string[] = [];
  let node: TrieNode | undefined = trie;

  while (node) {
    if (node.key !== '') {
      output.unshift(node.key);
    }
    node = node.parent;
  }

  return [output, trie.score, trie.index];
}

export function insertToTrie(
  root: TrieNode,
  word: string,
  score: number,
  index: number
) {
  const symbols: string[] = [];
  for (const symbol of word) {
    symbols.push(symbol);
  }
  let node = root;
  symbols.forEach((s, i) => {
    if (node.children[s] === undefined) {
      node.children[s] = createTrieNode();
      node.children[s].parent = node;
    }
    node = node.children[s];
    if (i === symbols.length - 1) {
      node.end = true;
      node.score = score;
      node.index = index;
    }
  });
}

export function findFromTrie(root: TrieNode, token: string) {
  let node = root;
  for (let iter = 0; iter < token.length && node !== undefined; iter++) {
    node = node.children[token[iter]];
  }
  return node;
}
