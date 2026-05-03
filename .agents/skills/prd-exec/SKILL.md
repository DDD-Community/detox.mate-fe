---
name: prd-exec
description: |
  PRD 기반 실행 파이프라인 (브랜치 + Deep Interview + 구현 + PR).
  Trigger: "/prd-exec", "PRD 실행", "PRD 진행", "구현 시작"
  - feature 브랜치 생성 + draft PR
  - PRD별 deep-interview → 구현 → 셀프 리뷰 → PR → 유저 리뷰
  - 의존성 순서 준수, 병렬 가능 PRD 동시 실행
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Agent, Skill
model: opus
version: 3.0.0
---

# PRD Executor v3 (TeamCreate + Ralph)

PRD 파일들을 받아 의존성 순서대로 구현하고, PRD마다 브랜치 + PR을 생성하여 유저 리뷰를 거친다.

## Input

- PRD 파일 경로 또는 디렉토리 (기본: `.omc/specs/{feature}`)
- 유저가 직접 PRD 경로를 지정하거나, `/prd-gen`이 생성한 파일들을 자동 탐색

## 에이전트 라우팅 테이블

| 단계            | 실행 위치           | 도구/에이전트                         | 모델   | 비고                       |
| --------------- | ------------------- | ------------------------------------- | ------ | -------------------------- |
| 코드베이스 조사 | Agent 서브에이전트  | `oh-my-Codex:explore`                 | sonnet | PRD별 사전 조사            |
| Deep Interview  | **TeamCreate 팀원** | `Skill("oh-my-Codex:deep-interview")` | opus   | 유저 질문 시 메인 프록시   |
| 레퍼런스 라우팅 | **메인 컨텍스트**   | Read                                  | opus   | 레퍼런스 읽기 + 체크리스트 |
| 구현 (ralph)    | **TeamCreate 팀원** | `Skill("oh-my-Codex:ralph")`          | opus   | 팀원이 ralph 직접 호출     |
| 셀프 리뷰       | 팀원 내부           | ralph가 자동 수행                     | opus   | ralph 워크플로우에 포함    |
| 검증            | 팀원 내부           | ralph가 자동 수행                     | opus   | ralph 워크플로우에 포함    |

## 유저 질문 프록시 패턴

팀원은 AskUserQuestion을 직접 호출할 수 없으므로, 유저 소통이 필요할 때 메인 오케스트레이터를 프록시로 사용한다.

```
팀원 (deep-interview 실행 중)
  → SendMessage(to="main") "유저에게 질문: {질문 내용}"
    → 메인 오케스트레이터: AskUserQuestion({질문 내용})
    → 유저 답변 수신
  → SendMessage(to="prd{N}-worker") "유저 답변: {답변}"
팀원 (deep-interview 계속)
```

병렬 팀원 여럿이 동시에 질문 시: 메인이 수신 순서대로 처리.

## 실행 정책 (CRITICAL)

> **BLOCKING REQUIREMENT**: 각 단계에서 지정된 도구 호출은
> 반드시 해당 도구를 통해 실행해야 한다.

### 금지 행위

- ❌ Deep Interview 질문을 직접 생성하지 않는다 → `Skill("oh-my-Codex:deep-interview")` 호출
- ❌ 메인 컨텍스트에서 직접 코드를 작성하지 않는다 → TeamCreate 팀원에 위임
- ❌ 코드 리뷰를 직접 수행하지 않는다 → 팀원의 ralph가 자동 수행

### 기타 정책

- Deep Interview + 구현 모두 TeamCreate 팀원에 위임
- Deep Interview는 필수 — 각 팀원이 자신의 PRD에 대해 deep-interview 수행 후 ralph 진행
- 병렬 팀원들이 각자의 PRD를 대상으로 동시에 deep-interview 실행
- 팀원이 유저 질문 필요 시 SendMessage로 메인에 프록시 요청
- PRD가 1개여도 팀원 위임 정책 유지

## Workflow

### Phase 0: 초기화

1. **PRD 파일 탐색**: `.omc/specs/{feature}` 에서 `prd*.md` 파일 검색
2. **의존성 파싱**: 각 PRD의 `## Metadata` → Dependencies 확인
3. **실행 순서 결정**: 의존성 기반 토폴로지 정렬, 병렬 가능 그룹 식별
4. **feature 브랜치 확인/생성**:
   - 이미 feature 브랜치에 있으면 그대로 사용
   - 없으면 생성:
   ```bash
   git fetch origin main
   git checkout -b feat/{feature-name} origin/main
   ```
