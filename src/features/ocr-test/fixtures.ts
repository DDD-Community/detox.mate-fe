import type { FixtureDefinition } from './types';

export const OCR_FIXTURES: FixtureDefinition[] = [
  {
    id: 'legacy_ko',
    label: 'legacy + ko',
    asset: require('../../../assets/ocr-fixtures/legacy_ko.png'),
    uiProfile: 'legacy',
    locale: 'ko',
  },
  {
    id: 'legacy_en',
    label: 'legacy + en',
    asset: require('../../../assets/ocr-fixtures/legacy_en.png'),
    uiProfile: 'legacy',
    locale: 'en',
  },
  {
    id: 'ios26_ko',
    label: 'liquid-glass + ko',
    asset: require('../../../assets/ocr-fixtures/ios26_ko.png'),
    uiProfile: 'liquid-glass',
    locale: 'ko',
  },
  {
    id: 'ios26_en_2',
    label: 'liquid-glass + en',
    asset: require('../../../assets/ocr-fixtures/ios26_en_2.png'),
    uiProfile: 'liquid-glass',
    locale: 'en',
  },
  {
    id: 'legacy_en_today',
    label: 'legacy + en reject',
    asset: require('../../../assets/ocr-fixtures/legacy_en_today.png'),
    uiProfile: 'legacy',
    locale: 'en',
  },
  {
    id: 'ios26_ko_today',
    label: 'liquid-glass + ko reject',
    asset: require('../../../assets/ocr-fixtures/ios26_ko_today.png'),
    uiProfile: 'liquid-glass',
    locale: 'ko',
  },
];
