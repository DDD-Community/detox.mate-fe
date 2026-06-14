# Amplitude API 사용 가이드

## 목적

이 문서는 디톡스메이트 FE에서 1차 Amplitude 연동 시 사용할 API와 사용 기준을 정리한다.

초기 목표는 복잡한 최적화가 아니라 간단한 코호트 분석과 퍼널 분석이다. 따라서 1차에서는 다음 3개 API만 사용한다.

1. `init`
2. `track`
3. `setUserId`

## 현재 진행 상태

SDK 설치와 초기 `init` 연결은 완료했다.

완료된 작업은 다음과 같다.

| 항목                       | 상태 | 위치                             |
| -------------------------- | ---- | -------------------------------- |
| SDK 설치                   | 완료 | `package.json`, `pnpm-lock.yaml` |
| Amplitude API key 주입     | 완료 | `app.config.ts`                  |
| 환경값 검증 및 export      | 완료 | `src/config/env.ts`              |
| 초기화 공통 함수           | 완료 | `src/lib/analytics.ts`           |
| 이벤트 전송 공통 함수      | 완료 | `src/lib/analytics.ts`           |
| 사용자 식별 공통 함수      | 완료 | `src/lib/analytics.ts`           |
| 유저 속성 동기화 공통 함수 | 완료 | `src/lib/analytics.ts`           |
| 앱 시작 시 초기화 호출     | 완료 | `app/_layout.tsx`                |

공통 모듈에는 `track`, `setUserId`, `identify` 래퍼까지 구현되어 있다. 다음 단계에서 실제 화면과 API 응답 지점에 로그 호출을 붙인다.

## 1차 사용 API

### 1. `init`

`init`은 Amplitude SDK를 앱에서 사용할 수 있도록 초기화하는 함수다.

앱이 시작될 때 한 번만 호출한다. 초기화 이후부터 `track`, `setUserId` 같은 Amplitude API를 사용할 수 있다.

```ts
import { init } from '@amplitude/analytics-react-native';

init(AMPLITUDE_API_KEY);
```

디톡스메이트에서는 앱 루트에서 공통 함수로 감싸서 호출한다.

```ts
import { init, Types } from '@amplitude/analytics-react-native';
import { env } from '@/config/env';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;

  init(env.amplitudeApiKey, undefined, {
    logLevel: env.appEnv === 'development' ? Types.LogLevel.Debug : Types.LogLevel.Warn,
  });

  initialized = true;
}
```

사용 위치:

- `app/_layout.tsx`
- `src/lib/analytics.ts`

사용 목적:

- Amplitude SDK 초기화
- dev/prod Amplitude 프로젝트 연결
- 앱 실행 이후 이벤트 전송 준비
- 개발 환경에서 중복 초기화 방지

## 2. `track`

`track`은 사용자의 행동 이벤트를 Amplitude로 보내는 함수다.

퍼널 분석과 코호트 분석의 핵심 데이터는 대부분 `track`으로 남긴 이벤트에서 나온다.

```ts
import { track } from '@amplitude/analytics-react-native';

track('{Page Name} {Action} Clicked', {
  event_type: 'screen_view',
  page_name: 'GroupCreate',
  event_type: 'button_click',
  page_name: 'GroupCreate',
  button_name: '완료',
});
```

디톡스메이트에서는 직접 `track`을 호출하지 않고 공통 함수로 감싼다.

```ts
export function trackEvent(eventName: string, properties: Record<string, unknown> = {}) {
  track(eventName, properties);
}
```

화면 진입과 버튼 클릭은 다음처럼 사용한다.

```ts
export function trackScreenView(screenName: string) {
  trackEvent('{Page Name} Viewed', {
    page_name: screenName,
  });
}

export function trackButtonClick(screenName: string, buttonName: string) {
  trackEvent('{Page Name} {Action} Clicked', {
    page_name: screenName,
    button_name: buttonName,
  });
}
```

디톡스메이트에서 우선 남길 이벤트 예시는 다음과 같다.

| 이벤트                        | 의미                |
| ----------------------------- | ------------------- |
| `App Opened`                  | 앱 실행             |
| `Login Completed`             | 로그인 완료         |
| `Onboarding Viewed`           | 온보딩 확인         |
| `Group Created`               | 그룹 생성 완료      |
| `Invite Share Button Clicked` | 초대 공유 버튼 클릭 |
| `Group Joined`                | 초대코드 참여 완료  |
| `Goal Time Set`               | 목표 시간 설정      |
| `Verification Completed`      | 인증 완료           |

