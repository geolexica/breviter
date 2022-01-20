import {CLS_INDEX, SEP_INDEX} from './BERTconstants';
import {BERT, initBERT, processBERTInput, Token, tokenizeBERT} from './BERT';
import {
  GraphModel,
  loadGraphModel,
  ones,
  scalar,
  Tensor2D,
  tensor2d,
  tidy,
} from '@tensorflow/tfjs';

const MODEL_URL = '/bert/';
const INPUT_SIZE = 384;
const MAX_ANSWER_LEN = 32;
const MAX_QUERY_LEN = 64;
const MAX_SEQ_LEN = 384;
const PREDICT_ANSWER_NUM = 5;
const OUTPUT_OFFSET = 1;
const DOCSTRIDE = 128;

const NO_ANSWER_THRESHOLD = 4.3980759382247925;

export interface QuestionAndAnswer {
  findAnswers(question: string, context: string): Promise<Answer[]>;
}

export interface ModelConfig {
  modelUrl: string;
  fromTFHub?: boolean;
}

export interface Answer {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
}

interface Feature {
  inputIds: number[];
  inputMask: number[];
  segmentIds: number[];
  origTokens: Token[];
  tokenToOrigMap: Record<number, number>;
}

interface AnswerIndex {
  start: number;
  end: number;
  score: number;
}

class QuestionAndAnswerImpl implements QuestionAndAnswer {
  private model?: GraphModel;
  private tokenizer?: BERT;
  private modelConfig: ModelConfig;

  constructor() {
    this.modelConfig = {modelUrl: MODEL_URL, fromTFHub: true};
  }

  private process(
    query: string,
    context: string,
    maxQueryLen: number,
    maxSeqLen: number
  ): Feature[] {
    // always add the question mark to the end of the query.
    query = query.replace(/\?/g, '').trim() + '?';

    const queryTokens = tokenizeBERT(this.tokenizer!, query);
    if (queryTokens.length > maxQueryLen) {
      throw new Error(
        `The length of question token exceeds the limit (${maxQueryLen}).`
      );
    }

    const origTokens = processBERTInput(context.trim());
    const tokenToOrigIndex: number[] = [];
    const allDocTokens: number[] = [];
    for (let i = 0; i < origTokens.length; i++) {
      const token = origTokens[i].text;
      const subTokens = tokenizeBERT(this.tokenizer!, token);
      for (let j = 0; j < subTokens.length; j++) {
        const subToken = subTokens[j];
        tokenToOrigIndex.push(i);
        allDocTokens.push(subToken);
      }
    }
    const maxContextLen = maxSeqLen - queryTokens.length - 3;

    const docSpans: Array<{start: number; length: number}> = [];
    let startOffset = 0;
    while (startOffset < allDocTokens.length) {
      let length = allDocTokens.length - startOffset;
      if (length > maxContextLen) {
        length = maxContextLen;
      }
      docSpans.push({start: startOffset, length});
      startOffset += Math.min(length, DOCSTRIDE);
    }

    const features = docSpans.map(docSpan => {
      const tokens = [];
      const segmentIds = [];
      const tokenToOrigMap: Record<number, number> = {};
      tokens.push(CLS_INDEX);
      segmentIds.push(0);
      for (let i = 0; i < queryTokens.length; i++) {
        const queryToken = queryTokens[i];
        tokens.push(queryToken);
        segmentIds.push(0);
      }
      tokens.push(SEP_INDEX);
      segmentIds.push(0);
      for (let i = 0; i < docSpan.length; i++) {
        const splitTokenIndex = i + docSpan.start;
        const docToken = allDocTokens[splitTokenIndex];
        tokens.push(docToken);
        segmentIds.push(1);
        tokenToOrigMap[tokens.length] = tokenToOrigIndex[splitTokenIndex];
      }
      tokens.push(SEP_INDEX);
      segmentIds.push(1);
      const inputIds = tokens;
      const inputMask = inputIds.map(() => 1);
      while (inputIds.length < maxSeqLen) {
        inputIds.push(0);
        inputMask.push(0);
        segmentIds.push(0);
      }
      return {inputIds, inputMask, segmentIds, origTokens, tokenToOrigMap};
    });
    return features;
  }

  async load() {
    this.model = await loadGraphModel(this.modelConfig.modelUrl, {
      fromTFHub: this.modelConfig.fromTFHub,
    });
    const batchSize = 1;
    const inputIds = ones([batchSize, INPUT_SIZE], 'int32');
    const segmentIds = ones([1, INPUT_SIZE], 'int32');
    const inputMask = ones([1, INPUT_SIZE], 'int32');
    this.model.execute({
      input_ids: inputIds,
      segment_ids: segmentIds,
      input_mask: inputMask,
      global_step: scalar(1, 'int32'),
    });

    this.tokenizer = await initBERT();
  }