5. **유저에게 실행 계획 확인**:
   ```
   PRD 실행 계획:
   [순차] PRD 1: {제목}
   [병렬] PRD 2, 3: {제목} (동시 실행)
   [순차] PRD 4: {제목} (PRD 2,3 완료 후)
   ...
   feature 브랜치: feat/{name}
   진행할까요?
   ```

### Phase 1: 메인 컨텍스트 선행 작업

병렬 팀원을 스폰하기 **전에**, 메인 컨텍스트에서만 가능한 작업을 모두 완료한다.

#### Step 1.1: 코드베이스 조사 (병렬 가능)

- 각 PRD에 대해 `Agent(subagent_type="oh-my-Codex:explore", model="sonnet")`로 사전 조사
- 병렬 가능한 PRD들의 조사를 동시에 실행
- 결과를 이후 단계에서 활용

#### Step 1.2: 레퍼런스 라우팅 (메인 컨텍스트)

PRD의 `## Reference` 섹션에 명시된 레퍼런스 파일을 파싱하여 읽는다.

1. PRD `## Reference` 테이블에서 레퍼런스 경로 추출
2. 각 레퍼런스 파일을 Read
3. 체크리스트 생성 (코드 작성 시 적용할 항목)
4. 체크리스트를 팀원 프롬프트에 주입

> **역할 분리**: 레퍼런스 결정은 prd-gen의 책임. prd-exec는 PRD에 명시된 레퍼런스만 읽고 적용한다.

**응답 시작에 라우팅 결과 출력 (필수)**:

```
레퍼런스 라우팅:
- #1 TBD → Read 완료, 체크리스트 생성
- #3 TBD → Read 완료, 체크리스트 생성
```

### Phase 2: TeamCreate 기반 병렬 실행

Phase 1 완료 후, TeamCreate로 팀을 구성하고 각 PRD를 팀원에게 위임한다.

#### Step 2.1: 팀 생성

```
TeamCreate(name="prd-exec-{feature}", description="PRD 구현 팀")
```

#### Step 2.2: 태스크 생성

각 PRD에 대해 태스크 생성:

```
TaskCreate(
  team_name="prd-exec-{feature}",
  title="PRD {N}: {제목}",
  description="PRD {N} 구현 + PR 생성"
)
```

#### Step 2.3: 팀원 스폰 (병렬)

병렬 가능한 PRD들은 **동시에** 팀원을 스폰한다.

> **⚠️ worktree 격리 주의사항**
>
> `team_name`과 `isolation: "worktree"`는 **비호환**이다.
> `team_name`을 지정하면 팀원 모드로 전환되면서 `isolation: "worktree"`가 무시된다.
> 따라서 팀원이 **직접 `git worktree add`로 독립 작업 공간을 생성**해야 한다.

````
Agent(
  team_name="prd-exec-{feature}",
  name="prd{N}-worker",
  model="opus",
  mode="auto",
  run_in_background=true,  // 병렬 실행 시
  prompt="""
## Task: PRD {N} 구현

당신은 TeamCreate 팀원으로, Skill 호출이 가능합니다.
유저에게 질문이 필요하면 SendMessage(to="main")으로 메인에 프록시 요청하세요.

## 실행 순서

### 1. 독립 worktree 생성 (필수 — 병렬 작업 격리)

> **CRITICAL**: 메인 repo에서 직접 작업하면 다른 팀원과 충돌한다.
> 반드시 독립 worktree를 생성하고 그 안에서 작업할 것.

```bash
# feature 브랜치 기준으로 worktree 생성 (프로젝트 내부 경로)
WORKTREE_DIR=".Codex/local/worktree/prd{N}"
mkdir -p "$(dirname "$WORKTREE_DIR")"
git worktree add "$WORKTREE_DIR" -b {branch-name} {feature-branch}
cd "$WORKTREE_DIR"
````

이후 모든 작업(파일 읽기/쓰기, git 명령 등)은 `$WORKTREE_DIR` 내에서 수행한다.

> `.Codex/local/`은 `.gitignore`에 포함되어 있으므로 추적되지 않는다.

### 2. Deep Interview (필수)

PRD의 구현 세부사항을 deep-interview로 명확화합니다.
유저 질문이 필요하면 SendMessage(to="main")으로 메인에 프록시 요청합니다.

```
Skill("oh-my-Codex:deep-interview") 호출 with args:
"다음 PRD의 구현 세부사항을 명확화해주세요.

## PRD
[PRD 전체 내용]

유저 질문이 필요하면 SendMessage(to="main")으로 프록시 요청하세요."
```

### 3. ralph로 구현

```
Skill("oh-my-Codex:ralph") 호출 with args:
"다음 PRD를 구현해주세요.

## PRD
[PRD 전체 내용 — deep-interview 결과 반영본]

## 레퍼런스 체크리스트
[메인에서 Read한 레퍼런스 내용 — 경로만 전달 금지, 내용 직접 포함]

## 코드베이스 컨텍스트
[explore 에이전트 조사 결과]

## Acceptance Criteria
[PRD에서 추출한 AC 목록]

## 작업 디렉토리
모든 파일 경로는 $WORKTREE_DIR 기준으로 작업할 것.

구현 완료 후:
- tsc, lint 검증
- 검증 실패 시 수정 (최대 3회)
"
```

### 4. 커밋 + Push + PR

ralph 완료 후 (worktree 내에서):

- git add + git commit (conventional commit 형식)
- git push -u origin {branch-name}
- gh pr create --base {feature-branch} --title "..." --body "..."
- PR 설명에 포함: Summary, 레퍼런스 체크리스트 결과, Test plan

### 5. 태스크 완료 보고 (worktree 제거하지 않음)

> **CRITICAL**: worktree는 자동 제거하지 않는다.
> 유저가 PR 리뷰 후 승인하면, 메인 오케스트레이터가 유저 확인을 받고 제거한다.

```bash
cd {원래-repo-경로}
# worktree 제거하지 않음 — 유저 승인 후 메인에서 처리
```

TaskUpdate(task_id="{task-id}", status="completed", result="PR URL: ... | worktree: $WORKTREE_DIR")
""")