공통 property 예시는 다음과 같다.

| property        | 의미                                         |
| --------------- | -------------------------------------------- |
| `event_type`    | `screen_view`, `button_click`                |
| `page_name`     | 이벤트가 발생한 화면                         |
| `button_name`   | 실제 버튼 텍스트 또는 아이콘 역할명          |
| `entry_point`   | 같은 행동이 여러 진입점에서 발생할 때만 사용 |
| `mode`          | 같은 화면의 목적이 다를 때만 사용            |
| `verify_mode`   | `initial`, `verify`                          |
| `goal_achieved` | 인증 결과 성공/실패 구분                     |
| `next_enabled`  | 푸시 토글의 변경 방향                        |

주의사항:

- 이름, 닉네임, 이메일, 전화번호, 원본 초대코드 같은 개인정보는 보내지 않는다.
- 이벤트 이름은 행동 기준으로 작성한다.
- 제품 행동 완료 이벤트는 서버 성공 후에만 기록한다.

## 3. `setUserId`

`setUserId`는 로그인한 사용자를 Amplitude의 동일 유저로 식별하는 함수다.

코호트 분석에서는 같은 사용자가 며칠 뒤에도 돌아왔는지 보는 것이 중요하다. 따라서 로그인 성공 후 서버의 안정적인 내부 user id를 Amplitude user id로 설정한다.

```ts
import { setUserId } from '@amplitude/analytics-react-native';

setUserId(String(user.id));
```

디톡스메이트에서는 로그인 성공 직후 호출한다.

```ts
const user = await login();

setUserId(String(user.id));

trackEvent('Login Completed', {
  is_new_user: user.isNewUser,
});
```

사용 위치:

- `src/screens/auth/useAuthLogin.ts`

사용 목적:

- 로그인 이후 이벤트를 같은 유저의 행동으로 연결
- 첫 인증 완료 유저의 D1/D7/D14 리텐션 분석
- 그룹 생성 또는 그룹 참여 이후 재방문 여부 분석
- 퍼널 단계가 같은 유저의 연속 행동인지 확인

`track` property에 `user_id`를 매번 넣는 방식은 1차 기준으로 사용하지 않는다. 사용자 식별은 `setUserId`가 담당하고, `track`에는 행동의 맥락만 넣는다.

## 1차 분석 기준

### 퍼널 분석

1차 퍼널은 이벤트 기반으로 본다.

그룹 생성 퍼널:

```txt
App Opened
→ Onboarding Viewed
→ Group Create Viewed
→ Group Created
→ Invite Share Button Clicked
```

초대코드 참여 및 인증 퍼널:

```txt
Group Join Viewed
→ Group Joined
→ Goal Time Set
→ Verification Completed
```

### 코호트 분석

1차 코호트는 특정 이벤트를 수행한 유저 기준으로 본다.

예시:

- `Group Created`를 한 유저의 리텐션
- `Group Joined`를 한 유저의 리텐션
- `Verification Completed`를 한 유저의 D1/D7/D14 리텐션

이 분석을 위해서는 `setUserId`가 필요하다. `setUserId`가 있어야 Amplitude가 여러 이벤트를 같은 유저의 행동으로 연결할 수 있다.

## 이번 범위에서 제외하는 API

1차에서는 다음 API를 사용하지 않는다.

| API             | 제외 이유                                                                   |
| --------------- | --------------------------------------------------------------------------- |
| `identify`      | 유저 속성 기반 세그먼트 분석이 필요해질 때 2차로 도입                       |
| `reset`         | 1차 범위를 단순화하기 위해 보류. 로그아웃 분석/유저 전환 문제가 보이면 추가 |
| `setGroup`      | 그룹 단위 분석이 필요해질 때 도입                                           |
| `groupIdentify` | 그룹 속성 분석이 필요해질 때 도입                                           |
| `setDeviceId`   | Amplitude 기본 device id 사용                                               |
| `setSessionId`  | 세션 직접 제어 필요 없음                                                    |
| `flush`         | SDK 자동 전송 사용. 즉시 전송 테스트가 필요할 때만 검토                     |

## 최종 기준

1차 Amplitude 연동에서는 다음 기준만 지킨다.

- 앱 시작 시 `init`을 한 번 호출한다.
- 로그인 성공 후 `setUserId`를 호출한다.
- 분석할 사용자 행동은 `track`으로 남긴다.
- 개인정보와 민감 정보는 이벤트 property에 넣지 않는다.
- 코호트와 퍼널은 우선 이벤트 기반으로 단순하게 본다.
