import { expect, it } from 'vitest';

import { parseRecipientUserIds } from './recipientUserIds';

it('쉼표로 구분한 수신자 ID를 숫자 배열로 읽고, 비었거나 잘못된 값은 버린다', () => {
  expect(parseRecipientUserIds('7,9')).toEqual([7, 9]);
  expect(parseRecipientUserIds('')).toEqual([]);
  expect(parseRecipientUserIds(undefined)).toEqual([]);
  expect(parseRecipientUserIds('7,abc,,9.5')).toEqual([7]);
});
