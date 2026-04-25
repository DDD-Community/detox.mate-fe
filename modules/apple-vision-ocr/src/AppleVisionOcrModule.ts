import { NativeModule, requireNativeModule } from 'expo';

import type { NativeOCRResult, RecognizeTextOptions } from './AppleVisionOcr.types';

declare class AppleVisionOcrModule extends NativeModule {
  recognizeText(uri: string, options?: RecognizeTextOptions): Promise<NativeOCRResult>;
}

export default requireNativeModule<AppleVisionOcrModule>('AppleVisionOcr');
