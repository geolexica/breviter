import {
  GraphModel,
  loadGraphModel,
  Tensor,
  tensor2d,
  Tensor2D,
  tidy,
} from '@tensorflow/tfjs';
import {loadVocabulary, Tokenizer} from './tokenizer';

const BASE_PATH =
  'https://tfhub.dev/google/tfjs-model/universal-sentence-encoder-qa-ondevice/1';
// Index in the vocab file that needs to be skipped.
const SKIP_VALUES = [0, 1, 2];
// Offset value for skipped vocab index.
const OFFSET = 3;
// Input tensor size limit.
const INPUT_LIMIT = 192;
// Model node name for query.
const QUERY_NODE_NAME = 'input_inp_text';
// Model node name for query.
const RESPONSE_CONTEXT_NODE_NAME = 'input_res_context';
// Model node name for response.
const RESPONSE_NODE_NAME = 'input_res_text';
// Model node name for response result.
const RESPONSE_RESULT_NODE_NAME = 'Final/EncodeResult/mul';
// Model node name for query result.
const QUERY_RESULT_NODE_NAME = 'Final/EncodeQuery/mul';
// Reserved symbol count for tokenizer.
const RESERVED_SYMBOLS_COUNT = 3;
// Value for token padding
const TOKEN_PADDING = 2;
// Start value for each token
const TOKEN_START_VALUE = 1;

export interface ModelOutput {
  queryEmbedding: Tensor;
  responseEmbedding: Tensor;
}

export interface ModelInput {
  queries: string[];
  responses: string[];
  contexts?: string[];
}

export async function loadQnA() {
  const use = new UniversalSentenceEncoderQnA();
  await use.load();
  return use;
}

export class UniversalSentenceEncoderQnA {
  private model?: GraphModel;
  private tokenizer?: Tokenizer;

  async loadModel() {
    return loadGraphModel(BASE_PATH, {fromTFHub: true});
  }

  async load() {
    const [model, vocabulary] = await Promise.all([
      this.loadModel(),
      loadVocabulary(`${BASE_PATH}/vocab.json?tfjs-format=file`),
    ]);

    this.model = model;
    this.tokenizer = new Tokenizer(vocabulary, RESERVED_SYMBOLS_COUNT);
  }

  /**
   *
   * Returns a map of queryEmbedding and responseEmbedding
   *
   * @param input the ModelInput that contains queries and answers.
   */
  embed(input: ModelInput): ModelOutput {
    const embeddings = tidy(() => {
      const queryEncoding = this.tokenizeStrings(input.queries);
      const responseEncoding = this.tokenizeStrings(input.responses);
      if (input.contexts) {
        if (input.contexts.length !== input.responses.length) {
          throw new Error(
            'The length of response strings ' +
              'and context strings need to match.'
          );
        }
      }
      const contexts: string[] = input.contexts || [];
      if (input.contexts === null || input.contexts === undefined) {
        contexts.length = input.responses.length;
        contexts.fill('');
      }
      const contextEncoding = this.tokenizeStrings(contexts);
      const modelInputs: {[key: string]: Tensor} = {};
      modelInputs[QUERY_NODE_NAME] = queryEncoding;
      modelInputs[RESPONSE_NODE_NAME] = responseEncoding;
      modelInputs[RESPONSE_CONTEXT_NODE_NAME] = contextEncoding;

      return this.model!.execute(modelInputs, [
        QUERY_RESULT_NODE_NAME,
        RESPONSE_RESULT_NODE_NAME,
      ]);
    }) as Tensor[];
    const queryEmbedding = embeddings[0];
    const responseEmbedding = embeddings[1];

    return {queryEmbedding, responseEmbedding};
  }

  private tokenizeStrings(strs: string[]): Tensor2D {
    const tokens = strs.map(s =>
      this.shiftTokens(this.tokenizer!.encode(s), INPUT_LIMIT)
    );
    return tensor2d(tokens, [strs.length, INPUT_LIMIT], 'int32');
  }

  private shiftTokens(tokens: number[], limit: number): number[] {
    tokens.unshift(TOKEN_START_VALUE);
    for (let index = 0; index < limit; index++) {
      if (index >= tokens.length) {
        tokens[index] = TOKEN_PADDING;
      } else if (!SKIP_VALUES.includes(tokens[index])) {
        tokens[index] += OFFSET;
      }
    }
    return tokens.slice(0, limit);
  }
}
