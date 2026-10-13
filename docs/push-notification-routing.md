# 푸시 알림 라우팅

기준: [푸시 알림 정책](https://www.notion.so/3f4ad7a38ce581dfb606ff3b82e740d3), 2026-10-09 조회.
매핑 구현은 `src/lib/notificationDestination.ts`에 둔다. Expo Router의 경로에 `detoxmate:/`를 붙인 값이 아래 URL Scheme이다. N-01~N-07은 `targetId`를 사용하지 않는다.

| 알림                        | FCM `type`                  | `targetType`       | URL Scheme                               |
| --------------------------- | --------------------------- | ------------------ | ---------------------------------------- |
| N-01 친구 요청 도착         | `FRIEND_REQUEST_RECEIVED`   | `FRIEND_REQUESTS`  | `detoxmate://friends`                    |
| N-02 친구 요청 수락         | `FRIEND_REQUEST_ACCEPTED`   | `FRIENDS`          | `detoxmate://friends`                    |
| N-03 제한 초과 후 일시 해제 | `FRIEND_APP_UNLOCKED`       | `NONE`             | `detoxmate://notifications`              |
| N-04 목표 시간 변경         | `FRIEND_TIME_LIMIT_CHANGED` | `NONE`             | `detoxmate://notifications`              |
| N-05 앱 해제 진입           | `APP_UNLOCK_REQUESTED`      | `APP_UNLOCK_TIMER` | `detoxmate://unlock-timer?appId={appId}` |
| N-06 앱 잠금 등록 해제      | `FRIEND_UNLOCKED`           | `NONE`             | `detoxmate://notifications`              |
| N-07 재잠금 1분 전          | `APP_RELOCK_REMINDER`       | `NONE`             | `detoxmate://restricted-apps`            |

`NONE`만으로는 목적지를 결정할 수 없어 현재 서버가 함께 보내는 `type`으로 구분한다. N-03·N-04·N-06의 피드 전환은 피드 설계 시 URL과 전달 값을 확정한 뒤 반영한다. N-08은 MVP 제외다.

## 진입과 앱 식별

- 실행 중 알림 탭과 종료 상태에서 앱을 연 마지막 알림 응답을 모두 처리한다. 화면 준비 후 기존 인증 진입점을 거쳐 이동하고, 로그인 전에는 응답을 보존한다. 이동한 응답은 지워 다음 실행에서 재사용하지 않는다.
- 친구 화면은 새로 진입하여 검색어·스크롤을 초기화하고 기존 focus 재조회로 친구·받은 요청 목록을 갱신한다. 받은 요청은 검색하지 않는 화면의 위쪽에 표시된다.
- N-05의 `appId`는 선택한 앱의 내부 식별자를 URL 인코딩한다. 저장된 앱 목록 복원을 기다린 뒤 등록 여부를 확인하고, 타이머 완료 후에도 같은 식별자를 해제 시간 설정에 전달한다. 등록 해제된 앱은 제한 앱 현황으로 이동한다.
- **서버 연동 잔여 사항:** 현재 N-05 FCM에는 `appId`가 없다. 이 경우 제한 앱 현황으로 이동하며 임의의 앱을 선택하지 않는다. 서버 알림으로 해당 앱의 타이머를 열려면 서버가 `appId`를 전달해야 한다.
- **알림 목록 서버 연동:** 알림 페이지는 N-03·N-04·N-06 이력 저장, 친구 알림 5종·168시간 미만 조회, 이동 응답의 `url`을 지원하는 서버와 함께 적용한다. 이 서버 보완은 푸시의 기존 대상·발송 조건을 바꾸지 않는다.
- 실제 iOS 쉴드는 로컬 알림에 `type: APP_UNLOCK_REQUEST`, `targetType: APP_UNLOCK_TIMER`, `appId`를 담는다. 기존 설치 앱이 이미 만든 `APP_UNLOCK_REQUEST` 알림도 처리한다.
- 로컬 재잠금 예약 알림에도 `type: APP_RELOCK_REMINDER`, `targetType: NONE`을 넣는다. 알림 기록을 생성하는 API는 호출하지 않는다.
- 현재 서버의 그룹 관련 대상은 기존처럼 알림 목록으로 연결한다. 알 수 없는 대상과 기본 탭 이외의 알림 액션은 이동하지 않는다.

Expo 알림 응답 수명주기는 [SDK 55 공식 문서](https://docs.expo.dev/versions/v55.0.0/sdk/notifications/#handle-push-notifications-with-navigation)를 따른다. 실제 FCM 전달·종료 상태의 네이티브 탭·쉴드 확장 동작은 실기기 확인이 필요하다.

## 앱 안 알림 목록

- 기존 `/notifications` 조회와 `/notifications/{notificationHistoryId}/navigation`을 사용한다. 목록은 서버가 N-01·N-02·N-03·N-04·N-06 중 생성 후 168시간 미만인 이력을 최신순으로 반환한다.
- 모든 항목은 공통 기본 아바타와 서버 `message`를 표시한다. 읽음 상태·개수는 사용하지 않는다.
- 기기 날짜 기준으로 오늘·어제·최근 7일을 나눈다. 오늘은 방금 전·n분 전·n시간 전, 어제는 오전/오후 시각, 이전은 n일 전으로 표시한다.
- 항목 클릭은 이동 API가 반환한 `url`로 이동한다. URL에 기존 친구 페이지의 필수 값이 포함되며 알림 화면에서 친구 관계를 조회하거나 변경하지 않는다. 이동할 수 없으면 안내 후 목록에 머문다.
- 알림 조회의 Orval 출력은 `notificationsQuery`로 분리했다. 서버 보완 배포 후 `pnpm exec orval --project notificationsQuery`로 재생성한다. 배포 전에는 동일 서버 코드의 Springdoc 명세 파일을 `API_DOCS_URL`로 지정한다.
