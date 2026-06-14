# Amplitude 로그 구현 검증 Loop

## 목적

이 문서는 Amplitude 로그를 구현한 뒤, 코드 기준으로 로그가 올바르게 추가되었는지 확인하는 검증 Loop를 정리한다.

Amplitude Live Events에서 실제 수신 여부를 최종 확인하는 일은 수동 QA로 남긴다. 대신 구현자는 다음을 코드와 정적 검증 명령으로 확인한다.

- eventName이 고유한 값인지
- `button_name`이 실제 버튼 텍스트 또는 아이콘 역할명인지
- 불필요한 property가 섞이지 않았는지
- 공통 모듈이 일관된 property를 붙이는지
- 핵심 제품 이벤트가 올바른 성공 시점에 찍히는지

## 검증 범위

구현자가 직접 확인할 범위는 다음과 같다.

| 구분           | 확인 내용                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| 공통 모듈      | `trackEvent`, `trackScreenView`, `trackButtonClick`, `setAnalyticsUserId`, `setAnalyticsUserProperties` 구현 |
| 스키마 정합성  | `docs/amplitude-event-schema.md`의 eventName/property와 실제 호출값 일치                                     |
| 금지값 검사    | 제거하기로 한 eventName/property가 코드에 다시 들어오지 않았는지 확인                                        |
| 호출 위치 리뷰 | 화면 진입, 버튼 클릭, API 성공 시점에 로그가 중복 없이 찍히는지 확인                                         |
| 수동 QA 지원   | 사용자가 직접 눌러볼 핵심 이벤트 체크리스트 제공                                                             |

Amplitude 서버 수신 여부는 API 조회 권한이 없는 한 코드에서 직접 보증하지 않는다. 구현자는 수동 QA 전에 코드상 로그 호출이 정상임을 최대한 닫아둔다.

## 구현할 검증 장치

### 1. Analytics debug buffer

`src/lib/analytics.ts`에 테스트용 debug buffer를 둔다.

```ts
type AnalyticsDebugEvent = {
  eventName: AnalyticsEventName;
  properties: AnalyticsProperties;
};
```

`trackEvent`가 호출될 때 내부 배열에 `{ eventName, properties }`를 저장한다. 개발 중 필요하면 다음 함수로 실제로 쌓인 이벤트를 확인할 수 있다.

```ts
getAnalyticsDebugEvents();
clearAnalyticsDebugEvents();
```

이 buffer는 개발 중 검증을 위한 장치다. 실제 Amplitude 전송 흐름은 유지한다.

### 2. 정적 감사 명령

analytics 호출부를 대상으로 정적 감사 명령을 실행한다. 이번 범위에서는 별도 테스트 코드를 추가하지 않는다.

검사 대상:

- `src/**/*.ts`
- `src/**/*.tsx`
- `app/**/*.ts`
- `app/**/*.tsx`
- 단, `*.test.ts`, `*.test.tsx`는 감사 대상에서 제외한다.

검사 기준:

| 검사                   | 실패 조건                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| generic eventName 금지 | `Screen Viewed`, `Button Clicked` 사용                                                                                                 |
| 제거 property 금지     | `verify_root`, `provider`, `error_reason`, `utm_`, `log_id`, `auth_state`, `goal_state`, `reaction_code`, `has_image`, `has_text` 사용 |
| 버튼명 코드값 금지     | `button_name`에 `goal_setup`, `complete` 같은 snake_case literal 사용                                                                  |
| 화면 이벤트 규칙       | `trackScreenView`의 eventName이 `Viewed`로 끝나지 않음                                                                                 |
| 버튼 이벤트 규칙       | `trackButtonClick`의 eventName이 `Clicked`로 끝나지 않음                                                                               |

정적 감사는 모든 버튼 클릭을 테스트 코드로 만들지 않기 위한 안전장치다.

## 자동 검증 Loop

Amplitude 로그 구현 후 다음 순서로 확인한다.

1. `docs/amplitude-event-schema.md` 기준으로 eventName, `page_name`, `button_name`을 대조한다.
2. `docs/amplitude-event-schema.md`, `src/lib/analytics.ts`, 실제 `src` 호출부의 eventName이 일치하는지 확인한다.

```bash
node <<'NODE'
const fs = require('fs');
const path = require('path');
const analytics = fs.readFileSync('src/lib/analytics.ts', 'utf8');
const arrayMatch = analytics.match(/ANALYTICS_EVENT_NAMES\s*=\s*\[([\s\S]*?)\]\s+as const/);
const events = [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
const eventSet = new Set(events);
const docs = fs.readFileSync('docs/amplitude-event-schema.md', 'utf8');
const docEvents = [...docs.matchAll(/`([^`]+(?:Viewed|Clicked|Opened|Completed|Started|Created|Joined|Set|Updated))`/g)]
  .map((match) => match[1])
  .filter((eventName) => /^[A-Z]/.test(eventName) && !eventName.includes('{') && !eventName.includes('Page Name'));
