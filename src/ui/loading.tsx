import {Spinner} from '@blueprintjs/core';

const Loading: React.FC<{
  text: string;
}> = function ({text}) {
  return (
    <div>
      <Spinner />
      <p>{text}</p>
    </div>
  );
};

export default Loading;
