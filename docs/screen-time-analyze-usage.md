# Screen Time Analyze Usage

## Goal

업로드된 스크린타임 이미지를 분석해서 `hh:mm` 형식 값을 반환한다.

예:

- `4시간 2분` -> `04:02`
- `8h 57m` -> `08:57`

## Public API

```ts
import { analyzeScreenTimeImage } from '../api/screenTimeAnalyze';

const result = await analyzeScreenTimeImage(imageUri);

if (result.ok) {
  console.log(result.value); // "04:02"
} else {
  console.log(result.reason);
  // "date_not_yesterday" | "summary_date_not_actual_yesterday" | "summary_date_missing" | ...
}
```

## Return Shape

성공:

```ts
{
  ok: true,
  value: "04:02",
  dateLabel: "어제, 4월 22일",
  rawUsageText: "4시간 2분",
  elapsedMs: 218
}
```

실패:

```ts
{
  ok: false,
  reason: "date_not_yesterday",
  dateLabel: "Today, April 23",
  elapsedMs: 251
}
```

실제 어제 날짜 mismatch:

```ts
{
  ok: false,
  reason: "summary_date_not_actual_yesterday",
  dateLabel: "Yesterday, April 21",
  elapsedMs: 218
}
```

## Recommended Flow

1. 사용자가 이미지를 업로드한다.
2. 앱에서 `imageUri`를 확보한다.
3. `analyzeScreenTimeImage(imageUri)`를 호출한다.
4. 성공이면 `result.value`를 서버나 다음 단계로 넘긴다.
5. 실패면 `reason`을 기준으로 재업로드 안내를 한다.

## Internal Test UI

기본 `App` 엔트리는 비워 두고, 분석 테스트 UI는 별도 내부 테스트 화면으로 분리해서 유지한다.

- 루트 엔트리: `RootEntry.tsx`
- 테스트 화면: `src/features/screen-time-analyze/ScreenTimeAnalyzeTestScreen.tsx`
- deep link path: `screen-time-analyze-test`

즉 앱은 `RootEntry`에서 진입 URL을 읽고:

- 기본 경로면 `App`
- `...://screen-time-analyze-test` 면 실제 업로드/분석 흐름을 가진 테스트 화면

으로 분기한다.

## Architecture

- Apple Vision OCR: native iOS
- Summary/date parsing: TypeScript
- Result formatting: TypeScript

즉 native는 `읽기`, TS는 `요약 카드 추출 + 실제 어제 날짜 검증`을 담당한다.