```

**프롬프트 주입 체크리스트:**

- [ ] PRD 전체 내용을 프롬프트에 포함했는가
- [ ] 레퍼런스 파일 **내용**을 프롬프트에 직접 포함했는가 (경로만 전달 금지)
- [ ] 코드베이스 조사 결과를 포함했는가
- [ ] Acceptance Criteria를 명시했는가
- [ ] 브랜치 이름과 base 브랜치를 명시했는가
- [ ] task_id를 명시했는가

#### Step 2.4: 완료 대기 + 유저 리뷰

팀원들의 완료 알림을 받은 후:

```

PRD 구현 완료!

PR 목록:

- PRD 1: {PR URL}
- PRD 2: {PR URL}

리뷰 부탁드립니다!

- 승인 후 "머지해" 또는 "다음" 이라고 말씀해주세요
- 수정 필요하면 피드백을 주세요

````

**AskUserQuestion**으로 유저 응답 대기:

- "머지" / "다음" → feature 브랜치에 머지, worktree 제거, 다음 의존 PRD 그룹 진행
- 수정 피드백 → SendMessage로 해당 팀원에게 수정 지시
- "스킵" → 해당 PRD 건너뛰기

**머지 승인 시 worktree 정리**:
```bash
# 유저가 머지를 승인한 PRD의 worktree만 제거
git worktree remove .Codex/local/worktree/prd{N} --force
````

#### Step 2.5: 팀 정리

모든 PRD 완료 후:

```
TeamDelete(team_name="prd-exec-{feature}")
```

### Phase 3: 완료

모든 PRD 머지 완료 시:

```
모든 PRD 완료!

feature 브랜치: feat/{feature-name}
머지된 PRD: {N}개
PR 목록:
- #1234: PRD 1 - {제목}
- #1235: PRD 2 - {제목}
...

다음 단계:
- feat/{feature-name} → main PR 생성이 필요하면 "/pr" 사용
```

## Draft PR (feature 브랜치)

Phase 0에서 feature 브랜치에 첫 PRD가 머지되면 draft PR 생성:

```markdown
## Summary

- {전체 기능 설명}

## PRD 진행 상황

- [x] PRD 1: {제목}
- [ ] PRD 2: {제목}
      ...
```

PRD 머지 시마다 PR 설명 업데이트.

## Error Handling

- **타입 에러**: ralph가 자동 수정 시도 (최대 3회), 실패 시 유저에게 보고
- **lint 에러**: pre-commit hook이 자동 수정, 실패 시 수동 수정
- **머지 충돌**: 유저에게 보고 + 해결 방안 제안
- **deep-interview 실패**: 팀원이 에러 내용을 TaskUpdate로 보고, 메인이 유저에게 전달
- **팀원 실패**: SendMessage로 상태 확인 후 재시도 또는 유저에게 보고
- **ralph 실패**: 팀원이 에러 내용을 TaskUpdate로 보고, 메인이 유저에게 전달
