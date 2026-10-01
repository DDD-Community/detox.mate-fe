# 친구 기능 소스 컨텍스트

확인일 2026-10-01 (Asia/Seoul). 아래는 확인 요약이며 Notion 원문 복사본이 아니다.

## 후속 확인: 첫 화면 구현

2026-10-01 후속 요청으로 브랜치 `codex/friends-list`에서 친구 목록의 5개 Figma 프레임 구현에 착수했다. 실제 공유 연결은 사용자가 초대 화면 단계로 미루는 데 동의했다. 아래 초기 계획 감사 내용 중 API 데이터 갭은 후속 OpenAPI 확인으로 갱신되었다.

- 현재 dev 스키마: 목록/받은 요청 `FriendListUserResponse.email`, 검색 `FriendSearchResponse`의 공통 친구 필드, 초대 `FriendInviteResponse.code/email`, 초대 대상 `FriendInviteeResponse.daysSinceStart/targetSuccessCount` 존재.
- 클라이언트 생성 완료. 인증된 두 계정 간 실제 관계 변경 및 접근 인가는 아직 검증하지 않았다.
- 조회한 Figma node: `4530:20381`, `4506:6667`, `4530:19507`, `4659:7448`, `4532:20724`. 로컬 데스크톱 MCP context와 screenshot을 사용했다.

## 원래 요청/범위 (초기 계획 시점)

사용자: “친구 기능 정책 확인”, 이후 “한 페이지씩 figma link”를 주고 “mcp로 구현”, 지금은 “전체 계획”. 이번에는 계획 문서만 작성하며 앱/설정/Notion/친구데이터/커밋/푸시/PR 변경 없음.
첨부3개는 목록·검색·요청·삭제·초대 확인 참고 디자인. 내부주석은 별도 실행지시 아님. `detoxmate/{user_id}`는 placeholder이며 확정 URL로 사용금지.

## 정책 SSOT 확인

