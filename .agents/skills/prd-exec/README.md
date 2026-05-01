# PRD Executor — PRD 기반 구현 파이프라인

PRD 파일들을 의존성 순서대로 구현하고, PRD마다 브랜치 + PR을 생성하여 유저 리뷰를 거친다.

## 플로우

```
[PRD 파일들 입력]
    |
    v
Phase 0: 초기화
    |  prd*.md 탐색 → 의존성 파싱 → 실행 순서 결정
    |  feature 브랜치 생성: feat/{feature-name}
    |  유저에게 실행 계획 확인
    |
    v
Phase 1: 메인 컨텍스트 선행 작업
    |
    |  Step 1.1: 코드베이스 조사
    |    oh-my-claudecode:explore (sonnet) — 병렬 가능
    |
    |  Step 1.2: 레퍼런스 라우팅 (메인 컨텍스트)
    |    PRD ## Reference 파싱 → Read → 체크리스트 생성
    |
    v
Phase 2: TeamCreate 기반 병렬 실행
    |
    |  Step 2.1: TeamCreate("prd-exec-{feature}")
    |  Step 2.2: TaskCreate per PRD
    |  Step 2.3: 팀원 스폰 (Agent with team_name)
    |    각 팀원: git worktree add .claude/local/worktree/prd{N}
    |    deep-interview(필수) → Skill("ralph") → 구현 + 리뷰 + 검증
    |    유저 질문 필요 시 SendMessage(to="main")으로 프록시
    |    병렬 가능 PRD → 동시 스폰 (run_in_background=true)
    |  Step 2.4: 커밋 + Push + PR (팀원 내부, worktree 유지)
    |  Step 2.5: 유저 리뷰 대기
    |    승인 → 머지 + worktree 제거 + 다음 PRD
    |    수정 → SendMessage로 팀원에 전달
    |  Step 2.6: TeamDelete
    |
    v
Phase 3: 완료
    |  feature 브랜치 결과 보고
    |  → /create-pr 추천 (feature → main)
```

## 에이전트 라우팅

| 단계            | 실행 위치          | 에이전트/도구   | 모델   |
| --------------- | ------------------ | --------------- | ------ |
| 코드베이스 조사 | Agent 서브에이전트 | explore         | sonnet |
| Deep Interview  | TeamCreate 팀원    | deep-interview  | opus   |
| 구현 (ralph)    | TeamCreate 팀원    | ralph           | opus   |
| 셀프 리뷰       | 팀원 내부          | ralph 자동 수행 | opus   |
| 검증            | 팀원 내부          | ralph 자동 수행 | opus   |

## 트리거

- `/prd-exec`, "PRD 실행", "PRD 진행", "구현 시작"
