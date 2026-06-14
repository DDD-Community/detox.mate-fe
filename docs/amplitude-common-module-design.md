# Amplitude 공통 모듈 설계

## 목적

이 문서는 디톡스메이트 FE에서 Amplitude 로그를 쉽게 남기기 위한 공통 모듈 설계를 정리한다.

현재 목표는 복잡한 분석 최적화가 아니라 간단한 코호트 분석과 퍼널 분석이다. 따라서 공통 모듈은 과하게 추상화하지 않고, 다음 목적에 맞춘다.

- 화면 코드에서 Amplitude SDK를 직접 호출하지 않는다.
- 이벤트 이름과 property 이름이 화면마다 흔들리지 않게 한다.
- 개인정보와 민감 정보가 로그에 들어가지 않게 한다.
- 코호트와 퍼널 분석에 필요한 이벤트를 쉽게 남긴다.
- 1차에서는 `init`, `track`, `setUserId`, `identify`만 사용한다.

## 전제

1차 Amplitude 연동에서 사용하는 API는 다음 4개다.

| API         | 용도                                         |
| ----------- | -------------------------------------------- |
| `init`      | 앱 시작 시 Amplitude SDK 초기화              |
| `track`     | 사용자 행동 이벤트 전송                      |
| `setUserId` | 로그인 사용자를 Amplitude의 동일 유저로 식별 |
| `identify`  | 서버 API 응답 기준의 유저 속성 동기화        |

이번 범위에서는 다음 API를 사용하지 않는다.

| API             | 제외 이유                                  |
| --------------- | ------------------------------------------ |
| `reset`         | 로그아웃 분석/유저 전환 문제가 보이면 도입 |
| `setGroup`      | 그룹 단위 분석이 필요해질 때 도입          |
| `groupIdentify` | 그룹 속성 분석이 필요해질 때 도입          |

## eventName 설계 기준

`eventName`은 개별 로그 1건을 유일하게 구분하는 id가 아니다. `eventName`은 Amplitude에서 묶어 볼 사용자 행동 타입이다.

따라서 `eventName`은 다음 기준을 따른다.

- 분석에서 구분되어야 하는 행동이면 고유한 eventName을 부여한다.
- 코호트 기준이 되는 행동이면 고유한 eventName을 부여한다.
- 퍼널 단계로 직접 보고 싶은 행동이면 고유한 eventName을 부여한다.
- 화면 이름, 버튼 이름, 진입 경로, 성공/실패 같은 세부 정보는 property로 보낸다.
- 난수나 UUID처럼 매번 달라지는 값은 eventName에 넣지 않는다.

좋은 예:

```txt
Login Completed
Group Created
Group Joined
Goal Time Set
Verification Completed
```

피해야 할 예:

```txt
Group Created 82f1a
Kakao Login Completed
GroupCreateScreenCompleteButtonClicked
POST /groups Success
handleComplete Called
```

## 화면과 버튼 로그 기준

모든 화면과 버튼에 고유한 eventName을 붙인다.

화면 조회와 버튼 클릭도 고유한 eventName을 사용하고, 화면 이름과 실제 버튼 이름은 property에도 함께 남긴다.

```ts
trackScreenView('Group Create Viewed', 'GroupCreate');

trackButtonClick('Group Create Go Feed Clicked', 'GroupCreate', '그룹 피드로 가기');
```

Amplitude에 전송되는 형태는 다음과 같다.

```ts
trackEvent('{Page Name} Viewed', {
  event_type: 'screen_view',
  page_name: 'GroupCreate',
});

trackEvent('{Page Name} {Action} Clicked', {
  event_type: 'button_click',
  page_name: 'GroupCreate',
  button_name: '완료',
});
```

이렇게 설계하는 이유는 다음과 같다.

- 화면/버튼별 고유 eventName으로 Amplitude에서 바로 구분해 볼 수 있다.
- `event_type`, `page_name`, `button_name` property로 화면/버튼 이벤트를 필터링할 수 있다.
- 핵심 퍼널 이벤트와 일반 UI 로그를 구분할 수 있다.

## 핵심 퍼널 이벤트 기준

퍼널과 코호트의 기준이 되는 행동은 공통 UI 로그에만 의존하지 않고 별도 eventName으로 남긴다.

API 성공 또는 실제 상태 전환 이벤트가 있는 행동은 클릭/시도 로그를 별도로 남기지 않는다.

```ts
trackEvent('Group Created');
```

구분 기준:

| 로그                           | 의미                                        |
| ------------------------------ | ------------------------------------------- |
| `{Page Name} {Action} Clicked` | 사용자가 버튼을 눌렀다                      |
| `Group Created`                | 그룹 생성이라는 제품 행동이 실제로 완료됐다 |

퍼널이나 코호트 기준으로 쓸 이벤트는 `Group Created` 같은 제품 행동 이벤트다.

