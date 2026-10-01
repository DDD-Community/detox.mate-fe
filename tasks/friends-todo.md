# 친구 기능 체크리스트

2026-10-01. 상세는 [계획](friends-plan.md), 근거는 [소스](friends-source-context.md). 미체크는 미완료다.

- [x] 정책 v3/관련 신고 정책·FE·공개 OpenAPI/로컬 BE 차이 확인
- [x] 계획 문서 작성(앱 코드/Notion/실제 데이터 변경 없음)
- [x] 독립 reviewer 검토·수정·재검토 결과 기록: [수동 검토 승인](friends-plan.audit.md), Critical 0 / Warning 0
- [x] 사용자 첫 Figma node-id 링크 입력 (친구 목록 5개 상태)
- [x] 0 필요한 계약/client 생성, 전체 diff/gap 확인
- [ ] 1 기본 목록: 받은 요청0/empty/longlist/loading/error, 진입/뒤로
- [ ] 2a 공유: 확정 URL/email, 사전 안내, native message/취소
- [x] 2b 받은 요청: 1+ count, 공개안내, 수락/즉시거절/실패
- [ ] 체크포인트 A: 기본검사·Figma/시뮬레이터·독립리뷰
- [x] 3 삭제: 확인/취소/성공/실패, friendshipId와requestId 구분
- [x] 4a 이름: 내친구만, 요청숨김, 입력갱신/empty/clear
- [ ] 4b email: 전체일치, 최신응답, 5상태/중복409/공통친구·요청화면 과거공개안내
- [x] 체크포인트 B: 요청/삭제/검색 정책·회귀·독립리뷰
- [ ] 5 초대요약: 공개예외만/정확한통계/없는code/요청상태·요청화면 과거공개안내
- [ ] 6a friend/group 링크target 분리·대상저장/소진
- [ ] 6b 로그인복귀·실패/재시작·그룹/일반로그인 회귀
- [ ] 체크포인트 C: 공유/검색/초대 검증·독립리뷰
- [ ] 7a 관계해제 과거경로·댓글보존·비친구참여자 상세차단/BE인가
- [ ] 7b 지정 dev계정2개 양쪽 E2E·설치후초대 보존

## Gate와 증거 기록

- [x] email/공통친구/초대통계/공유email 공개 스키마 배포 확인 (실제 인증 응답 미검증)
- [ ] URL/카피/1명표현/SELF·받은대기/집계 정의 결정
- [ ] 친구 상세/피드계약 확인(기존 그룹계약으로 대체금지)
- [ ] 실제 mutation용 disposable dev계정 지정 전 실행금지
- [ ] 페이지별 Figma URL/node·MCP/screenshot·정책·API 기록
- [ ] 변경파일/실제규모·fixture여부·시뮬레이터 증거 기록
- [ ] typecheck/test/lint/변경fileformat/diff-check 기록
- [ ] 상태전이/경합검증·실API범위·독립리뷰/재검증 기록
- [ ] UI완료/실통합완료/차단/미검증 및 다음동작 구분
- [ ] MVP 제외·기존변경 보존·최종보고 확인

## 친구 목록 구현 결과 (2026-10-01)

목록·이름 검색·받은 요청·삭제 구현, 26개 테스트 및 독립 검토 통과. 시뮬레이터 예시 데이터로 조작 확인. 긴 목록 끝까지 스크롤과 실제 두 계정 API 쓰기는 미검증이므로 기본 목록/실통합 체크는 남겨둔다. 공유 연결은 사용자 합의에 따라 초대 화면에서 확정한다. 상세 증거와 재현 방법: [구현·검증 기록](../docs/friends-list-implementation.md).
