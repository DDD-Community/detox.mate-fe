# Haejo — Feature 개발 플로우 오케스트레이션

Feature 개발의 전체 라이프사이클을 단계별 스킬 체이닝으로 자동화하는 오케스트레이터.
각 단계의 세부 동작은 하위 스킬에 위임하며, haejo는 흐름 제어와 유저 확인만 담당한다.

## 플로우

```
[유저 요청]
    |
    v
Step 1: /prd-gen
    |  Deep Interview → 최소 단위 PRD 분리
    |  출력: .omc/specs/{feature}/prd*.md
    |
    v  (유저 확인)
Step 2: /prd-exec
    |  PRD별 구현 → 서브 브랜치 PR 생성
    |  내부: deep-interview → ralph → code-review → codex:review → PR
    |  출력: feature 브랜치 (서브 PR 머지 완료)
    |
    v  (유저 확인)
Step 3: /create-pr
    |  feature → main PR 생성
    |  출력: PR URL
    |
    v  (자동 질문: "Slack 리뷰 요청도 보낼까요?")
Step 4: /review-request (선택)
    |  Slack 리뷰 요청 전송
    |
    v
[완료]
```

## 트리거

- `/haejo`, "개발해줘", "기능 만들어줘", "구현해줘", "작업해줘"

## 관련 스킬

| 스킬                              | 역할       | README                    |
| --------------------------------- | ---------- | ------------------------- |
| [prd-gen](../prd-gen/README.md)   | PRD 생성   | Deep Interview → PRD 분리 |
| [prd-exec](../prd-exec/README.md) | PRD 실행   | 구현 → 리뷰 → PR          |
| create-pr                         | PR 생성    | feature → main            |
| review-request                    | Slack 알림 | 리뷰어에게 전송           |