## 추천 인터페이스

공통 모듈은 다음 6개 함수로 시작한다.

```ts
initAnalytics();

setAnalyticsUserId(userId);

setAnalyticsUserProperties(properties);

trackEvent(eventName, properties);

trackScreenView(eventName, pageName, properties);

trackButtonClick(eventName, pageName, buttonName, properties);
```

외부로 노출되는 함수는 6개지만, 내부에서 사용하는 Amplitude API는 `init`, `track`, `setUserId`, `identify` 4개뿐이다.

## 타입 설계

1차 이벤트 이름은 enum 성격의 union type으로 제한한다.

```ts
type AnalyticsEventName =
  | 'App Opened'
  | 'Login Completed'
  | 'Onboarding Viewed'
  | 'Group Created'
  | 'Invite Share Button Clicked'
  | 'Group Joined'
  | 'Goal Time Set'
  | 'Verification Completed'
  | 'Feed Home Viewed'
  | 'Feed Home Daily Verification Start Clicked';
```

property는 너무 강하게 제한하지 않고, 1차에서는 Amplitude에 보낼 수 있는 원시값 중심으로 제한한다.

```ts
type AnalyticsPropertyValue = string | number | boolean | null | undefined;

type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;
```

`trackEvent`는 Amplitude SDK 직접 호출을 감싸고, 이벤트 이름 타입과 property 값 타입을 제한한다. dev/prod 구분은 Amplitude API key와 프로젝트 분리로 처리하므로 이벤트 property에 별도 환경값을 붙이지 않는다.

```ts
track(eventName, properties);
```

유저 속성은 이벤트 property와 분리한다. 유저 속성은 서버 API 응답 또는 서버 반영이 확인된 성공 응답을 기준으로 동기화한다.

```ts
type AnalyticsUserProperties = {
  group_role?: 'OWNER' | 'MEMBER' | null;
  push_notification_enabled?: boolean | null;
};
```

## property 설계 기준

`eventName`에는 행동 이름만 담고, 행동의 맥락은 property로 보낸다.

| property        | 용도                                         |
| --------------- | -------------------------------------------- |
| `event_type`    | `screen_view`, `button_click`                |
| `page_name`     | 이벤트가 발생한 화면 이름                    |
| `button_name`   | 실제 버튼 텍스트 또는 아이콘 역할명          |
| `entry_point`   | 같은 행동이 여러 진입점에서 발생할 때만 사용 |
| `mode`          | 같은 화면의 목적이 다를 때만 사용            |
| `verify_mode`   | `initial`, `verify`                          |
| `goal_achieved` | 인증 결과 성공/실패 구분                     |
| `next_enabled`  | 푸시 토글의 변경 방향                        |

## 유저 속성 설계 기준

유저 속성은 `identify`로 관리한다.

단, 유저 속성은 이벤트 결과로 추정하지 않는다. 서버 API 응답 또는 서버 반영이 확인된 성공 응답을 source of truth로 삼는다.

| user property               | source of truth                         | 갱신 타이밍                              |
| --------------------------- | --------------------------------------- | ---------------------------------------- |
| `group_role`                | group 또는 group-member API의 `role`    | 그룹/멤버 상태 API 응답 수신 시          |
| `push_notification_enabled` | `/users/me`의 `pushNotificationEnabled` | `/users/me` 응답 수신 시                 |
| `push_notification_enabled` | `PATCH /users/me/notifications` 성공    | 알림 설정 변경이 서버에 성공 반영된 시점 |

`role`은 현재 서버 응답의 `OWNER`, `MEMBER` 값을 기준으로 한다. 방장 여부는 별도 `is_leader` 값을 만들지 않고 `group_role === 'OWNER'`로 판단한다.

```ts
setAnalyticsUserProperties({
  group_role: role,
});
```

알림 허용 여부는 `/users/me`의 `pushNotificationEnabled`를 기준으로 동기화한다.

```ts
setAnalyticsUserProperties({
  push_notification_enabled: me.pushNotificationEnabled ?? null,
});
```

알림 토글 변경은 다음 기준을 따른다.

- `PATCH /users/me/notifications` 성공 시에만 `push_notification_enabled`를 갱신한다.
- `PATCH /users/me/notifications` 실패 시에는 `identify`를 갱신하지 않는다.
- 현재 확인한 원격 `/openapi3.yaml` 기준 `PATCH /users/me/notifications`는 `204` 응답이며 body schema가 없다.
- 현재 generated client도 `customAxios<void>`로 생성되어 있다.
- 따라서 `204` 성공 응답을 받으면 서버 반영 성공으로 보고, 요청에 사용한 `nextEnabled` 값으로 `push_notification_enabled`를 갱신한다.

