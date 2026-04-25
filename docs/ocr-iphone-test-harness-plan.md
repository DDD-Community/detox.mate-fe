# OCR iPhone Test Harness Plan

## 목적

- `detox.mate-fe`에서 iPhone 실기기 OCR 테스트를 반복 가능하게 수행한다.
- `Apple Vision`은 iOS native module로 실행한다.
- 의미 해석과 판정 로직은 TypeScript에서 유지한다.
- fixture 기준 테스트와 결과 저장 방식을 프로젝트 안에 고정한다.

## 기본 방향

이 프로젝트는 아래 구조로 간다.

`RN 테스트 화면 -> iOS native OCR module -> raw OCR result -> TS parser -> expected 비교 -> 결과 저장`

핵심 원칙:

- native는 `읽기`
- TS는 `판단`
- RN UI는 `실행과 결과 표시`

## 목표

이 테스트 하네스는 아래를 할 수 있어야 한다.

1. fixture 이미지를 선택할 수 있다.
2. Apple Vision OCR을 실행할 수 있다.
3. raw OCR 결과를 볼 수 있다.
4. TS parser로 최종 result를 계산할 수 있다.
5. `Run once`, `Run 5 times`, `Run all`을 수행할 수 있다.
6. expected 기준 pass/fail을 계산할 수 있다.
7. 결과를 JSON으로 저장할 수 있다.

## 권장 파일 구조

### app entry

- [App.tsx](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/App.tsx)
  - 테스트 하네스 루트 화면

### test harness source

- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/types.ts`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/fixtures.ts`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/expected.ts`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/parser.ts`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/runner.ts`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/storage.ts`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/useOCRTestHarness.ts`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/components/FixtureList.tsx`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/components/ResultPanel.tsx`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test/components/RunControls.tsx`

### fixture assets

- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/assets/ocr-fixtures/legacy_ko.png`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/assets/ocr-fixtures/legacy_en.png`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/assets/ocr-fixtures/ios26_ko.png`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/assets/ocr-fixtures/ios26_en_2.png`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/assets/ocr-fixtures/legacy_en_today.png`
- `/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/assets/ocr-fixtures/ios26_ko_today.png`

### native module

- iOS native module 파일은 Expo module 또는 iOS bridge 방식으로 추가
- 역할은 `recognizeText(imageUri)` 제공으로 제한

## 권장 데이터 구조

### fixture registry

```ts
type FixtureDefinition = {
  id: string;
  asset: number;
  uiProfile: 'legacy' | 'liquid-glass';
  locale: 'ko' | 'en';
};
```

### expected registry

```ts
type ExpectedResult =
  | {
      fixtureId: string;
      expectedStatus: 'ok';
      expectedDateLabel: string;
      expectedUsageText: string;
    }
  | {
      fixtureId: string;
      expectedStatus: 'reject';
      expectedReason:
        | 'screen_not_matched'
        | 'date_not_yesterday'
        | 'summary_date_missing'
        | 'usage_not_found';
    };
```

### native OCR result

```ts
type OCRObservation = {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type OCRResult = {
  imageWidth: number;
  imageHeight: number;
  elapsedMs: number;
  observations: OCRObservation[];
};
```

### parsed result

```ts
type ParsedResult =
  | {
      ok: true;
      dateLabel: string;
      usageText: string;
    }
  | {
      ok: false;
      reason:
        | 'screen_not_matched'
        | 'date_not_yesterday'
        | 'summary_date_missing'
        | 'usage_not_found';
      dateLabel?: string;
    };
```

### stored run result

```ts
type StoredRun = {
  suiteId: string;
  deviceModel: string;
  iosVersion: string;
  fixtureId: string;
  runIndex: number;
  elapsedMs: number;
  parsedResult: ParsedResult;
  pass: boolean;
};
```

## 테스트 화면 요구사항

테스트 화면은 아래 기능만 우선 지원하면 충분하다.

### 1. fixture list

- 등록된 fixture 목록 표시
- 현재 선택된 fixture 강조

### 2. preview

- 이미지 미리보기
- fixture 메타데이터 표시

### 3. run controls

- `Run once`
- `Run 5 times`
- `Run all`

### 4. result panel

- raw OCR observation 개수
- 최종 parsed result
- pass/fail 여부
- elapsed time

### 5. export

- 최근 suite 결과 JSON 저장
- 필요 시 공유 기능 추가

## 반복 가능한 테스트 방식

반복 가능하게 만들려면 아래가 고정되어야 한다.

1. 입력 fixture 세트
2. expected 결과 세트
3. parser 로직
4. 결과 저장 포맷

즉, 매번 사람이 눈으로 대충 보지 않고 아래 순서로 간다.

1. fixture 선택
2. OCR 실행
3. parser 실행
4. expected 비교
5. JSON 저장

## 결과 저장 방식

권장 방식은 `suite 단위 JSON` 저장이다.

예:

```json
{
  "suiteId": "iphone-2026-04-25T19-30-00",
  "deviceModel": "iPhone16,2",
  "iosVersion": "26.0",
  "runs": [
    {
      "fixtureId": "ios26_en_2",
      "runIndex": 1,
      "elapsedMs": 214,
      "parsedResult": {
        "ok": true,
        "dateLabel": "Yesterday, April 22",
        "usageText": "8h 57m"
      },
      "pass": true
    }
  ]
}
```

저장 위치는 앱 내부 문서 디렉터리를 우선 사용한다.

필요하면 이후에:

- share sheet export
- 서버 업로드
- Mac으로 복사

를 붙일 수 있다.

## 구현 순서

### Phase 1. 테스트 하네스 골격

목표:

- fixture 1장을 선택하고
- `Run once`를 누를 수 있는 화면 만들기

할 일:

1. `src/features/ocr-test` 구조 생성
2. fixture registry 작성
3. expected registry 작성
4. App.tsx에 테스트 화면 연결

### Phase 2. native OCR 연결

목표:

- iPhone에서 Apple Vision OCR raw result 받기

할 일:

1. native module 추가
2. `recognizeText(imageUri)` 구현
3. RN에서 호출 확인

### Phase 3. parser 연결

목표:

- raw OCR 결과를 TS parser로 해석

할 일:

1. 현재 macOS 규칙을 TS로 이전
2. `parseScreenTimeSummary` 구현
3. expected 비교 함수 구현

### Phase 4. 반복 실행

목표:

- 흔들림과 속도 측정

할 일:

1. `Run 5 times` 구현
2. runIndex, elapsed 저장
3. 최근 suite 표시

### Phase 5. 전체 실행

목표:

- fixture 전체 pass/fail 집계

할 일:

1. `Run all` 구현
2. suite summary 계산
3. JSON 저장

## 합격 기준

### 정확도

- 성공 fixture: exact match `100%`
- 실패 fixture: reject reason exact match `100%`

### 속도

- 최신 iPhone warm run `p95 < 1s`
- 하한선 iPhone warm run `p95 < 2s`

## 가장 먼저 할 일

바로 다음 액션은 이것이다.

1. `src/features/ocr-test` 폴더 생성
2. fixture/expected/types 초안 작성
3. App.tsx에 간단한 테스트 화면 붙이기
4. native module API를 `recognizeText(imageUri)`로 고정

즉, 처음 목표는:

`fixture 1장 + Run once + raw OCR 결과 표시`

여기까지다.
