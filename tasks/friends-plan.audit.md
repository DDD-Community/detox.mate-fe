# 친구 기능 계획 독립 검토

검토일: 2026-10-01 (Asia/Seoul). 대상: 최종 `friends-plan.md`, `friends-todo.md`, `friends-source-context.md`. 작성자와 다른 reviewer가 원래 사용자 요청·현재 정책·실제 코드를 대조했다.

**판정: 계획 수동 검토 승인. Critical 0 / Warning 0.** 앱 구현이나 실 API 동작을 승인한 판정은 아니다.

자동 validator `validate-implementation-plan`은 현재 skill/plugin catalog에서 찾을 수 없어 미실행(unavailable)이다. 자동 PASS를 주장하지 않으며 아래는 독립 reviewer의 수동 평가다.

## 독립 확인한 근거

- [친구 정책 v3](https://app.notion.com/p/3d7ad7a38ce580ffb98bee06bd6a6ade)를 직접 Notion fetch했다. 팀 정책 data source 소속과 본문 §1~9, 미정·MVP 제외 사항을 확인했다.
- [dev OpenAPI](https://api-dev.detoxmate.co.kr/v3/api-docs)를 직접 GET했다. 친구 operation 10개와 관계 enum 5개, email·공통 친구·초대 통계 필드 부재를 확인했다. 인증 요청이나 친구 mutation은 실행하지 않았다.
- FE `useMyPageParams.ts`/`useMyPageData.ts`의 groupId/memberId 경로, `airbridge.ts`/`pendingInvite.ts`의 기존 그룹 invite_code 처리, `orval.config.ts`/`src/api/index.ts`를 직접 읽었다.
- 로컬 BE의 `FriendUserResponse`, `FriendListUserResponse`, `FriendSearchResponse`, `FriendInviteeResponse`를 직접 읽고 공개 dev 스키마와 구별했다.
- Figma design-to-code SKILL.md 및 실제 MCP metadata를 대조했다. skillNames 문자열, screenshot 및 fallback, sparse context 보완 절차가 최종 계획에 반영됐다. 이번 검토에서는 Figma 화면을 조회하거나 구현하지 않았다.

## 정책 추적과 작업 규모

| 정책 근거                                 | 계획 단계 / 검토 결과                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| §2 이름 검색·전체 이메일·공통 친구        | 4a/4b: 내 친구 필터와 계정 검색 구분, 최신 응답·FRIEND 결과 처리 포함                            |
| §3 명시적 수락·받은 X 즉시 거절·중복 금지 | 2b/4b/5: 5개 상태, 역방향 자동 수락 금지, requestId와 friendshipId 구분 포함                     |
| §3 과거 기록 공개 안내                    | 2b/4b/5: 수락 및 이메일·링크 요청 화면 모두 안내 포함                                            |
| §4~6 공개 예외·관계 해제·댓글 보존        | 3/5/7: 요약만 공개, 이전 알림·저장 링크 제한, 비친구 참여자 상세 차단·BE 인가 포함               |
| §2~3 고정 초대 링크·공유·설치/로그인      | 2a/5/6/7: 이메일 사전 안내, 동일 공유, 대상 보존·그룹 초대 회귀 포함                             |
| 미정·MVP 제외                             | 정책 제외·이번 작업 제외·별도 미정 구분, URL placeholder와 미배포 값을 확정 사실로 사용하지 않음 |

공유/받은 요청, 이름/email 검색, 링크 저장/인증 복귀를 별도 작은 작업으로 나눴다. 코드 후보는 제안으로 표시하며 생성 diff·접근 경로 감사는 규모에 따라 분리한다. 페이지마다 MCP → 구현 → 시뮬레이터 비교 → 독립 검토 → 수정/재검증 순서가 있다. 과한 신규 테스트나 전체 리뉴얼을 요구하지 않는다.

## 첫 페이지 준비와 잔여 조건

**착수 준비됨:** 사용자 첫 node-id Figma 링크가 오면 기본 친구 목록 UI(받은 요청 0·빈/긴 목록·loading/error)와 필요한 공개 client 작업을 시작할 수 있다. 페이지 선택은 작업순서 입력이며 추가 승인 절차가 아니다.

**실 통합 보류:** 목록/받은 요청 email·공통 친구·초대 통계·공유 email 배포, 공유 URL/문구, 통계 의미, 친구 전용 상세/피드 인가 계약이 필요한 해당 작업만 보류한다. 첫 페이지 UI 전체를 이 조건 때문에 막지 않는다. 실제 양방향 mutation 검증은 지정 dev 계정이 필요하다.

검토 중 발견한 이메일 요청의 공개 안내 누락과 skillNames 타입 표기는 수정된 최종본에서 재확인했다. 남은 정책 누락이나 잘못된 의존성은 발견하지 못했다. 기존 로컬 세팅의 시뮬레이터 구동·테스트 통과는 친구 기능 구현 또는 실제 연동 완료 증거가 아니다.
