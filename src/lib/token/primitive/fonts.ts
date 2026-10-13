import type { FontSource } from 'expo-font';
import pretendardLight from '../../../../assets/fonts/pretendard/Pretendard-Light.otf';
import pretendardRegular from '../../../../assets/fonts/pretendard/Pretendard-Regular.otf';
import pretendardMedium from '../../../../assets/fonts/pretendard/Pretendard-Medium.otf';
import pretendardSemiBold from '../../../../assets/fonts/pretendard/Pretendard-SemiBold.otf';
import pretendardBold from '../../../../assets/fonts/pretendard/Pretendard-Bold.otf';
import pretendardExtraBold from '../../../../assets/fonts/pretendard/Pretendard-ExtraBold.otf';

export const fontFamily = {
  primary: {
    light: 'PretendardLight',
    regular: 'PretendardRegular',
    medium: 'PretendardMedium',
    semibold: 'PretendardSemiBold',
    bold: 'PretendardBold',
    extraBold: 'PretendardExtraBold',
  },
  accent: {
    regular: 'PretendardRegular',
  },
} as const;

export const fontSources = {
  [fontFamily.primary.light]: pretendardLight,
  [fontFamily.primary.regular]: pretendardRegular,
  [fontFamily.primary.medium]: pretendardMedium,
  [fontFamily.primary.semibold]: pretendardSemiBold,
  [fontFamily.primary.bold]: pretendardBold,
  [fontFamily.primary.extraBold]: pretendardExtraBold,
} satisfies Record<string, FontSource>;

export type FontFamilyName = keyof typeof fontSources;
