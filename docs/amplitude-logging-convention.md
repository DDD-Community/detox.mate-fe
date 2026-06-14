# Amplitude 로그 작업 컨벤션

## 목적

이 문서는 다음 팀원이 새 기능을 만들거나 기존 기능을 수정할 때 Amplitude 로그를 어떻게 추가해야 하는지 정리한다.

현재 로그의 목적은 복잡한 분석 최적화가 아니라 다음 두 가지다.

- 퍼널 분석: 사용자가 핵심 행동까지 도달하는지 확인한다.
- 코호트 분석: 어떤 조건의 유저가 계속 사용하는지 확인한다.

따라서 로그는 많이 찍는 것보다, 분석 목적에 맞는 이벤트를 일관되게 찍는 것을 우선한다.

## 작업 순서

새 화면이나 버튼을 추가할 때는 아래 순서로 작업한다.

1. `docs/amplitude-event-schema.md`에 eventName과 property를 먼저 추가한다.
2. `src/lib/analytics.ts`의 `ANALYTICS_EVENT_NAMES`에 같은 eventName을 추가한다.
3. 화면에는 `LoggingPage`를 추가한다.
4. 버튼에는 `LoggingButton` 또는 handler 내부 `trackButtonClick`을 추가한다.
5. API 성공이나 실제 상태 변경이 필요한 행동은 성공 후 `trackEvent`만 남긴다.
6. 아래 검증 명령으로 문서, 타입, 실제 호출부가 맞는지 확인한다.

## 기본 원칙

### 1. eventName은 고유하게 쓴다

범용 이름을 쓰지 않는다.

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

### 2. 성공 이벤트가 있으면 시도/클릭 이벤트는 찍지 않는다

API 성공 또는 실제 상태 전환을 기준으로 볼 수 있는 행동은 성공 후에만 찍는다.

```tsx
// 하지 않음
<LoggingButton
  eventName="Goal Setup Goal Time Save Clicked"
  properties={{ pageName: 'GoalSetup', buttonName: '저장하기' }}
>
  <Button onPress={handleSave} />
</LoggingButton>
```

```ts
// 성공 후에만 기록
const handleSave = async () => {
  await saveGoalTime();

  trackEvent('Goal Time Set', { mode });
};
```

대표 예시는 다음과 같다.

| 행동      | 남기는 이벤트                       | 제거하는 이벤트 예시                        |
| --------- | ----------------------------------- | ------------------------------------------- |
| 로그인    | `Login Completed`                   | `Login Kakao Login Start Clicked`           |
| 그룹 생성 | `Group Created`                     | `Group Create Complete Clicked`             |
| 그룹 참여 | `Group Joined`                      | `Group Join Complete Clicked`               |
| 목표 저장 | `Goal Time Set`                     | `Goal Setup Goal Time Save Clicked`         |
| 푸시 설정 | `Push Notification Setting Updated` | `Settings Push Notification Toggle Clicked` |

### 3. 성공 이벤트가 없는 단순 이동/열기/선택은 클릭 로그를 남긴다

화면 이동, 모달 열기, 외부 링크 열기, 날짜 선택, 리액션 선택처럼 별도 성공 이벤트가 없는 행동은 클릭 이벤트를 남긴다.

```tsx
<LoggingButton
  eventName="Feed Home Calendar Open Clicked"
  properties={{ pageName: 'FeedHome', buttonName: '캘린더 아이콘' }}
>
  <Pressable onPress={handleOpenCalendar}>
    <Icon name="calendar" />
  </Pressable>
</LoggingButton>
```

### 4. 개인정보와 민감 정보는 넣지 않는다

아래 값은 event property에 넣지 않는다.

- 이름, 닉네임
- 초대 코드 원문
- 댓글 본문
- 회고 본문
- 이미지 URL
- access token, refresh token
- 서버 id가 분석에 직접 필요하지 않은 경우의 원문 id

필요한 맥락은 enum 성격의 값으로 바꿔서 넣는다.

```ts
trackEvent('Group Joined', {
  entry_point: paramInviteCode ? 'invite_link' : 'group_home',
});
```

## 화면 로그

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

조건이 준비된 뒤에만 화면 로그를 찍어야 하면 `enabled`를 사용한다.

```tsx
<LoggingPage
  eventName="My Page Viewed"
  properties={{ pageName: 'MyPage', profile_mode: isFriend ? 'friend' : 'me' }}
  enabled={!isLoading}
>
  <View>{/* screen */}</View>
</LoggingPage>
```

## 버튼 로그

`Pressable`, `TouchableOpacity`, 공통 `Button`, `HeaderAction`, `AuthLoginButton`처럼 `onPress` prop을 직접 받는 컴포넌트는 `LoggingButton`으로 감싼다.

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

`buttonName`은 실제 사용자가 보는 버튼 텍스트를 쓴다. 아이콘 버튼은 사용자가 이해하는 역할명을 쓴다.