  async findAnswers(question: string, context: string): Promise<Answer[]> {
    const features = this.process(
      question,
      context,
      MAX_QUERY_LEN,
      MAX_SEQ_LEN
    );
    const inputIdArray = features.map(f => f.inputIds);
    const segmentIdArray = features.map(f => f.segmentIds);
    const inputMaskArray = features.map(f => f.inputMask);
    const globalStep = scalar(1, 'int32');
    const batchSize = features.length;
    const result = tidy(() => {
      const inputIds = tensor2d(inputIdArray, [batchSize, INPUT_SIZE], 'int32');
      const segmentIds = tensor2d(
        segmentIdArray,
        [batchSize, INPUT_SIZE],
        'int32'
      );
      const inputMask = tensor2d(
        inputMaskArray,
        [batchSize, INPUT_SIZE],
        'int32'
      );
      return this.model!.execute(
        {
          input_ids: inputIds,
          segment_ids: segmentIds,
          input_mask: inputMask,
          global_step: globalStep,
        },
        ['start_logits', 'end_logits']
      ) as [Tensor2D, Tensor2D];
    });
    const logits = await Promise.all([result[0].array(), result[1].array()]);
    globalStep.dispose();
    result[0].dispose();
    result[1].dispose();

    const answers = [];
    for (let i = 0; i < batchSize; i++) {
      answers.push(
        this.getBestAnswers(
          logits[0][i],
          logits[1][i],
          features[i].origTokens,
          features[i].tokenToOrigMap,
          context
        )
      );
    }

    return answers
      .reduce((flatten, array) => flatten.concat(array), [])
      .sort((logitA, logitB) => logitB.score - logitA.score)
      .slice(0, PREDICT_ANSWER_NUM);
  }

  getBestAnswers(
    startLogits: number[],
    endLogits: number[],
    origTokens: Token[],
    tokenToOrigMap: {[key: string]: number},
    context: string
  ): Answer[] {
    const startIndexes = this.getBestIndex(startLogits);
    const endIndexes = this.getBestIndex(endLogits);
    const origResults: AnswerIndex[] = [];
    startIndexes.forEach(start => {
      endIndexes.forEach(end => {
        if (tokenToOrigMap[start] && tokenToOrigMap[end] && end >= start) {
          const length = end - start + 1;
          if (length < MAX_ANSWER_LEN) {
            origResults.push({
              start,
              end,
              score: startLogits[start] + endLogits[end],
            });
          }
        }
      });
    });

    origResults.sort((a, b) => b.score - a.score);
    const answers: Answer[] = [];
    for (let i = 0; i < origResults.length; i++) {
      if (
        i >= PREDICT_ANSWER_NUM ||
        origResults[i].score < NO_ANSWER_THRESHOLD
      ) {
        break;
      }

      let convertedText = '';
      let startIndex = 0;
      let endIndex = 0;
      if (origResults[i].start > 0) {
        [convertedText, startIndex, endIndex] = this.convertBack(
          origTokens,
          tokenToOrigMap,
          origResults[i].start,
          origResults[i].end,
          context
        );
      } else {
        convertedText = '';
      }
      answers.push({
        text: convertedText,
        score: origResults[i].score,
        startIndex,
        endIndex,
      });
    }
    return answers;
  }

  getBestIndex(logits: number[]): number[] {
    const tmpList = [];
    for (let i = 0; i < MAX_SEQ_LEN; i++) {
      tmpList.push([i, i, logits[i]]);
    }
    tmpList.sort((a, b) => b[2] - a[2]);

    const indexes = [];
    for (let i = 0; i < PREDICT_ANSWER_NUM; i++) {
      indexes.push(tmpList[i][0]);
    }

    return indexes;
  }

  convertBack(
    origTokens: Token[],
    tokenToOrigMap: {[key: string]: number},
    start: number,
    end: number,
    context: string
  ): [string, number, number] {
    const shiftedStart = start + OUTPUT_OFFSET;
    const shiftedEnd = end + OUTPUT_OFFSET;
    const startIndex = tokenToOrigMap[shiftedStart];
    const endIndex = tokenToOrigMap[shiftedEnd];
    const startCharIndex = origTokens[startIndex].index;

    const endCharIndex =
      endIndex < origTokens.length - 1
        ? origTokens[endIndex + 1].index - 1
        : origTokens[endIndex].index + origTokens[endIndex].text.length;

    return [
      context.slice(startCharIndex, endCharIndex + 1).trim(),
      startCharIndex,
      endCharIndex,
    ];
  }
}

export async function loadQnA(): Promise<QuestionAndAnswer> {
  const mobileBert = new QuestionAndAnswerImpl();
  await mobileBert.load();
  return mobileBert;
}
