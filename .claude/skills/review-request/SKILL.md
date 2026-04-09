---
name: review-request
description: |
  Slack으로 PR 리뷰 요청 메시지를 전송합니다.
  Trigger: "/review-request", "리뷰 요청", "슬랙 리뷰", "review request"
  - 현재 브랜치의 PR 정보를 자동 수집
  - 멤버 목록에서 리뷰어 선택
  - Slack @mention으로 리뷰 요청 알림 전송
allowed-tools: Read, Write, Bash(gh:*), Bash(curl:*), AskUserQuestion
model: sonnet
version: 1.0.0
---

# Slack Review Request

현재 브랜치의 PR에 대해 Slack으로 리뷰 요청 메시지를 전송한다.

## Config Files

- **Slack member mapping**: `.claude/skills/shared/config/slack-members.json`
  - Maps GitHub usernames to Slack info
  - Format:
    ```json
    {
      "github-username": {
        "slackName": "display-name",
        "slackId": "U0XXXXXXXX"
      }
    }
    ```
  - `slackId`는 @mention (알림)에 필수. Slack 프로필 → More (⋯) → Copy member ID에서 확인
- **Slack webhook URL**: `.claude/skills/shared/config/webhook-url.txt`
  - Slack Incoming Webhook URL (한 줄)

## Prerequisites

- 현재 브랜치에 PR이 이미 생성되어 있어야 함
- `gh` CLI authenticated
- Slack webhook URL 설정 완료

## Instructions

### Step 1: PR 존재 확인

```bash
gh pr view --json number,title,body,url
```

- PR이 없으면: "현재 브랜치에 PR이 없습니다. 먼저 `/pr`로 PR을 생성해주세요." 안내 후 종료
- PR이 있으면: PR 정보 (URL, 제목, 요약) 수집

### Step 2: Slack Config 로드

1. `.claude/skills/shared/config/webhook-url.txt` 읽기
   - 없으면: 사용자에게 webhook URL 요청 (AskUserQuestion) → 파일에 저장
2. `.claude/skills/shared/config/slack-members.json` 읽기
   - 없으면: 빈 `{}` 생성

### Step 3: 요청자 Slack 정보 확인

1. `gh api user --jq '.login'`으로 현재 GitHub 사용자 확인
2. `slack-members.json`에서 조회
3. 없으면:
   - AskUserQuestion: "GitHub 유저 `{username}`의 Slack 닉네임과 User ID를 알려주세요 (Slack 프로필 → ⋯ → Copy member ID)"
   - 응답을 `slack-members.json`에 저장

### Step 4: 리뷰어 선택

1. `slack-members.json`에서 **본인 제외** 멤버 목록을 번호와 함께 표시:
   ```
   저장된 멤버 목록 (본인 제외):
   1. 윤성민님_US커머스플랫폼개발팀 (min-oli)
   2. 여진석님_US커머스플랫폼개발팀 (realstone2)
   ```
2. AskUserQuestion: "리뷰대상자를 선택해주세요 (번호 또는 이름, 여러 명은 쉼표 구분)"
3. 새로운 이름이 입력되면:
   - AskUserQuestion: "Slack User ID와 GitHub 유저명을 알려주세요"
   - `slack-members.json`에 저장

### Step 5: Slack 메시지 전송

1. Slack mrkdwn 형식으로 메시지 구성:

   ```
   *리뷰 요청*
   *리뷰요청자:* <@U0XXXXXXXX>
   *리뷰대상자:* <@U0YYYYYYYY>, <@U0ZZZZZZZZ>
   *GitHub:* <pr_url|PR #number>
   *설명:* PR 한 줄 요약
   ```

2. Webhook으로 전송:

   ```bash
   curl -s -X POST -H "Content-type: application/json" \
     -d '{"text":"*리뷰 요청*\n*리뷰요청자:* <@ID>\n*리뷰대상자:* <@ID>\n*GitHub:* <url|PR #N>\n*설명:* ..."}' \
     "<webhook_url>"
   ```

3. 전송 성공 확인

### Step 6: 결과 보고

```
Slack 리뷰 요청 전송 완료

PR: {PR URL}
   제목: {title}
리뷰요청자: {requester slack name}
   리뷰대상자: {reviewer slack names}
```

## Error Handling

| 상황               | 처리                                                      |
| ------------------ | --------------------------------------------------------- |
| PR 없음            | "현재 브랜치에 PR이 없습니다. `/pr`로 먼저 생성해주세요." |
| Webhook URL 없음   | 사용자에게 URL 요청 후 저장                               |
| Slack 전송 실패    | 에러 메시지 표시, webhook URL 확인 안내                   |
| 멤버 Slack ID 없음 | @mention 불가 경고, ID 입력 요청                          |
| gh 인증 안됨       | `gh auth login` 안내                                      |