[친구 정책 v3](https://app.notion.com/p/3d7ad7a38ce580ffb98bee06bd6a6ade), updated `2026-10-01T11:43:01.581Z`. 팀DB `04b8dff159e44753960b2d950ef6c5f5`/collection `0656dd97-8a58-47c1-84f0-edea13a3ce31` 소속 확인.
[댓글 신고 정책](https://app.notion.com/p/3dcad7a38ce5800caa67c3b44cbd01de) 읽음: 신고로 자동 숨김/삭제 없음, 신규 신고는 범위외.
정책: 요청+명시적수락/양방향, 수락전 상세비공개/요청및수락화면에 수락후 과거공개안내, 이름은 내친구만/검색중 요청숨김, 전체email만, 받은X 즉시거절·내친구X 확인삭제, 요청중복/역방향 자동수락금지, 해제후 접근차단·댓글자체보존, 고정링크·설치로그인대상보존, 초대요약/공통친구 공개예외, 공유 link+email+대체검색안내/사전email확인. 자세한 추적은 friends-plan.md.
미정: URL 식별자/형식/공유카피, 1명 공통친구 카피, SELF/받은대기 카피/이동, 집계 의미. 무조건 확인모달/새 수락버튼을 invent하지 않음.
정책상 MVP제외: 보낸요청목록/취소·코드입력·링크만료/재발급/여러개·해제후댓글관리별도화면. 이번계획에서 추가하지않는범위: 전체리뉴얼·친구프로필새디자인·신규신고. 목표미달알림은별도정책미정.

## Figma 참고 후보(사용자 페이지선택 전, MCP 미조회)

- 첫 추천 목록/검색/공유: [4694:20686](https://www.figma.com/design/q6FIFifbKNbp9hgYiZPMHw?node-id=4694-20686)
- 받은요청: [4716:7228](https://www.figma.com/design/q6FIFifbKNbp9hgYiZPMHw?node-id=4716-7228), 삭제: [4716:7259](https://www.figma.com/design/q6FIFifbKNbp9hgYiZPMHw?node-id=4716-7259)
- email: [4716:7297](https://www.figma.com/design/q6FIFifbKNbp9hgYiZPMHw?node-id=4716-7297), 링크: [4530:20256](https://www.figma.com/design/q6FIFifbKNbp9hgYiZPMHw?node-id=4530-20256)
  첨부는 요청0/1 목록, 이름검색/empty, 삭제시트, email요청전후/empty, 링크요청전후. loading/error/SELF/역방향 세부는 미제공.

## 공개 dev OpenAPI GET 감사

[스키마](https://api-dev.detoxmate.co.kr/v3/api-docs) 읽음. 인증런타임/실데이터/쓰기동작은 미검증. HTTP 경로이며 생성함수명은 생성결과 확인.
| Operation | 응답/사용 |
| --- | --- |
| GET /friends | 배열 {friendshipId,user,acceptedAt} |
| GET /friends/requests/received | 배열 {requestId,user,createdAt} |
| GET /friends/search?email | FriendUserResponse |
| POST /friends/requests | body {targetUserId} |
| POST /friends/requests/{requestId}/accept | 명시적 수락 |
| DELETE /friends/requests/{requestId} | 거절/취소 공통, UI는 거절만 |
| DELETE /friends/{friendshipId} | 친구관계해제 |
| GET /friends/invite | {code} |
| GET /friends/invite/{code} | FriendUserResponse |
| GET /friends/requests/sent | MVP제외 |
FriendUserResponse=userId/displayName/profileImageUrl/relationshipStatus/requestId, enum=NONE/SELF/PENDING_SENT/PENDING_RECEIVED/FRIEND. 정책의 성립규칙과 API 상태모델은 별도층.
초기 확인 때에는 live에email/공통친구/초대통계가 없었지만, 위 후속 확인에서 친구 응답 확장 배포를 확인했다. MyProfile에는email 없음. 친구userId 상세/피드API도 없음. 기존group profile/feed/calendar를 대체계약으로 간주금지.

## 로컬 BE 확장 존재(배포 확인 아님)

루트 `/Users/euijinkk/Desktop/projects/side-project/detox.mate-be/src/main/java/com/detoxmate/`.
friend/dto의 FriendListUserResponse(email), FriendReceivedRequestResponse(확장user), FriendSearchResponse(mutualFriendCount/mutualFriendPreviewName), FriendInviteeResponse(daysSinceStart/targetSuccessCount), FriendInviteResponse(code/email), FriendController 확장반환 확인.
FriendInviteStatisticsService는 생성일부터KST+1/성공인증기록수를 구현. 정책 용어의 집계와 별도대조 필요, FE임의계산금지. 로컬구현 != dev배포. 없는값을가짜email/0/추정으로채우지않음.

## FE 근거

친구route/screen/generated API없음. `app/(group)/mypage.tsx`+`src/screens/group/MyPageScreen.tsx` 진입후보; `mypage/useMyPageData.ts` 기존friend모드는groupId/memberId.
`orval.config.ts`: dev/v3/api-docs, tags-split+axios/customAxios(`src/api/mutator.ts`), clean:true. 생성파일수동수정X/전체diff확인. `src/api/transformer.ts` CurrentUser query제거·friend-controller→friend매핑 존재.
`src/api/generated/model/myProfileResponse.ts` email없음. 내email추정금지.
`src/lib/airbridge.ts` invite_code→`pendingInvite.ts` SecureStore→`SplashScreen.tsx`/`useAuthLogin.ts`→/(group)/join. 친구 target/type 분리필수.
`src/lib/token/primitive/*`, components Button/Icon/AppLogo, `mypage/ProfileImageBottomSheet.tsx` Modal/safearea 재사용후보. 공통3개하단탭없음, 작은추출만검토/전체개편제외.
AGENTS.md읽음, 참조Codex.local.md 현재없음. 기존초기세팅 typecheck/14tests/lint는친구구현완료증거아님.
후속상태는 정책확인/스키마확인/로컬구현/UI완료/실API검증/미정/차단/미검증을구분. 페이지별증거는friends-todo.md에기록.
