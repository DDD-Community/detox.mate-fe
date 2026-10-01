# 친구 기능 구현 계획

작성일: 2026-10-01 (Asia/Seoul). 초기 계획 기록. 후속 상태: 친구 목록 5개 프레임 구현 및 로컬 검증 진행 중. 공유 연결은 사용자 합의로 초대 화면에서 확정. 인증 API 실행은 미검증.

## 목표와 첫 작업

사용자가 페이지별 Figma 링크를 주면 MCP로 읽고 작은 증분으로 구현한다. **첫 작업은 친구 목록 기본 페이지**: 받은 요청 0, 빈 목록, 긴 목록, loading/error. 같은 페이지의 다른 상태도 다음 링크마다 추가한다. Figma 선택은 사용자가 정한 작업순서 입력이며 별도 승인 절차가 아니다.
페이지 UI 완료와 실 API 연결 완료를 분리한다. 전체 완료에는 친구 전용 상세/피드 인가와 양쪽 계정 검증이 필요하다. 출처는 [소스 컨텍스트](friends-source-context.md), 진행 기록은 [체크리스트](friends-todo.md).

## 정책 v3 핵심

1. 요청+수신자 수락으로 양방향 친구 성립. 링크 접속만으로 친구가 되지 않는다.
2. 수락 전 상세 프로필·피드·통계·히스토리 비공개. 요청 및 수락 화면 모두에서 수락 후 과거 기록까지 양쪽 공개됨을 안내한다.
3. 이름 검색은 내 친구만. 검색 중 받은 요청 숨김, 입력 변경 즉시 결과 갱신.
4. 계정 검색은 정확한 전체 email만. 부분검색/자동완성 제외, 이미 친구는 내 친구 행.
5. 비친구 이메일 카드에 이름·사진·요청 버튼. 공통 친구 없으면 카피 생략, 1/n명 표현은 Figma 대조.
6. 받은 요청 1+일 때 섹션/count. 수락은 양쪽 반영, X는 확인 없이 거절. 내 친구 X는 삭제 확인 시트.
7. NONE/SELF/PENDING_SENT/PENDING_RECEIVED/FRIEND 구분. 중복 요청·역방향 자동 수락 금지. 재진입 시 서버 상태 유지.
8. 친구 삭제 시 양쪽 활동 접근 해제. 기존 댓글/반응 자동삭제 없음. 친구인 게시자의 피드에서는 비친구 참여자 댓글이 보여도 그 참여자 상세 진입 금지. FE 가드는 BE 인가 대체 불가.
9. 사용자당 고정 초대 링크 1개, 만료/재발급 없음, 여러명 사용. 설치/로그인 후 대상 보존. 초대 요약(이름/사진/시작 일수/성공 횟수)과 email카드 공통 친구는 비친구 공개 예외이며 상세 이동 금지.
10. 초대/프로필 공유 동일기능, link+내email+대체 email검색안내 포함. 공유 전 이메일 전달을 확인할 수 있게 안내. 모달 필수 아님. 정책상 MVP 제외는 보낸 요청 목록/취소·코드입력·링크관리·해제 후 댓글 관리 별도 화면이다. 신규 신고·전체 리뉴얼·친구 프로필 새 디자인은 이번 계획 범위에서 제외하고 목표 미달 알림은 별도 정책 미정으로 둔다.

## 현재 계약과 갭

| 확인                                                                     | 영향                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 공개 dev `/friends` 10개 operation과 관계 enum 5개                       | 기본 목록·요청·거절·삭제·검색 가능. 인증된 런타임 미검증                 |
| 후속 dev 스키마에서 email/공통친구/초대통계/공유email 확장 배포 확인     | 목록 이메일 연결 가능. 실제 인증 응답 및 통계 의미는 별도 검증           |
| 친구 userId 기반 상세/피드 API 없음                                      | 기존 groupId/memberId API로 대체 금지. 전체 접근경계 완료는 BE 계약 의존 |
| 초기에는 친구 route/screen/generated client 없음; 후속 첫 화면 구현 진행 | 기존 customAxios+Orval로 필요한 client 생성. 생성파일 수동수정 금지      |
| 기존 invite_code는 그룹 초대                                             | 친구 type/target 분리, 기존 그룹 join 회귀 검증                          |

## 0~7 구현 순서

각 단계의 작은 작업은 3~5개 파일 이내를 목표로 한다. 아래 새 경로는 제안이며 사용자 Figma와 현재 패턴을 읽어 확정한다. 생성 산출물이 많으면 실제 규모를 기록하고 별도 검토한다.

### 0. 읽기 계약 점검과 생성 client

