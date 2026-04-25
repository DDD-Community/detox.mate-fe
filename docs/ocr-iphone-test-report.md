# OCR iPhone Test Report

## 목적

`detox.mate-fe`에서 iPhone 실기기 기준으로 `Apple Vision native OCR + TypeScript parser` 구조가 실제로 동작하는지 검증했다.

이번 테스트의 목적은 아래 두 가지였다.

1. iPhone 실기기에서 Apple Vision OCR을 호출할 수 있는가
2. macOS에서 검증한 fixture 기준 결과가 iPhone에서도 동일하게 재현되는가

## 테스트 환경

- 프로젝트: [detox.mate-fe](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe)
- 기기: `iPhone 14`
- iOS: `18.7.3`
- 실행 방식: `Expo development build + iOS native module + Metro`
- 테스트 데이터: [assets/ocr-fixtures](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/assets/ocr-fixtures)
- 결과 파일: [iphone-all-2026-04-25T11-22-46-926Z.json](/Users/euijinkk/Downloads/iphone-all-2026-04-25T11-22-46-926Z.json)

## 구현 구조

이번 테스트는 아래 구조로 진행했다.

`RN 테스트 화면 -> iOS native Apple Vision module -> raw OCR result -> TS parser -> expected 비교 -> JSON 저장`

역할 분리는 다음과 같다.

- native: OCR 실행만 담당
- TS: summary card 판정, 날짜 판정, 사용시간 선택, reject reason 계산
- RN UI: fixture 선택, 실행, 저장, 공유

관련 코드:

- 화면: [App.tsx](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/App.tsx)
- 테스트 로직: [src/features/ocr-test](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/src/features/ocr-test)
- native module: [modules/apple-vision-ocr](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/modules/apple-vision-ocr)

## 진행 과정

### 1. 테스트 하네스 구현

먼저 RN 화면에서 fixture를 선택하고 `Run once`, `Run 5 times`, `Run all`을 수행할 수 있는 테스트 하네스를 구현했다.

구현 범위:

- fixture registry
- expected registry
- TS parser
- runner
- 결과 저장 및 공유
- suite JSON 생성

이 단계에서 로컬 검증은 다음으로 확인했다.

- `vitest` 통과
- `tsc --noEmit` 통과
- iOS simulator build 통과

### 2. Apple Vision native module 연결

Expo local module로 `AppleVisionOcr` 모듈을 추가했다.

이 모듈은 아래만 수행한다.

- 이미지 로드
- `VNRecognizeTextRequest` 실행
- OCR observations 반환
- elapsed time 반환

중요한 점은 제품 규칙을 native에 넣지 않았다는 것이다. 해석 로직은 모두 TS에 남겼다.

### 3. iPhone 연결 및 개발 환경 준비

실기기 테스트를 위해 아래를 순서대로 진행했다.

1. iPhone USB 연결
2. Mac 신뢰 허용
3. 개발자 모드 활성화
4. Xcode signing 설정
5. development build 설치

여기서 여러 번 막힌 지점이 있었다.

#### 막힌 지점 1. 기기 오프라인

초기에는 iPhone이 `Offline` 상태로 잡혀 설치를 진행할 수 없었다.

해결:

- USB 재연결
- 잠금 해제
- Mac 신뢰 허용

#### 막힌 지점 2. Developer Mode 비활성화

기기 상세 정보 확인 결과 `developerModeStatus: disabled` 상태였다.

해결:

- iPhone에서 `개발자 모드` 활성화

#### 막힌 지점 3. 코드 서명 인증서 없음

Expo 설치 단계에서 `No code signing certificates are available to use.` 에러가 발생했다.

해결:

- Xcode에서 Apple ID 로그인
- `Signing & Capabilities`에서 `Automatically manage signing` 활성화

#### 막힌 지점 4. Bundle Identifier 충돌

기존 값 `com.detoxmate.app.dev`가 이미 사용 중이어서 등록이 실패했다.

해결:

- bundle identifier를 고유한 값으로 변경
- 최종 사용값: `com.euijinkim.detoxmatefe.dev`

수정 파일:

- [app.json](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/app.json)
- [ios/detoxmatefe/Info.plist](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/ios/detoxmatefe/Info.plist)
- [ios/detoxmatefe.xcodeproj/project.pbxproj](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/ios/detoxmatefe.xcodeproj/project.pbxproj)

#### 막힌 지점 5. 개발자 앱 신뢰 미완료

앱 설치 후 실행 단계에서 아래 에러가 발생했다.

- profile has not been explicitly trusted by the user

해결:

- iPhone에서 `VPN 및 기기 관리`로 이동
- 개발자 앱 신뢰 수행

#### 막힌 지점 6. 오래된 Kakao 설정 잔존

프로젝트에 과거 Kakao 관련 설정이 남아 있어서 초기 빌드와 dev-client 연결이 불필요하게 복잡해졌다.

해결:

- [ios/detoxmatefe/AppDelegate.swift](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/ios/detoxmatefe/AppDelegate.swift) 에서 stale import 제거
- [ios/detoxmatefe/Info.plist](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/ios/detoxmatefe/Info.plist) 에서 사용하지 않는 Kakao URL scheme 제거
- [app.json](/Users/euijinkk/Desktop/projects/side-project/detox.mate-fe/app.json) 에 `scheme` 명시

### 4. 실기기 실행

설치와 신뢰가 끝난 뒤, iPhone에서 development build를 실행하고 Metro에 수동 연결했다.

실제 실행 순서는 아래와 같았다.

#### 4-1. Mac에서 Metro 실행

프로젝트 루트에서 development build용 Metro 서버를 띄웠다.

```bash
npx expo start --dev-client --port 8082
```

