import type { FontSource } from 'expo-font';
import nanumSquareRoundB from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundB.ttf';
import nanumSquareRoundEB from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundEB.ttf';
import nanumSquareRoundL from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundL.ttf';
import nanumSquareRoundR from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundR.ttf';
import omyuPretty from '../../../../assets/fonts/omyu/omyu-pretty.ttf';

export const fontFamily = {
  primary: {
    light: 'NanumSquareRoundL',
    regular: 'NanumSquareRoundR',
    medium: 'NanumSquareRoundB',
    bold: 'NanumSquareRoundEB',
  },
  accent: {
    regular: 'OmyuPretty',
  },
} as const;

export const fontSources = {
  [fontFamily.primary.light]: nanumSquareRoundL,
  [fontFamily.primary.regular]: nanumSquareRoundR,
  [fontFamily.primary.medium]: nanumSquareRoundB,
  [fontFamily.primary.bold]: nanumSquareRoundEB,
  [fontFamily.accent.regular]: omyuPretty,
} satisfies Record<string, FontSource>;

export type FontFamilyName = keyof typeof fontSources;
