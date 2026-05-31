# Static Image Assets Inventory

Scope: `assets/` 아래 정적 이미지 파일을 앱 코드와 Expo 설정 기준으로 확인했습니다.

## Summary

- 총 39개 이미지 파일을 확인했습니다.
- 코드 또는 Expo 설정에서 확인된 사용 중 파일: 39개
- 현재 참조가 확인되지 않은 삭제 후보: 0개
- 앱 설정 파일(`icon`, `adaptive-icon`, `favicon`, `splash_logo`)은 화면 코드에서 직접 참조하지 않아도 빌드/앱 메타데이터에 필요합니다.

## Delete Candidates

현재 삭제 후보는 없습니다.

## Full Inventory

| Path                                 | Status | References                                  |
| ------------------------------------ | ------ | ------------------------------------------- |
| `assets/adaptive-icon.png`           | Used   | `app.config.ts` android adaptive icon       |
| `assets/basic-profile-turtle-hi.png` | Used   | feed, calendar, notification default avatar |
| `assets/favicon.png`                 | Used   | `app.config.ts` web favicon                 |
| `assets/feed_bar_chart.png`          | Used   | `ActionGuideBanner`                         |
| `assets/feed_daily_calender.png`     | Used   | `ActionGuideBanner`                         |
| `assets/feed_emotion.png`            | Used   | feed detail, my page                        |
| `assets/feed_warning.png`            | Used   | `ActionGuideBanner`                         |
| `assets/icon.png`                    | Used   | `app.config.ts` app icon                    |
| `assets/icon_fl_Camera.png`          | Used   | `ActionGuideBanner`                         |
| `assets/logo-apple-login.png`        | Used   | login                                       |
| `assets/logo-black.png`              | Used   | `AppLogo`                                   |
| `assets/logo-kakao-login.png`        | Used   | login                                       |
| `assets/logo-kr.png`                 | Used   | `AppLogo`                                   |
| `assets/mypage-calender.png`         | Used   | my page                                     |
| `assets/onboarding-check.png`        | Used   | verify/group completion screens             |
| `assets/onboarding-group-invite.png` | Used   | my page, group home                         |
| `assets/onboarding-group-plus.png`   | Used   | my page, group home                         |
| `assets/onboarding-info.png`         | Used   | group create                                |
| `assets/onboarding-none-feed.png`    | Used   | notification, empty feed                    |
| `assets/onboarding-rg-bell.png`      | Used   | group home                                  |
| `assets/onboarding-rg-user.png`      | Used   | group home                                  |
| `assets/onboarding-star-gray.png`    | Used   | onboarding                                  |
| `assets/onboarding-star-green.png`   | Used   | onboarding                                  |
| `assets/onboarding-step-gray.png`    | Used   | onboarding                                  |
| `assets/onboarding-step-green.png`   | Used   | onboarding                                  |
| `assets/pock.png`                    | Used   | feed, feed detail, my page                  |
| `assets/reaction-clap.png`           | Used   | `ReactionPicker`                            |
| `assets/reaction-fire.png`           | Used   | `ReactionPicker`                            |
| `assets/reaction-hammer.png`         | Used   | `ReactionPicker`                            |
| `assets/reaction-heart.png`          | Used   | `ReactionPicker`                            |
| `assets/reaction-strength.png`       | Used   | `ReactionPicker`                            |
| `assets/reaction-surprised.png`      | Used   | `ReactionPicker`                            |
| `assets/screen_time_ref.png`         | Used   | verify guide                                |
| `assets/splash_logo.png`             | Used   | `app.config.ts` splash                      |
| `assets/turtle-fall.png`             | Used   | group home empty state                      |
| `assets/turtle-fire.png`             | Used   | onboarding                                  |
| `assets/turtle-hi.png`               | Used   | login, my page, group, notification         |
| `assets/turtle-hollow.png`           | Used   | onboarding                                  |
| `assets/turtle-with-ai.png`          | Used   | onboarding                                  |

## Notes

- 이 문서는 정적 문자열 기반 참조를 기준으로 작성했습니다.
- 정적 분석으로 잡히지 않는 동적 asset 로딩이 생기면 이 문서도 같이 갱신해야 합니다.
