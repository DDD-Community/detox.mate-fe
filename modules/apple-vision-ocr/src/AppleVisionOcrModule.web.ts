import { registerWebModule, NativeModule } from 'expo';

import type { NativeOCRResult, RecognizeTextOptions } from './AppleVisionOcr.types';

class AppleVisionOcrModule extends NativeModule {
  async recognizeText(_uri: string, _options?: RecognizeTextOptions): Promise<NativeOCRResult> {
    throw new Error('AppleVisionOcr is only available on native iOS builds.');
  }
}

export default registerWebModule(AppleVisionOcrModule, 'AppleVisionOcr');
