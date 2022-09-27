import fs from 'fs';
import {
  UniversalSentenceEncoder,
  Tokenizer,
} from '@tensorflow-models/universal-sentence-encoder';
import {LocalUseLoadConfig} from './reverseEngine';
import * as tf from '@tensorflow/tfjs';
import * as tfn from '@tensorflow/tfjs-node';

class LocalUse extends UniversalSentenceEncoder {
  async loadLocalModel(modelPath: string) {
    const handler = tfn.io.fileSystem(modelPath);
    const model = await tf.loadGraphModel(handler);
    return model;
  }

  async loadLocalVocabulary(vocabPath: string) {
    return JSON.parse(fs.readFileSync(vocabPath, 'utf8').toString());
  }

  async load(config: LocalUseLoadConfig = {}) {
    if (config.modelUrl && config.vocabUrl) {
      return super.load({
        modelUrl: config.modelUrl,
        vocabUrl: config.vocabUrl,
      });
    }

    const [model, vocabulary] = await Promise.all([
      this.loadLocalModel(config.modelPath || ''),
      this.loadLocalVocabulary(config.vocabPath || ''),
    ]);

    // Hack to set private attributes...
    const any_this = this as any;
    // console.log("model is: ", model);
    // console.log("vocabulary is: ", vocabulary);

    any_this.model = model;
    any_this.tokenizer = new Tokenizer(vocabulary);
  }

  // async embed(inputs: string[]|string): Promise<tf.Tensor2D> {
  //   console.log("inputs are: ", inputs);
  //   return super.embed(inputs);
  // }
}

export {LocalUse};