const docSet = new Set(docEvents);
function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(filePath));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(filePath);
  }
  return out;
}
const files = walk('src').filter((filePath) => !filePath.includes('.test.') && filePath !== 'src/lib/analytics.ts');
const code = files.map((filePath) => fs.readFileSync(filePath, 'utf8')).join('\n');
console.log({
  docsEventCount: docSet.size,
  analyticsEventCount: events.length,
  missingInAnalytics: [...docSet].filter((eventName) => !eventSet.has(eventName)),
  missingInDocs: events.filter((eventName) => !docSet.has(eventName)),
  unusedInSrc: events.filter((eventName) => !code.includes(eventName)),
});
NODE
```

정상 결과:

- `missingInAnalytics: []`
- `missingInDocs: []`
- `unusedInSrc: []`

3. 금지 문자열을 `rg`로 한 번 더 확인한다.

```bash
rg -g '!*.test.ts' -g '!*.test.tsx' "['\"](?:Screen Viewed|Button Clicked)['\"]|(?:^|[\s,{])['\"]?(?:verify_root|provider|error_reason|log_id|auth_state|goal_state|reaction_code|has_image|has_text|utm_[A-Za-z0-9_]*)['\"]?\s*:" src app
```

이 명령은 결과가 없어야 정상이다. `provider`처럼 일반 코드에서도 쓰일 수 있는 단어는 전체 문자열 검색이 아니라 property key 형태만 검사한다.

4. 타입 검사를 실행한다.

```bash
pnpm exec tsc --noEmit
```

5. 포맷 검사를 실행한다.

```bash
pnpm exec prettier --check docs/amplitude-event-schema.md src/components/LoggingButton/LoggingButton.tsx src/components/LoggingPage/LoggingPage.tsx src/lib/analytics.ts src/api/auth.ts src/features/activity-record/submitTotalUsageActivityRecord.ts src/screens
```

현재 repo에 analytics와 무관한 기존 syntax/type error가 있으면, analytics 변경과 관련 있는 실패인지 분리해서 보고한다.

## 호출 위치 리뷰 기준

구현 후 화면별로 다음을 리뷰한다.

| 로그 종류             | 리뷰 기준                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------ |
| 화면 진입 로그        | 화면 진입 시 1회만 찍히는지 확인한다. 불필요한 re-render마다 찍히면 안 된다.               |
| 버튼 클릭 로그        | 실제 사용자 액션 시점에 찍히는지 확인한다. 화면 렌더링만으로 버튼 로그가 찍히면 안 된다.   |
| 제품 행동 완료 이벤트 | API 성공 또는 상태 전환 성공 후에만 찍힌다. 실패 이벤트는 1차 범위에서 추가하지 않는다.    |
| identify              | 서버 API 응답 또는 서버 반영 성공 후에만 갱신한다.                                         |
| 개인정보              | 이름, 닉네임, 초대 코드 원문, 댓글 본문, 회고 본문, 이미지 URL을 property로 보내지 않는다. |

## 수동 QA 체크리스트

사용자가 직접 Amplitude Live Events 또는 dev 로그에서 확인할 핵심 시나리오는 다음과 같다.

| 시나리오              | 기대 이벤트                                  |
| --------------------- | -------------------------------------------- |
| 앱 진입               | `App Opened`                                 |
| 온보딩 확인           | `Onboarding Viewed`                          |
| 그룹 생성 완료        | `Group Created`                              |
| 초대 공유             | `Invite Share Button Clicked`                |
| 초대 코드 참여 완료   | `Group Joined`                               |
| 목표 시간 저장        | `Goal Time Set`                              |
| 피드 홈 진입          | `Feed Home Viewed`                           |
| 피드 홈 인증하기 클릭 | `Feed Home Daily Verification Start Clicked` |
| 인증 완료             | `Verification Completed`                     |
| 푸시 알림 설정 변경   | `Push Notification Setting Updated`          |
| 푸시 설정 서버 반영   | `Push Notification Setting Updated`          |

수동 QA에서 확인할 property는 최소한 다음이다.

- 화면 이벤트: `event_type`, `page_name`
- 버튼 이벤트: `event_type`, `page_name`, `button_name`
- 인증 이벤트: `verify_mode`, 필요한 경우 `goal_achieved`
- 푸시 이벤트: `next_enabled`, `push_notification_enabled`

## 제외 범위

이번 검증 Loop에서는 다음을 하지 않는다.

- 모든 화면/버튼에 대한 개별 클릭 테스트 작성
- analytics 전용 테스트 파일 추가
- Expo web 또는 시뮬레이터 e2e 자동화
- Amplitude 서버 수신 여부를 API로 조회
- 실패 이벤트 대량 추가
- 추후 마케팅 분석용 `utm`, `referral` property 추가

## Assumptions

- `docs/amplitude-event-schema.md`를 로그 스키마의 source of truth로 둔다.
- 사용자는 Amplitude Live Events에서 최종 수신 여부를 직접 확인한다.
- 구현자는 코드상 로그 호출과 property 정합성을 자동 테스트와 정적 감사로 검증한다.
- `button_name`은 코드 식별자가 아니라 실제 버튼 텍스트 또는 아이콘 역할명이다.
- 제품 행동 완료 이벤트는 성공 후에만 찍는다.
