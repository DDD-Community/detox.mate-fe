import type { FontSource } from 'expo-font';
import nanumSquareRoundB from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundB.ttf';
import nanumSquareRoundEB from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundEB.ttf';
import nanumSquareRoundL from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundL.ttf';
import nanumSquareRoundR from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundR.ttf';
import omyuPretty from '../../../../assets/fonts/omyu/omyu-pretty.ttf';
import friendsPretendardRegular from '../../../../assets/fonts/pretendard/Pretendard-Regular.otf';
import friendsPretendardMedium from '../../../../assets/fonts/pretendard/Pretendard-Medium.otf';
import friendsPretendardBold from '../../../../assets/fonts/pretendard/Pretendard-Bold.otf';

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
  FriendsPretendardRegular: friendsPretendardRegular,
  FriendsPretendardMedium: friendsPretendardMedium,
  FriendsPretendardBold: friendsPretendardBold,
} satisfies Record<string, FontSource>;

export type FontFamilyName = keyof typeof fontSources;
