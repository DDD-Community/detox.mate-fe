# 마이페이지/알림 작업 후속 정리

이번 `feat/mypage` 브랜치에서 발생한 미해결/보류 항목 모음. 별도 브랜치에서 이어 작업할 수 있도록 정리.

## 🔗 피드 화면 데이터 연동에 종속된 작업

`src/screens/group/FeedScreen.tsx` 가 아직 API 연동이 안 되어 있어 다음 항목들이 미완 상태로 남음.

### FEED_DETAIL 알림 → 게시물 상세 진입

- 현재: 알림(댓글/반응)이 `targetType=FEED_DETAIL` + `targetId=challengeRecordId`로 와도 별도 상세 화면이 없어 `/(group)/feed?challengeRecordId=...` 로 폴백.
- 필요: 게시물 상세 화면 신설 또는 피드에서 해당 challengeRecord 스크롤/하이라이트.
- 영향 파일: [src/screens/notification/NotificationListScreen.tsx:routeByTarget](../src/screens/notification/NotificationListScreen.tsx)

### FEED 알림 → 특정 챌린지 피드로 진입

- 현재: `targetType=FEED` + `targetId=groupChallengeId`로 와도 `/(group)/feed`가 groupChallengeId를 사용하지 않음.
- 필요: FeedScreen이 `useLocalSearchParams`로 `groupChallengeId`를 받아 해당 챌린지 데이터를 fetch.
- 영향 파일: [src/screens/group/FeedScreen.tsx](../src/screens/group/FeedScreen.tsx)

## 🔔 FCM 후속

### 권한 OS 설정에서 ON 시 자동 등록

- 사용자가 앱 밖(시스템 설정)에서 알림 권한을 허용 후 돌아오면 토스트 토글 표시는 ON으로 갱신되지만 디바이스 토큰은 등록되지 않음.
- 필요: `SettingsScreen.syncSystemPermission` 콜백에서 `systemGranted` 가 false→true 전환을 감지하면 `registerDevicePushToken()` 호출.
- 영향 파일: [src/screens/group/mypage/SettingsScreen.tsx](../src/screens/group/mypage/SettingsScreen.tsx)

### FCM 토큰 갱신 처리

- FCM 토큰은 가끔 자동 refresh됨. 갱신된 토큰을 서버에 다시 등록해야 푸시가 끊기지 않음.
- 필요: `Notifications.addPushTokenListener`로 토큰 변경 이벤트 구독 → 새 토큰으로 register 재호출.
- 영향 파일: [src/lib/fcmToken.ts](../src/lib/fcmToken.ts), 앱 루트 어딘가에서 리스너 마운트

## 🟡 UX 보강

### 친구 프로필 이미지 표시

- 현재 친구 모드에서 항상 거북이 이미지. `friendProfile.profileImageUrl` 무시.
- 필요: 디자인 확정 후 본인 모드와 동일하게 `profileImageUrl` 적용.
- 영향 파일: [src/screens/group/MyPageScreen.tsx](../src/screens/group/MyPageScreen.tsx) `turtleWrap`

### 성공 토스트 일괄 추가

- 초대 코드 복사, 그룹 탈퇴, 콕 찌르기, 닉네임 변경, 목표 변경 등 성공 시 사용자 피드백 없음.
- 필요: 일반 토스트(현재 NetworkErrorToast 일반 메시지 모드 재사용 가능)에 success 표시 variant 추가.
- 영향 파일: [src/stores/networkErrorToastStore.ts](../src/stores/networkErrorToastStore.ts), 호출처 다수

### 목표 시간 변경 진입 가드

- `goalChangeAvailability.canChange === false`여도 EditGoalTimeScreen 직접 진입은 가능. 저장 시 API 에러로만 막힘.
- 필요: 마이페이지 진입 가드 강화 또는 EditGoalTimeScreen에서 canChange 검증 후 안내.
- 영향 파일: [src/screens/group/mypage/EditGoalTimeScreen.tsx](../src/screens/group/mypage/EditGoalTimeScreen.tsx)

## 🟢 정책/시각적 완성

### 외부 링크 3종

- 설정 화면의 문의하기 / 서비스 이용 약관 / 개인정보 처리방침 미구현.
- 필요: URL 결정 후 `Linking.openURL`.
- 영향 파일: [src/screens/group/mypage/SettingsScreen.tsx](../src/screens/group/mypage/SettingsScreen.tsx) handleContact/Terms/Privacy

### WeeklyStatusCard 도넛 진행률 호

- 현재 단색 원형 ring으로 표현. 진행률 부분 호 표시는 TODO.
- 필요: `react-native-svg` 도입 후 Circle stroke-dashoffset 등으로 호 그리기.
- 영향 파일: [src/screens/group/mypage/WeeklyStatusCard.tsx](../src/screens/group/mypage/WeeklyStatusCard.tsx)

### 다중 그룹 처리 정책

- 현재 `getMyGroups()` 응답의 첫 번째 그룹만 사용. 여러 그룹 가입 가능 시 메인 그룹을 어떻게 결정할지 미정.
- 필요: 정책 결정(가장 최근 가입? 사용자 선택?) 후 적용.
- 영향 파일: [src/screens/group/MyPageScreen.tsx](../src/screens/group/MyPageScreen.tsx), [src/screens/group/mypage/GroupInfoScreen.tsx](../src/screens/group/mypage/GroupInfoScreen.tsx)

### 친구 마이페이지 파라미터 누락 시 에러 UI

- 알림 등 우회 경로로 친구 마이페이지에 진입할 때 `friendGroupId/memberId`가 빠지면 빈 화면이 표시됨.
- 필요: 파라미터 검증 후 명시적 에러 UI 또는 안전한 폴백(본인 마이페이지 등).
- 영향 파일: [src/screens/group/MyPageScreen.tsx](../src/screens/group/MyPageScreen.tsx)
