# Amplitude 전체 로그 스키마

## 목적

이 문서는 현재 FE 코드 기준으로 모든 주요 화면과 버튼에 어떤 Amplitude 로그를 붙일지 정리한다.

분석 목적은 다음 두 가지다.

- 코호트 분석: 어떤 조건의 유저가 계속 사용하는지 확인한다.
- 퍼널 분석: 사용자가 핵심 행동까지 도달하는 과정에서 어디서 이탈하는지 확인한다.

## 기본 원칙

- 화면 진입은 `{Page Name} Viewed`처럼 고유한 eventName으로 기록하고, `event_type = screen_view`를 함께 보낸다.
- 버튼 클릭은 `{Page Name} {Action} Clicked`처럼 고유한 eventName으로 기록하고, `button_name`에는 사용자가 보는 실제 버튼명 또는 아이콘의 실제 역할명을 넣는다.
- 퍼널 단계나 코호트 기준이 되는 제품 행동은 별도 eventName으로 기록한다.
- API 성공 또는 실제 상태 전환 이벤트가 있는 행동은 클릭/시도 로그를 별도로 남기지 않는다.
- dev/prod 구분은 Amplitude API key와 프로젝트 분리로 처리한다. 이벤트 property에 `environment`, `build_channel`은 넣지 않는다.
- 이름, 닉네임, 초대 코드 원문, 댓글 본문, 회고 본문, 이미지 URL 같은 개인정보 또는 민감 정보는 보내지 않는다.

## 공통 property

| property      | 적용 대상        | 설명                                                     |
| ------------- | ---------------- | -------------------------------------------------------- |
| `page_name`   | 화면/버튼 이벤트 | 화면 고유 이름                                           |
| `button_name` | 버튼 이벤트      | 실제 버튼 텍스트 또는 아이콘 역할명                      |
| `event_type`  | 화면/버튼 이벤트 | `screen_view`, `button_click`                            |
| `entry_point` | 필요한 이벤트만  | 같은 버튼이 여러 진입점에서 쓰여 퍼널 구분이 필요한 경우 |
| `step`        | 단계형 화면      | 온보딩, 그룹 생성, 그룹 참여 단계                        |
| `verify_mode` | 인증 플로우      | `initial`, `verify`                                      |

## 화면 조회 로그

모든 화면 진입 시 다음 형태로 기록한다.

```ts
trackScreenView('Feed Home Viewed', 'FeedHome');
```

