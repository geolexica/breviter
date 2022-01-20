import {FocusStyleManager} from '@blueprintjs/core';
import {useState} from 'react';
import {Answer, loadQnA} from '../src/qna';
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css';
import '@blueprintjs/core/lib/css/blueprint.css';

FocusStyleManager.onlyShowFocusOnTabs();

export default function Home() {
  const [source, setSource] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<Answer[]>([]);

  async function testBERT() {
    const model = await loadQnA();
    const answers = await model.findAnswers(question, source);
    console.log(answers);
    setAnswer(answers);
  }

  return (
    <div>
      Input paragraph here:
      <textarea value={source} onChange={x => setSource(x.target.value)} />
      <br />
      Question:
      <input value={question} onChange={x => setQuestion(x.target.value)} />
      <button onClick={testBERT}>Test</button>
      Answers:
      {answer.map((answer, index) => (
        <AnswerField answer={answer} key={index} ori={source} />
      ))}
    </div>
  );
}

function AnswerField({answer, ori}: {answer: Answer; ori: string}) {
  return (
    <p>
      {answer.text} (score = {answer.score} ) {answer.startIndex},{' '}
      {answer.endIndex}: {ori.slice(answer.startIndex, answer.endIndex + 1)}
    </p>
  );
}