```tsx
properties={{ pageName: 'FeedHome', buttonName: '캘린더 아이콘' }}
properties={{ pageName: 'GoalSetup', buttonName: '뒤로가기' }}
```

## LoggingButton을 쓰면 안 되는 경우

`LoggingButton`은 child의 `onPress`를 주입하는 방식이다. 따라서 아래처럼 `onPress`가 아닌 prop으로 동작하는 컴포넌트에는 쓰지 않는다.

| 케이스           | 이벤트 prop       | 처리 방식                         |
| ---------------- | ----------------- | --------------------------------- |
| `Checkbox`       | `onChange`        | handler 내부 `trackButtonClick`   |
| `Switch`         | `onValueChange`   | 성공 이벤트가 있으면 성공 후 기록 |
| `ReactionPicker` | `onSelect`        | handler 내부 `trackButtonClick`   |
| `TextInput`      | `onSubmitEditing` | handler 내부 `trackButtonClick`   |
| wheel picker     | `onValueChange`   | 보통 기록하지 않음                |

예시:

```tsx
const handleToggleChange = (next: boolean) => {
  trackButtonClick(
    'Terms Agreement Privacy Agree Toggle Clicked',
    'TermsAgreement',
    '개인정보처리 방침 동의 토글'
  );
  setPrivacyAgreed(next);
};

<Checkbox checked={privacyAgreed} onChange={handleToggleChange} />;
```

키보드 제출과 버튼 클릭이 같은 행동이면 handler 내부에서 한 번만 찍는다.

```tsx
const handleSendComment = async () => {
  const text = commentText.trim();
  if (!text) return;

  trackButtonClick('Feed Post Detail Comment Submit Clicked', 'FeedPostDetail', '댓글 보내기');
  await submitComment(text);
};

<TextInput onSubmitEditing={handleSendComment} />;
<Pressable onPress={handleSendComment}>{/* send */}</Pressable>;
```

## 제품 성공 이벤트

퍼널 기준으로 볼 핵심 행동은 성공 후 `trackEvent`로 기록한다.

```ts
const handleComplete = async () => {
  const data = await createGroup();

  trackEvent('Group Created');
};
```

현재 사용하는 제품 성공 이벤트는 다음과 같다.

| eventName                           | 기록 시점                                |
| ----------------------------------- | ---------------------------------------- |
| `Login Completed`                   | 로그인 성공 후 `setUserId`가 가능한 시점 |
| `Group Created`                     | `POST /groups` 성공 후                   |
| `Group Joined`                      | `POST /groups/join` 성공 후              |
| `Invite Share Button Clicked`       | 초대 공유 버튼 클릭                      |
| `Goal Time Set`                     | 목표 시간 저장 API 성공 후               |
| `Verification Completed`            | 활동 기록 제출 성공 후                   |
| `Push Notification Setting Updated` | `PATCH /users/me/notifications` 성공 후  |

## 유저 식별과 유저 속성

로그인 성공 후에는 `setAnalyticsUserId`를 호출한다.

```ts
const user = await login();

setAnalyticsUserId(user.id);
trackEvent('Login Completed', { is_new_user: user.isNewUser });
```

유저 속성은 이벤트로 추정하지 않고 서버 응답 또는 서버 반영 성공을 기준으로 갱신한다.

```ts
setAnalyticsUserProperties({
  group_role: group.myRole,
});
```

```ts
await updatePushNotificationSetting({ pushNotificationEnabled: enabled });

trackEvent('Push Notification Setting Updated', {
  push_notification_enabled: enabled,
});

setAnalyticsUserProperties({
  push_notification_enabled: enabled,
});
```

## 새 로그 추가 체크리스트

새 로그를 추가할 때 아래를 확인한다.

- eventName이 고유한가?
- `docs/amplitude-event-schema.md`에 추가했는가?
- `src/lib/analytics.ts`의 `ANALYTICS_EVENT_NAMES`에 추가했는가?
- 성공 이벤트가 있는 행동에 클릭/시도 이벤트를 중복으로 넣지 않았는가?
- `LoggingButton`이 실제 `onPress`를 받는 child에만 쓰였는가?
- `Checkbox`, `Switch`, `onSelect`, `onSubmitEditing` 같은 예외는 handler 내부에서 처리했는가?
- 개인정보나 민감 정보가 property에 들어가지 않는가?
- `pageName`, `buttonName`은 실제 컨벤션과 맞는가?
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

삭제한 이벤트나 중복 정책 위반 이벤트가 남아 있는지 확인:

```bash
rg "Started|Complete Clicked|Save Clicked|Toggle Clicked" src docs
```

위 명령은 후보를 찾는 용도다. 모든 결과가 문제는 아니므로, 성공 이벤트가 있는 행동과 중복되는지 확인한다.
