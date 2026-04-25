import { requireNativeView } from 'expo';
import * as React from 'react';

import { AppleVisionOcrViewProps } from './AppleVisionOcr.types';

const NativeView: React.ComponentType<AppleVisionOcrViewProps> =
  requireNativeView('AppleVisionOcr');

export default function AppleVisionOcrView(props: AppleVisionOcrViewProps) {
  return <NativeView {...props} />;
}
