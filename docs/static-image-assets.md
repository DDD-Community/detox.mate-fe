# Static Image Assets Inventory

Scope: `assets/icons/**` 하위 파일은 제외했습니다. 단, `assets/` 루트에 있는 icon 성격의 파일은 앱 코드나 `app.json`에서 직접 참조하므로 포함했습니다.

## Summary

- 총 37개 이미지 파일을 확인했습니다.
- 코드 또는 `app.json`에서 확인된 사용 중 파일: 33개
- 현재 참조가 확인되지 않은 삭제 후보: 4개
- 앱 설정 파일(`icon`, `adaptive-icon`, `favicon`, `splash-icon`)은 화면 코드에서 직접 참조하지 않아도 빌드/앱 메타데이터에 필요하므로 삭제하면 안 됩니다.

## Delete Candidates

아래 파일은 현재 `app`, `src`, `app.json` 기준 참조가 없습니다.

| Path | Size | Note |
| --- | ---: | --- |
| `assets/onboarding-page-1.png` | 375x812 | 현재 온보딩은 `turtle-hollow.png` 사용 |
| `assets/onboarding-page-2.png` | 375x812 | 현재 온보딩은 `turtle-with-ai.png` 사용 |
| `assets/onboarding-page-3.png` | 375x812 | 현재 온보딩은 `turtle-fire.png` 사용 |
| `assets/onboarding-share-white.png` | 16x16 | 공유 UI는 현재 `onboarding-share-black.png`만 사용 |

삭제 전에는 디자인/기획에서 향후 사용 예정인지 한 번만 확인하면 됩니다.

## Profile Image Candidates

기본 프로필 이미지/S3 정적 URL로 옮길 가능성이 있는 파일은 아래입니다.

| Path | Size | Current use |
| --- | ---: | --- |
| `assets/turtle-hi.png` | 175x231 | 로그인, 마이페이지 기본 이미지, 그룹 정보 기본 아바타, 알림 기본 아바타 |
| `assets/basic-profile-turtle-hi.png` | 48x48 | 피드/캘린더/상세 피드의 작은 기본 아바타 |

현재 `MyPageScreen`의 기본 이미지 선택은 사용자 업로드 이미지를 비우는 동작입니다. 서버가 S3 정적 기본 이미지 URL을 내려주게 할 계획이라면, 기본 이미지 선택 시 서버 계약을 아래 중 하나로 맞추는 것이 좋습니다.

- `profileImageObjectKey: ""`로 업로드 이미지 제거 요청
- 서버가 기본 프로필 URL을 응답의 `profileImageUrl`에 채워줌
- 또는 클라이언트가 S3 정적 URL을 하드코딩해 기본 이미지로 표시

## Full Inventory

| Path | Size | Status | References |
| --- | ---: | --- | --- |
| `assets/adaptive-icon.png` | 1024x1024 | Used | `app.json` android adaptive icon |
| `assets/basic-profile-turtle-hi.png` | 48x48 | Used | `FeedHome`, `CalendarHistoryScreen`, `FeedPostDetail` |
| `assets/daily-calendar.png` | 61x62 | Used | `ActionGuideBanner` |
| `assets/favicon.png` | 48x48 | Used | `app.json` web favicon |
| `assets/icon.png` | 1024x1024 | Used | `app.json` app icon |
| `assets/icon_fl_Camera.png` | 16x16 | Used | `ActionGuideBanner` 인증 버튼 |
| `assets/images/splash.png` | 375x812 | Used | `SplashScreen` |
| `assets/impressions.png` | 20x20 | Used | `FeedCard`, `FeedPostDetail` |
| `assets/logo-apple-login.png` | 16x19 | Used | `LoginScreen` |
| `assets/logo-detoxmate-black.png` | 27x26 | Used | `LoginScreen`, `GoalSetupScreen`, `GroupHomeScreen` |
| `assets/logo-kakao-login.png` | 18x18 | Used | `LoginScreen` |
| `assets/mypage-calender.png` | 61x62 | Used | `MyPageScreen` empty states |
| `assets/onboarding-calendar.png` | 18x20 | Used | `FeedHeader` calendar button |
| `assets/onboarding-check.png` | 80x80 | Used | verify complete/done, group join/create success |
| `assets/onboarding-copy.png` | 16x16 | Used | `GroupInfoScreen`, `GroupJoinScreen`, `GroupCreateScreen` |
| `assets/onboarding-group-invite.png` | 42x29 | Used | `MyPageScreen`, `GroupHomeScreen` |
| `assets/onboarding-group-plus.png` | 30x29 | Used | `MyPageScreen`, `GroupHomeScreen` |
| `assets/onboarding-info.png` | 18x18 | Used | `GroupCreateScreen` |
| `assets/onboarding-none-feed.png` | 87x88 | Used | `NotificationListScreen`, `FeedHome` empty feed |
| `assets/onboarding-page-1.png` | 375x812 | Unused | No reference found |
| `assets/onboarding-page-2.png` | 375x812 | Unused | No reference found |
| `assets/onboarding-page-3.png` | 375x812 | Unused | No reference found |
| `assets/onboarding-rg-bell.png` | 24x24 | Used | `GroupHomeScreen`, `FeedHeader` |
| `assets/onboarding-rg-user.png` | 24x24 | Used | `GroupHomeScreen`, `FeedHeader` |
| `assets/onboarding-share-black.png` | 14x12 | Used | `GroupInfoScreen`, `GroupJoinScreen`, `GroupCreateScreen` |
| `assets/onboarding-share-white.png` | 16x16 | Unused | No reference found |
| `assets/onboarding-star-gray.png` | 12x12 | Used | `OnboardingScreen` |
| `assets/onboarding-star-green.png` | 12x12 | Used | `OnboardingScreen` |
| `assets/onboarding-step-gray.png` | 8x8 | Used | `OnboardingScreen` |
| `assets/onboarding-step-green.png` | 8x8 | Used | `OnboardingScreen` |
| `assets/screen_time_ref.png` | 141x305 | Used | `VerifyHowToScreen` |
| `assets/splash-icon.png` | 1024x1024 | Used | `app.json` splash image |
| `assets/turtle-fall.png` | 236x218 | Used | `GroupHomeScreen` empty group |
| `assets/turtle-fire.png` | 216x264 | Used | `OnboardingScreen` |
| `assets/turtle-hi.png` | 175x231 | Used | `LoginScreen`, `MyPageScreen`, `GroupInfoScreen`, `NotificationListScreen` |
| `assets/turtle-hollow.png` | 218x247 | Used | `OnboardingScreen` |
| `assets/turtle-with-ai.png` | 288x251 | Used | `OnboardingScreen` |
| `assets/warning.png` | 64x58 | Used | `ActionGuideBanner` |

## Notes

- 이 문서는 정적 문자열 기반 참조를 기준으로 작성했습니다.
- `assets/icons/**`는 범위에서 제외했습니다.
- 삭제 후보를 실제로 제거할 때는 `pnpm exec tsc --noEmit`과 앱 실행 smoke test를 같이 돌리는 것이 좋습니다.
