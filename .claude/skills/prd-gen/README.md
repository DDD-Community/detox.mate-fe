# PRD Generator — Deep Interview 기반 최소 단위 PRD 생성

유저의 아이디어를 Deep Interview로 명확화하고, 최소 단위 PRD로 분리하여 저장한다.

## 플로우

```
[유저 아이디어]
    |
    v
Phase 1: Deep Interview
    |  Skill("oh-my-claudecode:deep-interview")
    |  Ambiguity <= 20% 까지 인터뷰
    |  출력: .omc/specs/deep-interview-{slug}.md
    |
    v
Phase 2: PRD 분리
    |  oh-my-claudecode:architect (opus)
    |    - 1 PRD = 1 PR 크기의 독립 기능 단위
    |    - 공통 컴포넌트/훅은 별도 PRD
    |    - 의존성 그래프 생성
    |    - 레퍼런스 테이블 기반으로 ## Reference 섹션 자동 링크
    |
    v
Phase 2.5: PRD 검증
    |  oh-my-claudecode:critic (opus)
    |    - 분리 기준 적절성 검증
    |
    v
Phase 3: 결과 출력
    |  유저에게 PRD 목록 + 의존성 그래프 표시
    |  출력: .omc/specs/{feature}/prd{N}-{name}.md
    |
    v
[완료 → /prd-exec 추천]
```

## 레퍼런스 결정 테이블

PRD 작성 시 구현 범위에 따라 `## Reference` 섹션에 링크할 레퍼런스를 결정한다.
prd-exec에서 이 레퍼런스를 읽고 구현에 적용한다.

| #   | 조건                        | 레퍼런스                                    |
| --- | --------------------------- | ------------------------------------------- |
| 1   | `*.tsx` 생성/수정           | TBD                                         |
| 2   | Figma URL 또는 디자인 구현  | TBD                                         |
| 3   | `*Form*.tsx`, `*Field*.tsx` | TBD                                         |
| 4   | `api/hooks/use*Mutation.ts` | TBD                                         |

## PRD 파일 구조

```markdown
# PRD {N}: {제목}

## Reference

| #   | 레퍼런스                              | 이유             |
| --- | ------------------------------------- | ---------------- |
| 1   | TBD                                 | \*.tsx 생성 포함 |

## Metadata

- PRD: {N} of {total}
- Dependencies: PRD {X}, PRD {Y} (또는 "없음")

## Goal / Scope / Constraints / Non-Goals / Acceptance Criteria
```

## 트리거

- `/prd-gen`, "PRD 생성", "PRD 만들어", "기획 정리"
