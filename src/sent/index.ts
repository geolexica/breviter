import {
  GraphModel,
  loadGraphModel,
  NamedTensorMap,
  Tensor,
  tensor1d,
  tensor2d,
  Tensor2D,
  util,
} from '@tensorflow/tfjs';
import {loadVocabulary, Tokenizer} from './tokenizer';

const BASE_PATH = '/../sbert';

declare interface ModelInputs extends NamedTensorMap {
  indices: Tensor;
  values: Tensor;
}

interface LoadConfig {
  modelUrl?: string;
  vocabUrl?: string;
}

export async function load(config?: LoadConfig) {
  const use = new UniversalSentenceEncoder();
  await use.load(config);
  return use;
}

export class UniversalSentenceEncoder {
  private model?: GraphModel;
  private tokenizer?: Tokenizer;

  async loadModel(modelUrl?: string) {
    return modelUrl
      ? loadGraphModel(modelUrl)
      : loadGraphModel(BASE_PATH + '/model.json', {fromTFHub: false});
  }

  async load(config: LoadConfig = {}) {
    const [model, vocabulary] = await Promise.all([
      this.loadModel(config.modelUrl),
      loadVocabulary(config.vocabUrl || `${BASE_PATH}/vocab.json`),
    ]);

    this.model = model;
    this.tokenizer = new Tokenizer(vocabulary);
  }

  /**
   *
   * Returns a 2D Tensor of shape [input.length, 512] that contains the
   * Universal Sentence Encoder embeddings for each input.
   *
   * @param inputs A string or an array of strings to embed.
   */
  async embed(inputs: string[] | string): Promise<Tensor2D> {
    if (typeof inputs === 'string') {
      inputs = [inputs];
    }

    const encodings = inputs.map(d => this.tokenizer!.encode(d));

    const indicesArr = encodings.map((arr, i) =>
      arr.map((d, index) => [i, index])
    );

    let flattenedIndicesArr: Array<[number, number]> = [];
    for (let i = 0; i < indicesArr.length; i++) {
      flattenedIndicesArr = flattenedIndicesArr.concat(
        indicesArr[i] as Array<[number, number]>
      );
    }

    const indices = tensor2d(
      flattenedIndicesArr,
      [flattenedIndicesArr.length, 2],
      'int32'
    );
    const values = tensor1d(util.flatten(encodings) as number[], 'int32');

    const modelInputs: ModelInputs = {indices, values};

    const embeddings = await this.model!.executeAsync(modelInputs);
    indices.dispose();
    values.dispose();

    return embeddings as Tensor2D;
  }
}