| route                                                     | page_name                       | eventName                                  | properties                                                |
| --------------------------------------------------------- | ------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| `app/index.tsx`                                           | `Splash`                        | `Splash Viewed`                            | `event_type`, `page_name`                                 |
| `/(auth)/onboarding`                                      | `Onboarding`                    | `Onboarding Viewed`                        | `event_type`, `page_name`, `step`                         |
| `/(auth)/terms-agreement`                                 | `TermsAgreement`                | `Terms Agreement Viewed`                   | `event_type`, `page_name`                                 |
| `/(auth)/login`                                           | `Login`                         | `Login Viewed`                             | `event_type`, `page_name`                                 |
| `Login` modal                                             | `AppAccessPermissionGuideModal` | `App Access Permission Guide Modal Viewed` | `event_type`, `page_name`                                 |
| `/(group)/home`                                           | `GroupHome`                     | `Group Home Viewed`                        | `event_type`, `page_name`                                 |
| `/(group)/create`                                         | `GroupCreate`                   | `Group Create Viewed`                      | `event_type`, `page_name`, `step`                         |
| `/(group)/join`                                           | `GroupJoin`                     | `Group Join Viewed`                        | `event_type`, `page_name`, `step`, `entry_point`          |
| `/(feed)/home`                                            | `FeedHome`                      | `Feed Home Viewed`                         | `event_type`, `page_name`                                 |
| `/(feed)/calendar`                                        | `Calendar`                      | `Calendar Viewed`                          | `event_type`, `page_name`                                 |
| `/(feed)/calendar-history`                                | `CalendarHistory`               | `Calendar History Viewed`                  | `event_type`, `page_name`                                 |
| `/(feed)/post-detail`                                     | `FeedPostDetail`                | `Feed Post Detail Viewed`                  | `event_type`, `page_name`                                 |
| `/(group)/notifications`                                  | `NotificationList`              | `Notification List Viewed`                 | `event_type`, `page_name`                                 |
| `/(group)/mypage`                                         | `MyPage`                        | `My Page Viewed`                           | `event_type`, `page_name`, `profile_mode`                 |
| `/(group)/settings`                                       | `Settings`                      | `Settings Viewed`                          | `event_type`, `page_name`                                 |
| `/(group)/group-info`                                     | `GroupInfo`                     | `Group Info Viewed`                        | `event_type`, `page_name`                                 |
| `/(group)/nickname-edit`                                  | `EditNickname`                  | `Edit Nickname Viewed`                     | `event_type`, `page_name`                                 |
| `/(group)/goal-time-edit`                                 | `GoalSetup`                     | `Goal Setup Viewed`                        | `event_type`, `page_name`, `mode`                         |
| `/(group)/goal`                                           | `GoalSetup`                     | `Goal Setup Viewed`                        | `event_type`, `page_name`, `mode`                         |
| `/(group)/post`                                           | `PostFeed`                      | `Post Feed Viewed`                         | `event_type`, `page_name`                                 |
| `/(group)/verify`, `/(feed)/verify`                       | `VerifyHowTo`                   | `Verify How To Viewed`                     | `event_type`, `page_name`, `verify_mode`                  |
| `/(group)/verify/method`, `/(feed)/verify/method`         | `VerifyMethod`                  | `Verify Method Viewed`                     | `event_type`, `page_name`, `verify_mode`                  |
| `/(group)/verify/upload`, `/(feed)/verify/upload`         | `VerifyUpload`                  | `Verify Upload Viewed`                     | `event_type`, `page_name`, `verify_mode`                  |
| `/(group)/verify/done`, `/(feed)/verify/done`             | `VerifyDone`                    | `Verify Done Viewed`                       | `event_type`, `page_name`, `verify_mode`, `goal_achieved` |
| `/(group)/verify/error`, `/(feed)/verify/error`           | `VerifyError`                   | `Verify Error Viewed`                      | `event_type`, `page_name`, `verify_mode`                  |
| `/(group)/verify/wrong-time`, `/(feed)/verify/wrong-time` | `VerifyWrongTime`               | `Verify Wrong Time Viewed`                 | `event_type`, `page_name`, `goal_achieved`                |
| `/(group)/verify/retro`, `/(feed)/verify/retro`           | `Retro`                         | `Retro Viewed`                             | `event_type`, `page_name`                                 |
| `/(group)/verify/complete`, `/(feed)/verify/complete`     | `VerifyComplete`                | `Verify Complete Viewed`                   | `event_type`, `page_name`                                 |

## 버튼 및 상호작용 로그

일반 버튼 클릭은 다음 형태로 기록한다.

```ts
trackButtonClick('Feed Home Daily Verification Start Clicked', 'FeedHome', '인증하기');
```

