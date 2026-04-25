export type RecognizeTextOptions = {
  recognitionLanguages?: string[];
  recognitionLevel?: 'fast' | 'accurate';
  usesLanguageCorrection?: boolean;
  minimumTextHeight?: number;
};

export type NativeOCRObservation = {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type NativeOCRResult = {
  imageWidth: number;
  imageHeight: number;
  elapsedMs: number;
  observations: NativeOCRObservation[];
};

export type AppleVisionOcrViewProps = {
  url: string;
  onLoad?: (event: { nativeEvent: { url: string } }) => void;
};