```ts
await updatePushNotificationSetting({ pushNotificationEnabled: nextEnabled });

trackEvent('Push Notification Setting Updated', {
  push_notification_enabled: nextEnabled,
});

setAnalyticsUserProperties({
  push_notification_enabled: nextEnabled,
});
```

역할 구분도 이벤트 결과로 추정하지 않는다.

예를 들어 `Group Created` 성공 직후 `group_role: 'OWNER'`로 추정 갱신하는 방식보다, 이후 group 또는 group-member API 응답의 `role`을 보고 갱신하는 방식을 우선한다.

```ts
const role = member.role === 'OWNER' || member.role === 'MEMBER' ? member.role : null;

setAnalyticsUserProperties({
  group_role: role,
});
```

보내지 않는 값:

- 이름
- 닉네임
- 이메일
- 전화번호
- 원본 초대코드
- 원본 이미지 URL
- access token, refresh token

## 사용 예시

### 앱 시작

```ts
initAnalytics();

trackEvent('App Opened');
```

### 로그인 성공

```ts
const user = await login();

setAnalyticsUserId(user.id);

trackEvent('Login Completed', {
  is_new_user: user.isNewUser,
});
```

### `/users/me` 응답 수신

```ts
const me = await getUser().getMe();

setAnalyticsUserProperties({
  push_notification_enabled: me.pushNotificationEnabled ?? null,
});
```

### group/member 응답 수신

```ts
const role = member.role === 'OWNER' || member.role === 'MEMBER' ? member.role : null;

setAnalyticsUserProperties({
  group_role: role,
});
```

### 화면 진입

```ts
useEffect(() => {
  trackScreenView('Group Create Viewed', 'GroupCreate');
}, []);
```

### 버튼 클릭

```ts
trackButtonClick('Group Create Go Feed Clicked', 'GroupCreate', '그룹 피드로 가기');
```

### 제품 행동 완료

```ts
try {
  await createGroup();

  trackEvent('Group Created');
}
```

## 3가지 인터페이스 비교

### 안 1. 가장 얇은 래퍼

```ts
trackEvent('Group Created');
```

장점:

- 가장 단순하다.
- 새 이벤트 추가가 쉽다.

단점:

- 이벤트 이름과 property 이름이 흔들릴 수 있다.
- 화면/버튼 로그를 매번 직접 작성해야 한다.

### 안 2. 도메인 함수 대량 생성

```ts
trackGroupCreated();
```

장점:

- 호출부가 명확하다.
- 핵심 이벤트의 property 품질을 강하게 통제할 수 있다.

단점:

- 이벤트가 늘어날 때마다 함수가 늘어난다.
- 모든 화면/버튼 로그까지 함수화하면 과하게 복잡해진다.

### 안 3. 타입 있는 범용 track + 작은 helper

```ts
trackEvent('Group Created');

trackScreenView('Group Create Viewed', 'GroupCreate');

trackButtonClick('Group Create Go Feed Clicked', 'GroupCreate', '그룹 피드로 가기');
```

장점:

- 이벤트 이름은 타입으로 제한할 수 있다.
- 화면/버튼 로그는 helper로 쉽게 찍을 수 있다.
- 핵심 퍼널 이벤트는 `trackEvent`로 명확히 남길 수 있다.
- 유저 속성은 `setAnalyticsUserProperties`로 서버 응답 기준 동기화할 수 있다.
- 도메인 함수가 과하게 늘어나지 않는다.

단점:

- 이벤트별 property를 완전히 강제하지는 않는다.

## 최종 선택

1차 공통 모듈은 안 3을 선택한다.

이유:

- 현재 목적은 간단한 코호트와 퍼널 분석이다.
- `init`, `track`, `setUserId`, `identify`만 쓰는 제한된 범위와 잘 맞는다.
- `{Page Name} Viewed`, `{Page Name} {Action} Clicked` 같은 일반 UI 로그와 `Group Created`, `Verification Completed` 같은 핵심 제품 이벤트를 함께 다룰 수 있다.
- 이벤트별 도메인 함수를 대량으로 만들지 않아도 된다.
- eventName은 enum처럼 관리하면서, 화면 이름과 버튼 이름은 property로 구분할 수 있다.
- `group_role`, `push_notification_enabled` 같은 유저 상태는 이벤트 추정이 아니라 서버 API 응답 기준으로 관리할 수 있다.

## 구현 완료 범위

`src/lib/analytics.ts`는 다음 범위까지 구현되어 있다.

- `setAnalyticsUserId`
- `setAnalyticsUserProperties`
- `trackEvent`
- `trackScreenView`
- `trackButtonClick`
- eventName union type
- property value type
- user property type
- 표준 property 이름 사용
- 서버 응답 기준 user property 동기화 helper
- 단위 테스트: `src/lib/analytics.test.ts`

화면별 실제 로그 적용은 그 다음 단계에서 진행한다.