의존: 없음. 필요한 계약을 공개 OpenAPI와 대조하고 새 client를 생성한다.
완료조건: (1) 필요한 operation/필드/상태 일치 (2) 생성파일 수동수정 없음, clean:true 전체 diff 확인 (3) 미배포/미정/미검증 구분.
예상: `orval.config.ts`, `src/api/transformer.ts`(필요 시), generated friend/model. 문서 점검은 1~3파일, 생성 규모 초과 시 설정·산출물 검토 분리.
검증: OpenAPI GET, 타입 검사, 생성 diff 독립 리뷰. **단계0은 전체 UI 착수를 막지 않고 각 데이터 slice의 의존성만 표시한다.**

### 1. 마이페이지 진입·기본 친구 목록

의존: 목록 Figma와 필요한 client. 목록/빈/긴 목록/loading/error를 먼저 구현한다.
완료조건: (1) 확인된 진입·뒤로가기 (2) 실제 목록·식별자와 상태 표시 (3) email 미배포를 보류로 기록하고 시뮬레이터 비교.
예상: `app/(group)/friends.tsx`, `src/screens/group/MyPageScreen.tsx`, `src/screens/friends/FriendsScreen.tsx`, `FriendRow.tsx`, `src/features/friends/useFriends.ts`(경로 모두 제안).
검증: 스크롤/safe area/navigation/조회 실패. 공통 하단 탭은 필요할 때 작은 재사용 추출로 분리하며 전체 탭 개편 제외.

### 2. 공유 + 받은 요청

의존: 단계1, 각 Figma. **공유와 요청은 별도 작은 slice**로 실행한다.
공유 완료조건: (1) 두 진입 동일기능 (2) email 전달 사전 안내와 link+email+대체 안내 message (3) 실제 URL/email 계약 확정 후 native 공유/취소 검증.
공유 예상: 화면, `InviteShareSection.tsx`, `shareFriendInvite.ts`, 동작 검증(3~4파일). URL 미정이면 공유 통합만 보류.
요청 완료조건: (1) 1+ 섹션/count/email (2) 과거 기록 공개 안내 후 명시적 수락·목록 갱신 (3) X 즉시 거절·실패 유지·중복 클릭 방지.
요청 예상: `ReceivedRequestSection.tsx`, 화면, `useFriendRequests.ts`, 동작 검증(3~4파일). 0/1/n·이미 처리됨 경합 확인.
체크포인트 A: 목록·공유·받은 요청의 제공 디자인 비교, 기본 검사, 독립 리뷰. 보류된 공유 데이터와 정상 UI 상태를 분리.

### 3. 친구 삭제 확인

의존: 단계1, 삭제 Figma.
완료조건: (1) 내 친구 X만 확인시트와 접근해제 안내 (2) 취소 유지·성공 닫힘/목록 갱신 (3) 실패를 성공처럼 표시하지 않고 기존 댓글 유지.
예상: `DeleteFriendSheet.tsx`, `FriendRow.tsx`, `useDeleteFriend.ts`, 동작 검증(3~4파일).
검증: friendshipId 삭제와 requestId 거절 구분, 취소/실패/중복탭. 양쪽 접근 해제 실검증은 단계7.

### 4. 이름 검색 → 정확한 email 검색/요청

의존: 단계1, 선택된 검색 Figma. **이름 검색과 email 추가는 별도 slice**.
이름 완료조건: (1) 내 친구만 필터 (2) 검색 중 받은 요청 숨김·최신 입력 결과 (3) 결과없음/비우기/기존 삭제 유지.
이름 예상: 화면, `FriendSearchInput.tsx`, `searchMode.ts`, 동작 검증(3~4파일). 한글/동명이인/빠른 입력/키보드 확인.
email 완료조건: (1) 전체 email만 계정검색·오래된 응답 무시 (2) 5개 상태와 서버 재진입 상태 (3) FRIEND 행·비친구 카드·공통친구 카피, 요청 화면의 과거 기록 공개 안내, 역방향 자동수락 없음.
email 예상: `FriendSearchResultCard.tsx`, 화면, `useFriendEmailSearch.ts`, `relationshipAction.ts`, 동작 검증(4~5파일; 크면 검색/요청 재분할).
검증: 늦은 응답, 없음/실패, SELF/양방향 대기, 중복/409 재조회. 받은 대기는 새 요청 금지 안내+받은 요청에서 수락, 카드에 미제공 수락 버튼 추가 금지.
체크포인트 B: 요청·삭제·검색 정책/회귀, 기본 검사, Figma 비교와 독립 리뷰.