| page_name                       | 버튼/상호작용               | button_name                   | eventName                                                         | properties                                                |
| ------------------------------- | --------------------------- | ----------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| `Onboarding`                    | 이전                        | `이전`                        | `Onboarding Previous Clicked`                                     | `event_type`, `page_name`, `button_name`, `step`          |
| `Onboarding`                    | 다음                        | `다음`                        | `Onboarding Next Clicked`                                         | `event_type`, `page_name`, `button_name`, `step`          |
| `Onboarding`                    | 시작하기                    | `시작하기`                    | `Onboarding Start Clicked`                                        | `event_type`, `page_name`, `button_name`, `step`          |
| `TermsAgreement`                | 전체 동의                   | `전체 동의`                   | `Terms Agreement Agree All Clicked`                               | `event_type`, `page_name`, `button_name`                  |
| `TermsAgreement`                | 개인정보처리 방침 동의 토글 | `개인정보처리 방침 동의 토글` | `Terms Agreement Privacy Agree Toggle Clicked`                    | `event_type`, `page_name`, `button_name`                  |
| `TermsAgreement`                | 서비스 이용 약관 동의 토글  | `서비스 이용 약관 동의 토글`  | `Terms Agreement Terms Agree Toggle Clicked`                      | `event_type`, `page_name`, `button_name`                  |
| `TermsAgreement`                | 개인정보처리 방침 열기      | `개인정보처리 방침 열기`      | `Terms Agreement Privacy Open Clicked`                            | `event_type`, `page_name`, `button_name`                  |
| `TermsAgreement`                | 서비스 이용 약관 열기       | `서비스 이용 약관 열기`       | `Terms Agreement Terms Open Clicked`                              | `event_type`, `page_name`, `button_name`                  |
| `TermsAgreement`                | 확인                        | `확인`                        | `Terms Agreement Confirm Clicked`                                 | `event_type`, `page_name`, `button_name`                  |
| `Login`                         | 테스트 계정으로 시작하기    | `테스트 계정으로 시작하기`    | `Login Test Key Login Open Clicked`                               | `event_type`, `page_name`, `button_name`                  |
| `Login`                         | 테스트 ID로 시작하기        | `테스트 ID로 시작하기`        | `Login Test Id Login Open Clicked`                                | `event_type`, `page_name`, `button_name`                  |
| `AppAccessPermissionGuideModal` | 확인                        | `확인`                        | `App Access Permission Guide Modal Confirm Clicked`               | `event_type`, `page_name`, `button_name`                  |
| `GroupHome`                     | 마이페이지 아이콘           | `마이페이지 아이콘`           | `Group Home Mypage Open Clicked`                                  | `event_type`, `page_name`, `button_name`                  |
| `GroupHome`                     | 새 그룹 만들기              | `새 그룹 만들기`              | `Group Home Group Create Start Clicked`                           | `event_type`, `page_name`, `button_name`                  |
| `GroupHome`                     | 초대 코드 입력              | `초대 코드 입력`              | `Group Home Group Join Start Clicked`                             | `event_type`, `page_name`, `button_name`                  |
| `GroupCreate`                   | 이전                        | `이전`                        | `Group Create Previous Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `GroupCreate`                   | 초대 코드 복사              | `초대 코드 복사`              | `Group Create Invite Code Copy Clicked`                           | `event_type`, `page_name`, `button_name`                  |
| `GroupCreate`                   | 그룹 피드로 가기            | `그룹 피드로 가기`            | `Group Create Go Feed Clicked`                                    | `event_type`, `page_name`, `button_name`                  |
| `GroupJoin`                     | 이전                        | `이전`                        | `Group Join Previous Clicked`                                     | `event_type`, `page_name`, `button_name`                  |
| `GroupJoin`                     | 초대 코드 복사              | `초대 코드 복사`              | `Group Join Invite Code Copy Clicked`                             | `event_type`, `page_name`, `button_name`                  |
| `GroupJoin`                     | 그룹 피드로 가기            | `그룹 피드로 가기`            | `Group Join Go Feed Clicked`                                      | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 알림 아이콘                 | `알림 아이콘`                 | `Feed Home Notification Open Clicked`                             | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 캘린더 아이콘               | `캘린더 아이콘`               | `Feed Home Calendar Open Clicked`                                 | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 마이페이지 아이콘           | `마이페이지 아이콘`           | `Feed Home Mypage Open Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 목표 설정하기               | `목표 설정하기`               | `Feed Home Goal Setup Start Clicked`                              | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 인증하기                    | `인증하기`                    | `Feed Home Daily Verification Start Clicked`                      | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 멤버 아바타                 | `멤버 아바타`                 | `Feed Home Member Avatar Press Clicked`                           | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 피드 카드 본문              | `피드 카드 본문`              | `Feed Home Feed Card Open Clicked`                                | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 피드 카드 프로필            | `피드 카드 프로필`            | `Feed Home Feed Card Profile Open Clicked`                        | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 콕 찌르기                   | `콕 찌르기`                   | `Feed Home Poke Clicked`                                          | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 리액션 버튼                 | `리액션 버튼`                 | `Feed Home Reaction Picker Open Clicked`                          | `event_type`, `page_name`, `button_name`                  |
| `FeedHome`                      | 리액션 선택                 | `리액션 선택`                 | `Feed Home Reaction Select Clicked`                               | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 뒤로가기                    | `뒤로가기`                    | `Feed Post Detail Back Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 작성자 프로필               | `작성자 프로필`               | `Feed Post Detail Profile Open Clicked`                           | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 콕 찌르기                   | `콕 찌르기`                   | `Feed Post Detail Poke Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 리액션 유저 프로필          | `리액션 유저 프로필`          | `Feed Post Detail Reaction User Profile Open Clicked`             | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 콕 찌른 유저 프로필         | `콕 찌른 유저 프로필`         | `Feed Post Detail Poke User Profile Open Clicked`                 | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 댓글 보내기                 | `댓글 보내기`                 | `Feed Post Detail Comment Submit Clicked`                         | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 리액션 열기                 | `리액션 열기`                 | `Feed Post Detail Reaction Picker Open Clicked`                   | `event_type`, `page_name`, `button_name`                  |
| `FeedPostDetail`                | 리액션 선택                 | `리액션 선택`                 | `Feed Post Detail Reaction Select Clicked`                        | `event_type`, `page_name`, `button_name`                  |
| `Calendar`                      | 뒤로가기                    | `뒤로가기`                    | `Calendar Back Clicked`                                           | `event_type`, `page_name`, `button_name`                  |
| `Calendar`                      | 그룹 스트릭 설명            | `그룹 스트릭 설명`            | `Calendar Streak Info Open Clicked`                               | `event_type`, `page_name`, `button_name`                  |
| `Calendar`                      | 이전 달                     | `이전 달`                     | `Calendar Previous Month Clicked`                                 | `event_type`, `page_name`, `button_name`                  |
| `Calendar`                      | 다음 달                     | `다음 달`                     | `Calendar Next Month Clicked`                                     | `event_type`, `page_name`, `button_name`                  |
| `Calendar`                      | 날짜 선택                   | `날짜 선택`                   | `Calendar Date Select Clicked`                                    | `event_type`, `page_name`, `button_name`                  |
| `CalendarHistory`               | 뒤로가기                    | `뒤로가기`                    | `Calendar History Back Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `CalendarHistory`               | 이전 날짜                   | `이전 날짜`                   | `Calendar History Previous Date Clicked`                          | `event_type`, `page_name`, `button_name`                  |
| `CalendarHistory`               | 다음 날짜                   | `다음 날짜`                   | `Calendar History Next Date Clicked`                              | `event_type`, `page_name`, `button_name`                  |
| `CalendarHistory`               | 피드 카드 본문              | `피드 카드 본문`              | `Calendar History Feed Card Open Clicked`                         | `event_type`, `page_name`, `button_name`                  |
| `CalendarHistory`               | 피드 카드 프로필            | `피드 카드 프로필`            | `Calendar History Feed Card Profile Open Clicked`                 | `event_type`, `page_name`, `button_name`                  |
| `NotificationList`              | 닫기                        | `닫기`                        | `Notification List Close Clicked`                                 | `event_type`, `page_name`, `button_name`                  |
| `NotificationList`              | 알림 항목                   | `알림 항목`                   | `Notification List Notification Item Open Clicked`                | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 뒤로가기                    | `뒤로가기`                    | `My Page Back Clicked`                                            | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 홈 아이콘                   | `홈 아이콘`                   | `My Page Home Open Clicked`                                       | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 설정 아이콘                 | `설정 아이콘`                 | `My Page Settings Open Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 닉네임 변경                 | `닉네임 변경`                 | `My Page Nickname Edit Open Clicked`                              | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 프로필 이미지 변경          | `프로필 이미지 변경`          | `My Page Profile Image Edit Open Clicked`                         | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 친구 콕 찌르기              | `친구 콕 찌르기`              | `My Page Poke Clicked`                                            | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 목표 스크린 타임 설정       | `목표 스크린 타임 설정`       | `My Page Goal Setup Start Clicked`                                | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 새 그룹 만들기              | `새 그룹 만들기`              | `My Page Group Create Start Clicked`                              | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 초대 코드 입력              | `초대 코드 입력`              | `My Page Group Join Start Clicked`                                | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 그룹 카드                   | `그룹 카드`                   | `My Page Group Info Open Clicked`                                 | `event_type`, `page_name`, `button_name`                  |
| `MyPage`                        | 목표 스크린 타임 변경       | `목표 스크린 타임 변경`       | `My Page Goal Time Edit Open Clicked`                             | `event_type`, `page_name`, `button_name`                  |
| `ProfileImageBottomSheet`       | 기본 이미지                 | `기본 이미지`                 | `Profile Image Bottom Sheet Profile Image Default Select Clicked` | `event_type`, `page_name`, `button_name`                  |
| `ProfileImageBottomSheet`       | 갤러리에서 선택             | `갤러리에서 선택`             | `Profile Image Bottom Sheet Profile Image Gallery Select Clicked` | `event_type`, `page_name`, `button_name`                  |
| `Settings`                      | 뒤로가기                    | `뒤로가기`                    | `Settings Back Clicked`                                           | `event_type`, `page_name`, `button_name`                  |
| `Settings`                      | 문의하기                    | `문의하기`                    | `Settings Contact Open Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `Settings`                      | 서비스 이용 약관            | `서비스 이용 약관`            | `Settings Terms Open Clicked`                                     | `event_type`, `page_name`, `button_name`                  |
| `Settings`                      | 개인정보 처리방침           | `개인정보 처리방침`           | `Settings Privacy Open Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `Settings`                      | 로그아웃                    | `로그아웃`                    | `Settings Logout Alert Open Clicked`                              | `event_type`, `page_name`, `button_name`                  |
| `Settings`                      | 회원 탈퇴                   | `회원 탈퇴`                   | `Settings Withdraw Alert Open Clicked`                            | `event_type`, `page_name`, `button_name`                  |
| `NotificationPermissionAlert`   | 설정으로 가기               | `설정으로 가기`               | `Notification Permission Alert App Settings Open Clicked`         | `event_type`, `page_name`, `button_name`                  |
| `NotificationPermissionAlert`   | 취소                        | `취소`                        | `Notification Permission Alert Cancel Clicked`                    | `event_type`, `page_name`, `button_name`                  |
| `LogoutConfirmAlert`            | 취소                        | `취소`                        | `Logout Confirm Alert Cancel Clicked`                             | `event_type`, `page_name`, `button_name`                  |
| `LogoutConfirmAlert`            | 로그아웃                    | `로그아웃`                    | `Logout Confirm Alert Logout Confirm Clicked`                     | `event_type`, `page_name`, `button_name`                  |
| `WithdrawConfirmAlert`          | 취소                        | `취소`                        | `Withdraw Confirm Alert Cancel Clicked`                           | `event_type`, `page_name`, `button_name`                  |
| `WithdrawConfirmAlert`          | 탈퇴하기                    | `탈퇴하기`                    | `Withdraw Confirm Alert Withdraw Confirm Clicked`                 | `event_type`, `page_name`, `button_name`                  |
| `GroupInfo`                     | 뒤로가기                    | `뒤로가기`                    | `Group Info Back Clicked`                                         | `event_type`, `page_name`, `button_name`                  |
| `GroupInfo`                     | 초대 코드 복사              | `초대 코드 복사`              | `Group Info Invite Code Copy Clicked`                             | `event_type`, `page_name`, `button_name`                  |
| `GroupInfo`                     | 멤버 카드                   | `멤버 카드`                   | `Group Info Member Profile Open Clicked`                          | `event_type`, `page_name`, `button_name`                  |
| `GroupInfo`                     | 그룹 나가기                 | `그룹 나가기`                 | `Group Info Leave Group Alert Open Clicked`                       | `event_type`, `page_name`, `button_name`                  |
| `LeaveGroupAlert`               | 취소                        | `취소`                        | `Leave Group Alert Cancel Clicked`                                | `event_type`, `page_name`, `button_name`                  |
| `LeaveGroupAlert`               | 동의하고 나가기             | `동의하고 나가기`             | `Leave Group Alert Leave Group Confirm Clicked`                   | `event_type`, `page_name`, `button_name`                  |
| `EditNickname`                  | 뒤로가기                    | `뒤로가기`                    | `Edit Nickname Back Clicked`                                      | `event_type`, `page_name`, `button_name`                  |
| `EditNickname`                  | 변경 완료                   | `변경 완료`                   | `Edit Nickname Nickname Submit Clicked`                           | `event_type`, `page_name`, `button_name`                  |
| `GoalSetup`                     | 뒤로가기                    | `뒤로가기`                    | `Goal Setup Back Clicked`                                         | `event_type`, `page_name`, `button_name`, `mode`          |
| `VerifyHowTo`                   | 모달 바깥 닫기              | `모달 바깥 닫기`              | `Verify How To Dismiss Clicked`                                   | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyHowTo`                   | 다시 보지 않기              | `다시 보지 않기`              | `Verify How To Hide Forever Clicked`                              | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyHowTo`                   | 확인                        | `확인`                        | `Verify How To Confirm Clicked`                                   | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyMethod`                  | 갤러리로 가기               | `갤러리로 가기`               | `Verify Method Gallery Open Clicked`                              | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyMethod`                  | 설정으로 캡쳐하러 가기      | `설정으로 캡쳐하러 가기`      | `Verify Method Screen Time Settings Open Clicked`                 | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyUpload`                  | 캡처 업로드                 | `캡처 업로드`                 | `Verify Upload Screenshot Upload Select Clicked`                  | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyUpload`                  | 스캔하기                    | `스캔하기`                    | `Verify Upload Screenshot Scan Start Clicked`                     | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyDone`                    | 개인 목표 설정하기          | `개인 목표 설정하기`          | `Verify Done Goal Setup Start After Scan Clicked`                 | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyDone`                    | 건너뛰기                    | `건너뛰기`                    | `Verify Done Verification Skip Post Clicked`                      | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyDone`                    | 게시물 올리기               | `게시물 올리기`               | `Verify Done Post Feed Start Clicked`                             | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyDone`                    | 회고 기록하기               | `회고 기록하기`               | `Verify Done Retro Start Clicked`                                 | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyDone`                    | 시간이 틀려요               | `시간이 틀려요`               | `Verify Done Wrong Time Report Start Clicked`                     | `event_type`, `page_name`, `button_name`, `goal_achieved` |
| `VerifyError`                   | 다시 캡쳐하러 가기          | `다시 캡쳐하러 가기`          | `Verify Error Retake Screenshot Clicked`                          | `event_type`, `page_name`, `button_name`, `verify_mode`   |
| `VerifyWrongTime`               | 닫기                        | `닫기`                        | `Verify Wrong Time Close Clicked`                                 | `event_type`, `page_name`, `button_name`, `goal_achieved` |
| `VerifyWrongTime`               | 확인                        | `확인`                        | `Verify Wrong Time Confirm Clicked`                               | `event_type`, `page_name`, `button_name`, `goal_achieved` |
| `PostFeed`                      | 뒤로가기                    | `뒤로가기`                    | `Post Feed Back Clicked`                                          | `event_type`, `page_name`, `button_name`                  |
| `PostFeed`                      | 건너뛰기                    | `건너뛰기`                    | `Post Feed Skip Clicked`                                          | `event_type`, `page_name`, `button_name`                  |
| `PostFeed`                      | 사진 업로드                 | `사진 업로드`                 | `Post Feed Photo Upload Select Clicked`                           | `event_type`, `page_name`, `button_name`                  |
| `PostFeed`                      | 게시하기                    | `게시하기`                    | `Post Feed Post Submit Clicked`                                   | `event_type`, `page_name`, `button_name`                  |
| `Retro`                         | 뒤로가기                    | `뒤로가기`                    | `Retro Back Clicked`                                              | `event_type`, `page_name`, `button_name`                  |
| `Retro`                         | 사진 업로드                 | `사진 업로드`                 | `Retro Photo Upload Select Clicked`                               | `event_type`, `page_name`, `button_name`                  |
| `Retro`                         | 게시하기                    | `게시하기`                    | `Retro Retro Submit Clicked`                                      | `event_type`, `page_name`, `button_name`                  |
| `VerifyComplete`                | 홈으로 돌아가기             | `홈으로 돌아가기`             | `Verify Complete Go Home Clicked`                                 | `event_type`, `page_name`, `button_name`, `verify_mode`   |

## 핵심 제품 이벤트

퍼널과 코호트 기준으로 직접 볼 이벤트는 아래처럼 별도 eventName으로 남긴다. 버튼 클릭 로그와 별개로, 서버 반영 또는 실제 상태 전환이 확인된 뒤 기록한다.

| eventName                           | 발생 시점                                   | properties                  |
| ----------------------------------- | ------------------------------------------- | --------------------------- |
| `App Opened`                        | 앱 시작 후 라우팅 판단 시                   | 없음                        |
| `Onboarding Viewed`                 | 온보딩 첫 진입 또는 단계 변경 시            | `step`                      |
| `Login Completed`                   | 로그인 성공 후 `setUserId`가 가능한 시점    | `is_new_user`               |
| `Group Created`                     | `POST /groups` 성공 후                      | 없음                        |
| `Group Joined`                      | `POST /groups/join` 성공 후                 | `entry_point`               |
| `Invite Share Button Clicked`       | 초대 공유 버튼 클릭                         | `page_name`                 |
| `Goal Time Set`                     | 목표 시간 저장 API 성공 후                  | `mode`                      |
| `Verification Completed`            | 활동 기록 제출 성공 후                      | `goal_achieved`             |
| `Push Notification Setting Updated` | `PATCH /users/me/notifications` 204 성공 후 | `push_notification_enabled` |

## 1차 적용 우선순위

1. 퍼널에 필요한 화면과 버튼부터 적용한다.
2. 그 다음 리텐션 해석에 필요한 상호작용을 적용한다.
3. 마지막으로 설정, 모달, 보조 버튼을 적용한다.

### 우선순위 1: 퍼널

| 퍼널                                       | 필요한 로그                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| 앱 시작 → 인트로 → 그룹 생성 → 공유        | `App Opened`, `Onboarding Viewed`, `Group Created`, `Invite Share Button Clicked` |
| 앱 시작 → 초대코드 참여 → 목표 설정 → 인증 | `App Opened`, `Group Joined`, `Goal Time Set`, `Verification Completed`           |
| 홈 진입 → 목표 설정 → 일일 인증            | `Feed Home Viewed`, `Goal Time Set`, `Verification Completed`                     |

### 우선순위 2: 리텐션 해석

| 행동           | 필요한 로그                                        |
| -------------- | -------------------------------------------------- |
| 친구 초대      | `Invite Share Button Clicked`                      |
| 콕 찌르기      | `{Page Name} Poke Clicked`                         |
| 리액션         | `{Page Name} Reaction Select Clicked`              |
| 댓글           | `Feed Post Detail Comment Submit Clicked`          |
| 알림 항목 클릭 | `Notification List Notification Item Open Clicked` |

### 우선순위 3: 보조 로그

| 행동                      | 필요한 로그                         |
| ------------------------- | ----------------------------------- |
| 프로필/설정 이동          | `{Page Name} {Button Name} Clicked` |
| 닉네임/프로필 이미지 변경 | `{Page Name} {Button Name} Clicked` |
| 그룹 나가기/로그아웃/탈퇴 | `{Page Name} {Button Name} Clicked` |

또한 문서에는 코호트/퍼널 목적에 필요한 최소 property만 넣었다. 서버 id, 초대 코드 원문, 사용자 이름, 댓글/회고 본문은 분석에 직접 필요하지 않으므로 1차 로그에는 넣지 않는다.
