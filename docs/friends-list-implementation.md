# 친구 목록 구현·검증 기록

2026-10-01 · 브랜치 `codex/friends-list`

## 구현 범위

- 마이페이지 → 친구 목록 진입, 뒤로 가기와 하단 탐색.
- 내 친구/받은 요청 조회, 이름 검색·초기화·검색 결과 없음.
- 수락 전 과거 기록 공개 안내, 수락/즉시 거절, 친구 삭제 확인·취소.
- 로딩·빈 목록·조회/변경 실패, 중복 변경 방지, 화면 재진입과 오래된 조회 응답 경합 처리.
- 실제 화면은 생성한 API client와 상태 저장소 사용. 개발 검증 화면은 동일한 뷰/저장소에 메모리 API를 주입한다.
- 공유 링크는 사용자 합의에 따라 초대 화면에서 확정한다. 현재 공유 버튼은 준비 안내를 표시한다. 이메일 검색/초대 화면은 다음 범위다.

## 근거

- [친구 정책 v3](https://app.notion.com/p/3d7ad7a38ce580ffb98bee06bd6a6ade)
- [개발 서버 OpenAPI](https://api-dev.detoxmate.co.kr/v3/api-docs): 현재 배포 스키마로 친구 client 생성. 인증된 실제 응답과 양방향 관계 변경은 미검증.
- Figma 파일 `q6FIFifbKNbp9hgYiZPMHw`: 기본 `4530:20381`, 받은 요청 `4506:6667`, 검색 `4530:19507`, 결과 없음 `4659:7448`, 삭제 `4532:20724`. 각 노드의 desktop MCP context/screenshot 확인.
- Figma 제공 SVG 원본 사용. [Pretendard](https://github.com/orioncactus/pretendard) Regular/Medium/Bold 및 OFL 라이선스를 포함하고 친구 화면에 적용.

## 로컬 재현

```sh
NODE_OPTIONS=--dns-result-order=ipv4first EXPO_PUBLIC_DEV_ENTRY='/dev/friends-preview-menu' mise exec -- pnpm start --dev-client --localhost
```

기존 iOS 개발 클라이언트로 연결하면 예시 데이터 메뉴가 열린다. 기본/받은 요청/검색/삭제/빈 목록/40명/조회 및 변경 실패를 선택할 수 있다. `__DEV__`에서만 접근하며 실제 친구 관계를 변경하지 않는다. 일반 앱 진입은 `EXPO_PUBLIC_DEV_ENTRY` 없이 실행한다.

검증 기기: iPhone 16, iOS 18.3 Simulator, 393×852pt, DPR 3. 기존 설치 가능한 개발 빌드를 사용했으며 이번 변경에서 네이티브 재빌드는 하지 않았다. 설치 빌드에도 ExpoImage 55.0.11이 포함되어 SVG 렌더링을 확인했다.

## 확인한 결과

- 자동 테스트 26개 통과: 친구 저장소 12개 포함. ID 구분, 중복 방지, 실패 보존, 오래된 응답 및 화면 focus/blur 경합 검사.
- 타입 검사 통과. 전체 lint 오류 0, 경고 45(기존 코드 및 생성 코드 포함).
- 시뮬레이터에서 받은 요청 수락 안내/취소/수락, 즉시 거절, 삭제 확인/취소/성공/실패를 직접 조작했다.
- 이름 검색 결과/없는 결과/초기화, 키보드 표시, 빈 목록, 최초 조회 오류 및 재시도를 확인했다.
- 독립 검토에서 API/상태 처리 및 UI 코드, 아래 5개 디자인 상태를 검토했다.

## 디자인 비교

로컬 증거: `.local/friends-verification/` (Git 제외). 원본은 `*-native.png`(1179×2556), 비교 이미지는 DPR 3을 1배로 변환했다. `*-comparison/`의 나란히/겹침/차이 이미지와 metrics를 참조한다. 전체 화면 픽셀 동일 판정은 아니다.

| 비교 영역                     | 비교 크기 | 평균 절대 픽셀 차이 (0–255) |
| ----------------------------- | --------- | --------------------------- |
| 기본 친구 목록                | 393×472   | 1.315                       |
| 받은 요청 화면의 내 친구 목록 | 393×262   | 0.504                       |
| 검색 결과 목록                | 393×247   | 0.534                       |
| 검색 결과 없음                | 393×180   | 6.015                       |
| 삭제 시트                     | 361×296   | 1.635                       |

기기 safe area 때문에 본문은 Figma보다 16pt 아래에 배치된다. 삭제 시트는 x16/y520/361×296이다. 실제 iOS 키보드/상태바, 개발 도구 아이콘, 긴 원본 프레임과 고정 화면 높이 차이 때문에 전체 화면 동일성을 평가하지 않았다. 크롭 안에 남은 Figma 설명용 초록 번호는 마스킹하지 않았으므로 차이 수치에 포함된다. 공유 URL 문구는 확정 전이므로 디자인 예시 URL을 사용하지 않았다.

## 남은 검증

- 실제 로그인한 두 계정 간 수락/거절/삭제와 상대 목록 갱신, 실제 기기 검증.
- 40명 데이터 렌더링은 확인했으나 끝까지 스크롤하는 동작은 미검증. 자동화의 drag/scroll이 Simulator 및 개발 메뉴에서 모두 화면을 이동시키지 못했다. 수동 스와이프 확인이 필요하다.
- 공유/초대 URL, 이메일 검색, 딥링크 및 로그인 후 복귀는 다음 화면에서 구현·검증한다.

## Swagger 기반 실제 API 연동 보완 (2026-10-02)

사용자가 지정한 [Swagger UI](https://api-dev.detoxmate.co.kr/swagger-ui/index.html)의 `/v3/api-docs/swagger-config`는 [REST Docs OpenAPI](https://api-dev.detoxmate.co.kr/openapi3.yaml)를 가리킨다. 이를 코드 생성용 `/v3/api-docs`와 대조하여 다음 계약이 동일함을 확인했다.

| 화면 동작      | 실제 API                                    | 성공 응답                          |
| -------------- | ------------------------------------------- | ---------------------------------- |
| 친구 조회      | GET `/friends`                              | FriendResponse 배열                |
| 받은 요청 조회 | GET `/friends/requests/received`            | FriendReceivedRequestResponse 배열 |
| 요청 수락      | POST `/friends/requests/{requestId}/accept` | FriendResponse                     |
| 요청 거절      | DELETE `/friends/requests/{requestId}`      | 204                                |
| 친구 삭제      | DELETE `/friends/{friendshipId}`            | 204                                |

실제 화면은 위 API와 공통 Bearer 인증·401 갱신 흐름을 사용한다. 친구 전용 Orval mutator가 오류를 화면으로 반환하도록 지정했다. 이전에는 GET 네트워크 실패가 공통 토스트 재시도 큐에 대기하여 목록 로딩/변경 후 재조회가 끝나지 않을 수 있었다. 이제 화면 오류 안내와 재시도 버튼으로 처리한다. 생성 파일은 Orval로 재생성한다.

실제 API 화면으로 시작하려면 앞의 예시 실행 명령에서 `EXPO_PUBLIC_DEV_ENTRY='/(group)/friends'`로 바꾼다. MSW 실행도 이 실제 화면 진입점을 사용한다. 로그인 세션이 없거나 만료됐으면 일반 로그인 흐름이 필요하다.

실제 서버 호출 시 iOS 로그에서 `/friends` 및 `/friends/requests/received`의 TLS 신뢰 실패(`NSURLErrorDomain -1200`, `ATS failed system trust`)를 확인했다. 현재 연결에서 제시되는 인증서 발급자는 `Woowa Brothers ROOT CERT`다. macOS의 명세 조회는 성공하지만 Simulator HTTPS는 실패하므로 인증된 실제 데이터 조회 성공으로 기록하지 않는다. 다른 네트워크 또는 적절한 Simulator 인증서 신뢰 설정 후 다시 확인해야 한다. 앱의 TLS 보안 설정은 변경하지 않았다.

## MSW로 서버 동작 재현

사용자 요청에 따라 실제 화면·생성 API client·Axios 인증/오류 처리 경로를 그대로 두고 MSW에서 HTTP 응답을 가로챈다. 이전 `friends-preview`의 뷰 직접 주입 방식과 별개다.

```sh
NODE_OPTIONS=--dns-result-order=ipv4first mise exec -- pnpm start:friends
```

- 가상 친구 8명과 받은 요청 3건: 서로 다른 한국 이름, `example.com` 이메일, 기본/오프라인 프로필 이미지.
- 개발 서버 origin의 목록·요청 조회·수락·거절·친구 삭제 5개 API를 처리한다. 280ms 지연과 Swagger 응답 형태를 사용한다.
- 수락하면 받은 요청에서 제거하고 새로운 friendshipId로 친구에 추가한다. 거절/삭제도 다음 조회에 반영한다. 동일 런타임 내 재진입 시 유지되며 앱 전체 재시작 시 초기화된다.
- 없는 관계 404, 이미 수락한 요청 409를 재현한다. 가상 단일 계정이므로 실제 권한에 따른 401/403 검증은 포함하지 않는다. 공통 인증·401 갱신은 별도 HTTP 경계 테스트로 확인한다.
- `__DEV__`와 `EXPO_PUBLIC_MSW_ENABLED=true`일 때만 시작한다. 일반 실행 시 해당 환경 변수를 제거한다. 생산 환경에서 모킹하지 않는다.
- MSW 2.15.0의 `msw/native`를 사용한다. 최신 안내의 `@msw/react-native`는 확인 시점 npm에서 설치할 수 없었다. Expo 55/RN에 없는 이벤트 전역과 body stream만 개발 모킹 초기화에서 보완한다.

최종 MSW 검증: 전체 43개 테스트(기존 26 + HTTP 경계 7 + MSW 상태 전이 10), 타입 검사, 변경 파일 포맷 통과. 전체 lint 오류 0/기존 경고 45 유지. 독립 코드 검토 완료. Simulator에서 최초 8친구/3요청 → 오유진 수락 후 9친구/2요청 → 임수아 거절 후 9친구/1요청 → 오유진 삭제 후 8친구/1요청을 확인했다. 이름 검색과 초기화도 확인했다. 증거는 `.local/friends-verification/msw-accepted-native.png`, `msw-after-actions-native.png`에 보관한다.

MSW 개발 모드에서 패키지 export fallback 및 React Native 내부 이벤트 구현 참조 관련 경고가 출력될 수 있다. 현재 버전 조합에서 실제 요청/응답 및 위 조작을 확인했으며, RN/MSW 업데이트 시 폴리필 호환성을 재검증해야 한다.
