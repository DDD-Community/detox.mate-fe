# Amplitude 로그 작업 컨벤션

## 목적

이 문서는 새 기능을 만들거나 기존 기능을 수정할 때 Amplitude 로그를 어떻게 추가할지 정리한다.

로그의 목적은 퍼널 분석과 코호트 분석이다. 많이 찍는 것보다 분석 목적에 맞는 이벤트를 일관되게 찍는 것을 우선한다.

## 작업 순서

1. [amplitude-event-schema.md](./amplitude-event-schema.md)에 eventName과 property를 먼저 추가한다.
2. `src/lib/analytics.ts`의 `ANALYTICS_EVENT_NAMES`에 같은 eventName을 추가한다.
3. 화면 진입은 `LoggingPage`로 기록한다.
4. 일반 클릭은 `LoggingButton`으로 기록한다.
5. `LoggingButton`이 맞지 않는 입력 방식은 handler 내부에서 `trackButtonClick`을 호출한다.
6. API 성공 또는 실제 상태 변경이 필요한 행동은 성공 후 `trackEvent`만 호출한다.
7. 검증 명령으로 문서, 타입, 실제 호출부가 맞는지 확인한다.

## eventName 규칙

eventName은 고유하게 쓴다.

```txt
나쁜 예: Button Clicked
좋은 예: Feed Home Calendar Open Clicked
```

화면 진입은 `{Page Name} Viewed` 형식을 쓴다.

```txt
Feed Home Viewed
Goal Setup Viewed
```

버튼과 상호작용은 `{Page Name} {Action} Clicked` 형식을 쓴다.

```txt
Feed Home Calendar Open Clicked
Feed Post Detail Comment Submit Clicked
```

제품 행동 성공 이벤트는 동사 완료형을 쓴다.

```txt
Login Completed
Group Created
Group Joined
Goal Time Set
Verification Completed
Push Notification Setting Updated
```

## 중복 로그 금지

API 성공 또는 실제 상태 전환을 기준으로 볼 수 있는 행동은 성공 후에만 찍는다.

| 행동      | 남기는 이벤트                       | 남기지 않는 이벤트 예시                     |
| --------- | ----------------------------------- | ------------------------------------------- |
| 로그인    | `Login Completed`                   | `Login Kakao Login Start Clicked`           |
| 그룹 생성 | `Group Created`                     | `Group Create Complete Clicked`             |
| 그룹 참여 | `Group Joined`                      | `Group Join Complete Clicked`               |
| 목표 저장 | `Goal Time Set`                     | `Goal Setup Goal Time Save Clicked`         |
| 푸시 설정 | `Push Notification Setting Updated` | `Settings Push Notification Toggle Clicked` |

화면 이동, 모달 열기, 외부 링크 열기, 날짜 선택, 리액션 선택처럼 별도 성공 이벤트가 없는 행동은 클릭 이벤트를 남긴다.

## property 규칙

기본 property는 snake_case를 쓴다.

| property      | 사용 시점               | 설명                                |
| ------------- | ----------------------- | ----------------------------------- |
| `page_name`   | 화면/버튼 이벤트        | 화면 고유 이름                      |
| `button_name` | 버튼 이벤트             | 실제 버튼 텍스트 또는 아이콘 역할명 |
| `event_type`  | 화면/버튼 이벤트        | `screen_view`, `button_click`       |
| `entry_point` | 같은 행동의 진입점 구분 | 예: `invite_link`, `group_home`     |

`button_name`은 실제 사용자가 보는 버튼 텍스트를 쓴다. 아이콘 버튼은 사용자가 이해하는 역할명을 쓴다.

```tsx
properties={{ pageName: 'FeedHome', buttonName: '캘린더 아이콘' }}
properties={{ pageName: 'GoalSetup', buttonName: '뒤로가기' }}
```

아래 값은 property에 넣지 않는다.

- 이름, 닉네임
- 초대 코드 원문
- 댓글 본문
- 회고 본문
- 이미지 URL
- access token, refresh token
- 분석에 직접 필요하지 않은 서버 id 원문

## 컴포넌트 사용 기준

화면 진입은 `LoggingPage`를 사용한다.

```tsx
<LoggingPage eventName="Goal Setup Viewed" properties={{ pageName: 'GoalSetup', mode }}>
  <View>{/* screen */}</View>
</LoggingPage>
```

단계가 바뀌는 화면은 `logKey`를 넣어 단계 변경 시 다시 찍히게 한다.

```tsx
<LoggingPage
  eventName="Group Create Viewed"
  properties={{ pageName: 'GroupCreate', step }}
  logKey={step}
>
  <View>{/* screen */}</View>
</LoggingPage>
```

