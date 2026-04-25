import * as React from 'react';

import { AppleVisionOcrViewProps } from './AppleVisionOcr.types';

export default function AppleVisionOcrView(props: AppleVisionOcrViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad?.({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
