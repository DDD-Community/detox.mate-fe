---
name: haejo
description: |
  Feature 개발 플로우 오케스트레이션. 단계별 스킬 체이닝.
  Trigger: "/haejo", "개발해줘", "기능 만들어줘",
  "구현해줘", "작업해줘"
  - /prd-gen → /prd-exec → /create-pr → /review-request
  - 단계별 유저 확인 후 다음 스킬 호출
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Skill
model: sonnet
version: 1.1.0
---

# Haejo — Feature 개발 플로우 오케스트레이션

사용자의 Feature 개발 요청을 받아 단계별로 스킬을 체이닝하여 실행한다.
각 하위 스킬의 세부 동작(레퍼런스 라우팅, 에이전트 라우팅 등)은 해당 스킬 내부에서 관리한다.

## 플로우

```
/prd-gen → /prd-exec → /create-pr → /review-request
```

### Step 1: PRD 생성 — `Skill("prd-gen")`

- 요구사항 명확화 + 최소 단위 PRD 분리
- 완료 후 유저 확인: "PRD {N}개 생성 완료. /prd-exec 진행할까요?"
- "예" → Step 2, "수정" → PRD 수정, "중단" → 종료

### Step 2: PRD 실행 — `Skill("prd-exec")`

- PRD별 구현 + 서브 브랜치 PR 생성 (prd-exec 내부에서 처리)
- 완료 후 유저 확인: "모든 PRD 구현 완료. feature → main PR 생성할까요?"
- "예" → Step 3

### Step 3: Feature PR 생성 — `Skill("create-pr")`

- **feature 브랜치 → main** PR 생성 (prd-exec의 서브 PR과 별개)
- 완료 후 자동 질문: "Slack 리뷰 요청도 보낼까요?"
- "예" → Step 4, "스킵" → 완료

### Step 4: 리뷰 요청 — `Skill("review-request")` (선택)

- Slack으로 PR 리뷰 요청 전송

## 스킬 간 핸드오프

| From → To                        | 매개체                                   |
| -------------------------------- | ---------------------------------------- |
| `/prd-gen` → `/prd-exec`         | `.omc/specs/{feature}/prd*.md`           |
| `/prd-exec` → `/create-pr`       | feature 브랜치 (서브 PR들이 머지된 상태) |
| `/create-pr` → `/review-request` | PR URL                                   |

## 실행 정책 (CRITICAL)

> **BLOCKING REQUIREMENT**: 각 Step에서 지정된 `Skill(...)` 호출은
> 반드시 Skill 도구를 통해 실행해야 한다.
> 자연어로 직접 수행하는 것은 **명시적으로 금지**된다.

### 금지 행위

- ❌ PRD를 직접 작성하지 않는다 → `Skill("prd-gen")` 호출
- ❌ 코드를 직접 구현하지 않는다 → `Skill("prd-exec")` 호출
- ❌ PR을 직접 생성하지 않는다 → `Skill("create-pr")` 호출
- ❌ Slack 메시지를 직접 보내지 않는다 → `Skill("review-request")` 호출

### 자가 검증

각 Step 실행 전 확인:

- [ ] 이 단계에서 Skill 호출이 지정되어 있는가?
- [ ] "예"이면 → 반드시 Skill 도구 호출. 직접 수행 금지.

### 기타 정책

- 각 단계 완료 시 **반드시 유저 확인** 후 다음 단계 진행
- `/review-request`는 스킵 가능
- 세부 동작(에이전트 라우팅, 레퍼런스 라우팅, codex 리뷰 등)은 하위 스킬에 위임

## 결과 보고

```
플로우 완료!

실행된 단계:
  1. PRD 생성 ({N}개)
  2. PRD 구현 (서브 PR {M}개)
  3. Feature PR: {PR URL}
  4. Slack 리뷰 요청 (또는 스킵)
```

## Error Handling

| 상황           | 처리                                   |
| -------------- | -------------------------------------- |
| 스킬 호출 실패 | 에러 표시 + 재시도 또는 수동 호출 안내 |
| 유저가 "중단"  | 현재까지 진행 상황 보고 후 종료        |
| 단계 스킵      | 해당 단계 건너뛰고 다음 진행           |