일반 클릭은 `LoggingButton`으로 감싼다. `LoggingButton`은 child의 `onPress`에 로깅만 추가하며, 화면 이동이나 비즈니스 로직을 갖지 않는다.

```tsx
<LoggingButton
  eventName="Settings Privacy Open Clicked"
  properties={{ pageName: 'Settings', buttonName: '개인정보 처리방침' }}
>
  <Pressable onPress={handlePrivacy}>
    <Text>개인정보 처리방침</Text>
  </Pressable>
</LoggingButton>
```

`LoggingButton`은 `onPress`를 직접 받는 child에만 쓴다.

| 케이스           | 이벤트 prop       | 처리 방식                         |
| ---------------- | ----------------- | --------------------------------- |
| `Checkbox`       | `onChange`        | handler 내부 `trackButtonClick`   |
| `Switch`         | `onValueChange`   | 성공 이벤트가 있으면 성공 후 기록 |
| `ReactionPicker` | `onSelect`        | handler 내부 `trackButtonClick`   |
| `TextInput`      | `onSubmitEditing` | handler 내부 `trackButtonClick`   |
| wheel picker     | `onValueChange`   | 보통 기록하지 않음                |

키보드 제출과 버튼 클릭이 같은 행동이면 handler 내부에서 한 번만 찍는다.

```tsx
const handleSendComment = async () => {
  const text = commentText.trim();
  if (!text) return;

  trackButtonClick('Feed Post Detail Comment Submit Clicked', 'FeedPostDetail', '댓글 보내기');
  await submitComment(text);
};
```

## 유저 식별과 유저 속성

로그인 성공 후에는 `setAnalyticsUserId`를 호출한다.

유저 속성은 이벤트로 추정하지 않고 서버 응답 또는 서버 반영 성공을 기준으로 갱신한다.

| 속성                        | 기준                                                    |
| --------------------------- | ------------------------------------------------------- |
| `group_role`                | group 또는 group-member API 응답의 `OWNER`, `MEMBER`    |
| `is_leader`                 | `group_role === 'OWNER'`                                |
| `push_notification_enabled` | `/users/me` 응답 또는 알림 설정 PATCH 성공 후 설정한 값 |

## 새 로그 추가 체크리스트

- eventName이 고유한가?
- eventName을 `docs/amplitude-event-schema.md`와 `src/lib/analytics.ts`에 모두 추가했는가?
- 성공 이벤트가 있는 행동에 클릭/시도 이벤트를 중복으로 넣지 않았는가?
- `LoggingButton`이 실제 `onPress`를 받는 child에만 쓰였는가?
- 개인정보나 민감 정보가 property에 들어가지 않는가?
- dev/prod 구분용 property를 넣지 않았는가?

## 검증 명령

타입 체크:

```bash
pnpm exec tsc --noEmit
```

문서, 타입, 실제 호출부 이벤트 정합성 확인:

```bash
node <<'NODE'
const fs = require('fs');
const path = require('path');

const docs = fs.readFileSync('docs/amplitude-event-schema.md', 'utf8');
const docsEvents = new Set(
  [...docs.matchAll(/`([^`]+(?:Viewed|Clicked|Opened|Completed|Started|Created|Joined|Set|Updated))`/g)]
    .map((m) => m[1])
    .filter((event) => !event.includes('{'))
);

const analytics = fs.readFileSync('src/lib/analytics.ts', 'utf8');
const arrayMatch = analytics.match(/ANALYTICS_EVENT_NAMES\s*=\s*\[([\s\S]*?)\]\s+as const/);
const analyticsEvents = new Set([...arrayMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));

const files = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(ent.name) && p !== 'src/lib/analytics.ts' && !p.includes('.stories.')) {
      files.push(p);
    }
  }
}
walk('src');

const src = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const missingInAnalytics = [...docsEvents].filter((event) => !analyticsEvents.has(event)).sort();
const missingInDocs = [...analyticsEvents].filter((event) => !docsEvents.has(event)).sort();
const unusedInSrc = [...analyticsEvents].filter((event) => !src.includes(event)).sort();

console.log(JSON.stringify({
  docsEventCount: docsEvents.size,
  analyticsEventCount: analyticsEvents.size,
  missingInAnalytics,
  missingInDocs,
  unusedInSrc,
}, null, 2));
NODE
```

중복 후보 확인:

```bash
rg "Started|Complete Clicked|Save Clicked|Toggle Clicked" src docs
```

이 명령은 후보를 찾는 용도다. 모든 결과가 문제는 아니므로, 성공 이벤트와 중복되는지만 판단한다.
