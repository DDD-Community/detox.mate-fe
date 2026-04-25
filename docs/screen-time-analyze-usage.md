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

## Included Demo

현재 [App.tsx](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/App.tsx) 에는 아래 데모가 포함되어 있다.

- `이미지 선택`
- `분석하기`
- 결과 `hh:mm` 표시
- 실패 reason 표시

## Architecture

- Apple Vision OCR: native iOS
- Summary/date parsing: TypeScript
- Result formatting: TypeScript

즉 native는 `읽기`, TS는 `요약 카드 추출 + 실제 어제 날짜 검증`을 담당한다.