이번 테스트에서 `8082`를 사용한 이유는 기존 `8081` 포트가 이미 다른 세션에서 사용 중이었기 때문이다.

중요한 점:

- Metro는 실기기 테스트가 끝날 때까지 계속 켜져 있어야 한다.
- iPhone과 Mac은 같은 네트워크에 있어야 한다.

#### 4-2. Mac에서 iPhone에 development build 설치

실기기 설치는 아래 명령으로 진행했다.

```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
npx expo run:ios -d "EUIJIN iPhone" --port 8082
```

이번 테스트에서는 CocoaPods UTF-8 문제를 피하기 위해 `LANG`, `LC_ALL`을 함께 지정했다.

#### 4-3. iPhone에서 Metro에 수동 연결

development build를 실행하면 dev client 홈 화면이 먼저 뜬다. 이번에는 자동으로 development server를 찾지 못해서 수동 연결로 진행했다.

연결 방식:

- 앱에서 `Enter URL manually`
- Metro 주소 입력: `http://10.160.120.101:8082`
- `Connect`

이후 `OCR Test Harness` 화면이 정상적으로 열렸고, `Run all`을 수행해 결과 JSON을 저장했다.

즉, 실기기 실행의 전체 흐름은 아래와 같다.

`Mac에서 Metro 실행 -> Mac에서 iPhone으로 development build 설치 -> iPhone에서 Metro URL 수동 입력 -> OCR Test Harness 실행`

## 최종 결과

결과 파일 기준:

- suiteId: `iphone-all-2026-04-25T11-22-46-926Z`
- deviceModel: `iPhone 14`
- iosVersion: `18.7.3`
- runMode: `all`
- totalRuns: `6`
- passedRuns: `6`
- failedRuns: `0`

### fixture별 결과

| fixture | 결과 | 추출값 / 실패 이유 | OCR 시간 |
| --- | --- | --- | --- |
| `legacy_ko` | 성공 | `어제, 4월 22일` / `4시간 2분` | `384ms` |
| `legacy_en` | 성공 | `Yesterday, April 22` / `4h 2m` | `298ms` |
| `ios26_ko` | 성공 | `어제, 4월 22일` / `15시간 2분` | `275ms` |
| `ios26_en_2` | 성공 | `Yesterday, April 22` / `8h 57m` | `208ms` |
| `legacy_en_today` | reject 기대대로 성공 | `date_not_yesterday` | `251ms` |
| `ios26_ko_today` | reject 기대대로 성공 | `summary_date_missing` | `227ms` |

## 해석

이번 결과로 확인된 점은 다음과 같다.

1. iPhone 실기기에서도 Apple Vision OCR이 정상 동작한다.
2. macOS에서 먼저 검증한 fixture 결과가 iPhone에서도 그대로 재현되었다.
3. 성공 케이스뿐 아니라 reject 케이스도 기대대로 판정되었다.
4. 현재 fixture 기준 속도는 대략 `208ms ~ 384ms` 범위로 실사용 가능한 수준이다.

즉, 현재 MVP 기준으로는 다음 조합을 iPhone에서도 커버했다고 볼 수 있다.

- `legacy + ko`
- `legacy + en`
- `liquid-glass + ko`
- `liquid-glass + en`
- reject 2종

## 결과 파일에 대한 평가

현재 저장된 결과 JSON은 디버깅에는 충분하지만 운영용 보고 파일로는 다소 크다.

문제:

- `ocrResult.observations` 전체가 들어 있어 파일 크기가 커진다
- fixture별 핵심 결과만 보려면 지나치게 많은 OCR 원문을 읽어야 한다

이번 파일 크기:

- 약 `80KB`

현재 구조는 아래처럼 되어 있다.

- `suiteId`
- `createdAt`
- `runMode`
- `deviceModel`
- `iosVersion`
- `runs[]`
  - `fixtureId`
  - `runIndex`
  - `imageUri`
  - `ocrResult`
  - `parsedResult`
  - `pass`
  - `mismatchReason`

### 권장 저장 전략

#### 1. 기본 저장용 slim report

항상 저장할 필드:

- `suiteId`
- `createdAt`
- `deviceModel`
- `iosVersion`
- `runMode`
- `summary`
- `fixtureId`
- `runIndex`
- `elapsedMs`
- `parsedResult`
- `pass`
- `mismatchReason`

#### 2. 디버그 저장용 full report

실패하거나 분석이 필요한 경우에만 저장할 필드:

- `ocrResult.observations`
- `imageUri`

즉, 기본은 slim report로 두고, 필요할 때만 full OCR payload를 남기는 방향이 적절하다.

## 한계

아직 남아 있는 한계는 아래와 같다.

1. 테스트 기기가 현재 `iPhone 14` 한 대뿐이다.
2. fixture 수가 아직 작다.
3. `Run 5 times`나 반복 안정성 측정은 이번 결과 파일에 포함되지 않았다.
4. 결과 JSON이 아직 보고용과 디버그용으로 분리되어 있지 않다.
5. Metro 연결은 수동 URL 입력으로 진행했다.

## 다음 단계

다음으로 할 일은 아래 순서가 적절하다.

1. `Run 5 times` 결과를 같은 형식으로 저장
2. slim report 저장 포맷 추가
3. 실패 케이스에서만 raw OCR payload 저장하도록 분기
4. 두 번째 기기에서 같은 fixture 세트 재측정
5. 필요하면 Metro 자동 연결 경험 개선

## 결론

이번 실기기 테스트는 성공했다.

- 앱 설치 가능
- Apple Vision OCR 실행 가능
- TS parser 판정 가능
- fixture 6건 모두 기대 결과와 일치
- 실기기 성능도 수용 가능한 수준

따라서 현재 구조인 `iOS native Apple Vision + TypeScript parser`는 iPhone 환경에서 유효하다고 판단한다.
