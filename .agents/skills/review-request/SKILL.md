---
name: review-request
description: |
  Discord로 PR 리뷰 요청 메시지를 전송합니다.
  Trigger: "/review-request", "리뷰 요청", "디스코드 리뷰", "review request"
  - 현재 브랜치의 PR 정보를 자동 수집
  - 멤버 목록에서 리뷰어 선택
  - Discord @mention으로 리뷰 요청 알림 전송
allowed-tools: Read, Write, Bash(gh:*), Bash(curl:*), AskUserQuestion
model: sonnet
version: 2.0.0
---

# Discord Review Request

현재 브랜치의 PR에 대해 Discord로 리뷰 요청 메시지를 전송한다.

## Config Files

- **Discord member mapping**: `.Codex/skills/shared/config/discord-members.json`
  - Maps GitHub usernames to Discord info
  - Format:
    ```json
    {
      "github-username": {
        "discordName": "표시이름",
        "discordId": "123456789012345678"
      }
    }
    ```
  - `discordId`는 @mention (알림)에 필수. Discord 설정 → 고급 → 개발자 모드 ON → 프로필 우클릭 → '사용자 ID 복사'
- **Discord webhook URL**: `.Codex/skills/shared/config/discord-webhook-url.txt`
  - Discord Incoming Webhook URL (한 줄)

## Prerequisites

- 현재 브랜치에 PR이 이미 생성되어 있어야 함
- `gh` CLI authenticated
- Discord webhook URL 설정 완료

## Instructions

### Step 1: PR 존재 확인

```bash
gh pr view --json number,title,body,url
```

- PR이 없으면: "현재 브랜치에 PR이 없습니다. 먼저 `/pr`로 PR을 생성해주세요." 안내 후 종료
- PR이 있으면: PR 정보 (URL, 제목, 요약) 수집

### Step 2: Discord Config 로드

1. `.Codex/skills/shared/config/discord-webhook-url.txt` 읽기
   - 없으면: 사용자에게 webhook URL 요청 (AskUserQuestion) → 파일에 저장
2. `.Codex/skills/shared/config/discord-members.json` 읽기
   - 없으면: 빈 `{}` 생성

### Step 3: 요청자 Discord 정보 확인

1. `gh api user --jq '.login'`으로 현재 GitHub 사용자 확인
2. `discord-members.json`에서 조회
3. 없으면:
   - AskUserQuestion: "GitHub 유저 `{username}`의 이름과 Discord User ID를 알려주세요 (Discord 설정 → 고급 → 개발자 모드 → 프로필 우클릭 → 사용자 ID 복사)"
   - 응답을 `discord-members.json`에 저장

### Step 4: 리뷰어 선택

1. `discord-members.json`에서 **본인 제외** 멤버 목록을 번호와 함께 표시:
   ```
   저장된 멤버 목록 (본인 제외):
   1. 이한빈 (hanbin)
   2. ...
   ```
2. AskUserQuestion: "리뷰대상자를 선택해주세요 (번호 또는 이름, 여러 명은 쉼표 구분)"
3. 새로운 이름이 입력되면:
   - AskUserQuestion: "Discord User ID와 GitHub 유저명을 알려주세요"
   - `discord-members.json`에 저장

### Step 5: Discord 메시지 전송

1. 메시지 구성:

   ```
   **리뷰 요청**
   **리뷰요청자:** <@REQUESTER_ID>
   **리뷰대상자:** <@REVIEWER_ID1> <@REVIEWER_ID2>
   **GitHub:** [PR #number](pr_url)
   **설명:** PR 한 줄 요약
   ```

2. Webhook으로 전송:

   ```bash
   curl -s -X POST -H "Content-type: application/json" \
     -d '{"content":"**리뷰 요청**\n**리뷰요청자:** <@REQUESTER_ID>\n**리뷰대상자:** <@REVIEWER_ID>\n**GitHub:** [PR #N](url)\n**설명:** ..."}' \
     "<webhook_url>"
   ```

3. 전송 성공 확인 (HTTP 204 응답)

### Step 6: 결과 보고

```
Discord 리뷰 요청 전송 완료

PR: {PR URL}
   제목: {title}
리뷰요청자: {requester discord name}
   리뷰대상자: {reviewer discord names}
```

## Error Handling

| 상황                 | 처리                                                      |
| -------------------- | --------------------------------------------------------- |
| PR 없음              | "현재 브랜치에 PR이 없습니다. `/pr`로 먼저 생성해주세요." |
| Webhook URL 없음     | 사용자에게 URL 요청 후 저장                               |
| Discord 전송 실패    | 에러 메시지 표시, webhook URL 확인 안내                   |
| 멤버 Discord ID 없음 | @mention 불가 경고, ID 입력 요청                          |
| gh 인증 안됨         | `gh auth login` 안내                                      |
