---
name: prd-gen
description: |
  Deep Interview 기반 최소 단위 PRD 생성.
  Trigger: "/prd-gen", "PRD 생성", "PRD 만들어", "기획 정리"
  - /deep-interview로 요구사항 명확화
  - 최소 단위 PRD 분리 + 의존성 그래프
  - .omc/specs/ 에 PRD 파일 저장
allowed-tools: Read, Write, Glob, Grep, Bash, AskUserQuestion, Agent, Skill, mcp__figma-remote-mcp__get_design_context, mcp__figma-remote-mcp__get_screenshot
model: opus
version: 1.1.0
---

# PRD Generator (Deep Interview → Minimum-Unit PRDs)

유저의 아이디어를 /deep-interview를 통해 명확화하고, 최소 단위 PRD들로 분리하여 저장한다.

## Execution Mode

이 스킬은 **에이전트 팀 모드**로 실행한다.

## 에이전트 라우팅 테이블

| 단계            | 에이전트                     | 모델   | 비고                                       |
| --------------- | ---------------------------- | ------ | ------------------------------------------ |
| 코드베이스 조사 | `oh-my-claudecode:explore`   | sonnet | 사전 조사 (Deep Interview 전)              |
| Deep Interview  | 메인 컨텍스트                | opus   | `Skill("oh-my-claudecode:deep-interview")` |
| PRD 분리        | `oh-my-claudecode:architect` | opus   | 의존성 그래프 + 최소 단위 분리             |
| PRD 검증        | `oh-my-claudecode:critic`    | opus   | 분리 기준 적절성 검증                      |

## 실행 정책 (CRITICAL)

> **BLOCKING REQUIREMENT**: 각 단계에서 지정된 `Skill(...)` / `Agent(...)` 호출은
> 반드시 해당 도구를 통해 실행해야 한다.
> 자연어로 직접 수행하는 것은 **명시적으로 금지**된다.

### 금지 행위

- ❌ Deep Interview 질문을 직접 생성하지 않는다 → `Skill("oh-my-claudecode:deep-interview")` 호출
- ❌ PRD 분리 판단을 직접 하지 않는다 → `Agent(subagent_type="oh-my-claudecode:architect")` 호출
- ❌ PRD 검증을 직접 하지 않는다 → `Agent(subagent_type="oh-my-claudecode:critic")` 호출

### 자가 검증

각 Phase 실행 전 확인:

- [ ] 이 단계에서 Skill/Agent 호출이 지정되어 있는가?
- [ ] "예"이면 → 반드시 도구 호출. 직접 수행 금지.

### 기타 정책

- `oh-my-claudecode:architect` → `oh-my-claudecode:critic` 순차 강제 (architect 완료 후 critic 검증)
- Deep Interview는 메인 컨텍스트에서 `Skill("oh-my-claudecode:deep-interview")`로 수행
- 코드베이스 조사는 `Agent(subagent_type="oh-my-claudecode:explore", model="sonnet")`로 사전 실행

## PRD 작성 시 레퍼런스 결정 테이블

PRD를 작성할 때, 해당 PRD의 구현 범위에 따라 아래 테이블을 참고하여 `## Reference` 섹션에 필요한 레퍼런스를 링크한다. prd-exec에서 구현 시 이 레퍼런스를 읽고 적용한다.

| #   | 조건 타입 | 매칭 패턴                    | 레퍼런스 | 설명                   |
| --- | --------- | ---------------------------- | -------- | ---------------------- |
| 1   | 파일 경로 | `*.tsx` 생성·수정            | TBD      | UI 컴포넌트 구현 규칙  |
| 2   | 메시지    | Figma URL 또는 "디자인 구현" | TBD      | Figma 디자인 연동 절차 |
| 3   | 파일 경로 | `*Form*.tsx`, `*Field*.tsx`  | TBD      | 폼 아키텍처 패턴       |
| 4   | 파일 경로 | `api/hooks/use*Mutation.ts`  | TBD      | API 훅 패턴            |

## Workflow

### Phase 1: Deep Interview

1. **Skill 호출**: `Skill("oh-my-claudecode:deep-interview")`로 요구사항 명확화
   - 유저 아이디어를 ARGUMENTS로 전달
   - Ambiguity ≤ 20% 까지 인터뷰 진행
   - 피그마 URL이 있으면 `get_design_context`로 디자인 확인

2. **Deep Interview 완료 시**: 스펙이 `.omc/specs/deep-interview-{slug}.md`에 저장됨

### Phase 2: PRD 분리

Deep Interview 결과를 기반으로 최소 단위 PRD로 분리한다.

1. **분리 원칙**:
   - 하나의 PRD = 최대한 작게 하나의 독립적 기능 단위
   - PR 하나로 리뷰 가능한 크기
   - 공통 컴포넌트/훅은 별도 PRD로 분리
   - 마이그레이션/정리는 마지막 PRD로

2. **의존성 그래프 생성**:
   - PRD 간 의존 관계 명시
   - 병렬 실행 가능한 PRD 그룹 식별

3. **PRD 파일 구조** (각 PRD 파일에 포함):

   ```markdown
   # PRD {N}: {제목}

   ## Reference

   | #   | 레퍼런스 | 이유             |
   | --- | -------- | ---------------- |
   | 1   | TBD      | \*.tsx 생성 포함 |
   | 3   | TBD      | _Form_.tsx 포함  |

   ## Metadata

   - PRD: {N} of {total}
   - Dependencies: PRD {X}, PRD {Y} (또는 "없음")

   ## Goal

   {한 문장 목표}

   ## Scope

   {구현 범위}

   ## Design Spec (있는 경우)

   {피그마에서 추출한 디자인 스펙}

   ## Constraints

   - {제약 조건}

   ## Non-Goals

   - {이번 PRD에서 하지 않는 것}

   ## Acceptance Criteria

   - [ ] {검증 가능한 기준}
   ```

4. **저장**: `.omc/specs/{feature}/prd{N}-{name}.md`

### Phase 3: 의존성 그래프 출력

유저에게 최종 결과를 보여준다:

```
PRD 목록:
1. PRD 1: {제목} — {한 줄 설명} | ref: ui-implementation.md, form-architecture.md
2. PRD 2: {제목} — {한 줄 설명} | ref: feature-api.md
...

의존성:
PRD 1, 2 → 병렬 가능
PRD 3 → PRD 1, 2 완료 후
...

추천: `/prd-exec .omc/specs/{feature}` 으로 실행
```

## 유저에게 확인받을 사항

- Deep Interview 중 각 질문에 대한 답변
- PRD 분리 결과 (PRD 개수, 범위, 의존성)

## Output

- `.omc/specs/{feature}/prd{N}-{name}.md` 파일들
- 의존성 그래프 (텍스트)
- 다음 단계 안내 (`/prd-exec` 추천)