### 5. 링크 초대 확인 요약

의존: 링크 Figma, 공개 응답/통계 정의. URL 연결 없이 카드 slice를 먼저 검토 가능.
완료조건: (1) 공개 예외 요약만, 상세진입 없음 (2) 요청 전후/5개 상태 일관 (3) 없는 code·오류 처리, FE 통계 임의계산 없음.
예상: 초대 route, `FriendInviteScreen.tsx`, `useFriendInvite.ts`, 관계 동작 재사용, 검증(4~5파일).
검증: 유효/없는 code·재진입, 요청 화면의 과거 기록 공개 안내, 시작/성공 집계 의미와 배포 확인, 시뮬레이터 비교.

### 6. 친구 링크·로그인 대상 보존

의존: 단계5, 확정 URL/type 계약. **링크 저장과 인증 복귀를 별도 slice**로 실행.
저장 완료조건: (1) friend/group target 구분 (2) 대상 저장·소진 기준 (3) 잘못된 링크의 그룹 join 오진입 없음.
저장 예상: `src/lib/airbridge.ts`, `pendingFriendInvite.ts`(제안), 필요 시 `pendingInvite.ts`, 검증(3~4파일).
복귀 완료조건: (1) 로그인 뒤 초대확인 복귀 (2) 기존 그룹/일반 로그인 유지 (3) 실패/재시작에도 대상 유지, 자동 요청 없음.
복귀 예상: `SplashScreen.tsx`, `useAuthLogin.ts`, pending 저장, 검증(3~4파일).
검증: 두 종류 링크·앱 실행/종료·로그인 실패/재시작. 설치 후 deferred link는 단계7 실제환경 확인.
체크포인트 C: 공유 message·검색상태·초대 routing·그룹 링크 회귀·독립 리뷰.

### 7. 접근 경계와 실제 종합 검증

의존: 앞선 slice, 친구 전용 BE 인가 계약. 읽기 접근경로 감사 → 경로별 3~5파일 수정으로 분할.
완료조건: (1) 수락 전/해제 후 알림·저장링크·직접 route 접근을 FE/BE 각각 확인 (2) 댓글 보존/비친구 참여자 상세차단 (3) 허용된 dev계정 2개에서 양쪽 상태·전체 검증 기록.
예상: 접근 audit 문서, 확정된 profile/feed/notification 경로별 수정·검증, 결과 문서.
검증: 실제 요청→수락→양쪽 공개→삭제→접근해제, 401/403/404 계약, 설치/로그인 초대 보존. 테스트 계정은 사용자가 별도 지정할 때만 mutation. 이번 계획은 읽기/문서만.
친구 상세 신규디자인/피드 전체 리뉴얼은 제외. BE 인가 미검증을 FE 가드 완료로 대체하지 않는다.

## Figma MCP·검증 루프

사용자 node-id 링크 → `figma:figma-design-to-code` 읽기 → `get_design_context`(`skillNames: "figma-design-to-code"`)+screenshot → screenshot 없으면 `get_screenshot`, sparse하면 보이는 자식의 고품질 context 추가조회 → 기존 token/Button/Icon/AppLogo/Modal·safe area 재사용 → React Native 맞춤 → API/상태전이 → 시뮬레이터 디자인 비교 → 별도 reviewer → 수정/재검증 → 다음 페이지.
전체 스크린샷을 코드에 삽입하거나 미조회 Figma 측정치를 확정하지 않는다. fixture는 UI 개발예시이며 실 서버 사실 아님.
각 slice 후 `mise exec -- pnpm typecheck`, `pnpm test`, `pnpm lint`(모두 mise 환경), 변경파일 Prettier와 `git diff --check`. 단순 스타일 복제 unit test 제외.
네이티브 변경 없으면 Metro/타깃 화면 확인. 새 의존성·네이티브 변경이면 현재 pinned simulator UDID를 재확인해 rebuild. 기존 dev/dev2 차이는 네이티브 재생성 전 확인.
공개 API 필드/URL/디자인 충돌은 해당 slice만 보류하고 가능한 다른 slice를 진행한다. 기존 사용자 변경을 보존한다.
완료보고: Figma URL/node, 변경파일, screenshot/검증근거, 실API 확인범위, 검사·독립review, UI완료/실통합/차단/미검증 구분.

## 현재 미정

초대 URL 식별자/형식·공유카피·이메일 안내 위치, 공통친구 1명 카피, SELF/받은 대기 카피/이동, 통계 집계 정의/배포, 친구 상세/피드 조회·인가 계약. 첨부 `detoxmate/{user_id}`는 placeholder이며 확정 URL이 아니다.
