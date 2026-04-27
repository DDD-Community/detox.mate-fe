import AppleVisionOcrModule, {
  type NativeOCRResult,
  type RecognizeTextOptions,
} from '../../../modules/apple-vision-ocr';

export async function recognizeText(
  imageUri: string,
  options?: RecognizeTextOptions,
): Promise<NativeOCRResult> {
  return AppleVisionOcrModule.recognizeText(imageUri, options);
}
