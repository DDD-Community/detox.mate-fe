---
name: create-pr
description: |
  GitHub Pull Request 생성 + 스마트 커밋.
  Trigger: "PR 올려줘", "PR 생성", "create PR", "/create-pr", "/pr"
  - 미커밋 변경사항을 논리적으로 분리하여 커밋
  - main 브랜치면 자동으로 feature 브랜치 생성
  - 기존 PR이 있으면 추가 커밋 반영하여 PR 업데이트
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(gh:*), Bash(basename:*), AskUserQuestion
model: sonnet
version: 3.0.0
---

# Create Pull Request (with Smart Commits)

GitHub PR 생성을 자동화하며, 커밋 정리와 브랜치 관리를 처리한다.

## Prerequisites

- Git repository
- `gh` CLI authenticated

## Instructions

### Phase 0: 커밋되지 않은 변경 자동 정리

1. `git status`로 uncommitted changes 확인
2. 변경사항이 없으면 Phase 1로 건너뜀
3. 변경사항이 있으면:
   a. `git diff`와 `git diff --cached`로 전체 변경 분석
   b. 변경사항을 **논리적 단위별로 분류** (예: 기능 추가 / 스타일 수정 / 테스트 / 설정 변경 / 리팩토링)
   c. 분류 결과를 사용자에게 보여줌:
   ```
   커밋을 다음과 같이 분리합니다:
   1. feat(user): 로그인 폼 컴포넌트 추가 — src/features/login/...
   2. style(user): 로그인 페이지 스타일 조정 — src/pages/login/...
   3. test(user): 로그인 폼 테스트 추가 — src/features/login/__tests__/...
   ```
   d. 사용자 확인 후 각 단위별로 `git add <files>` + `git commit` 실행
   e. Conventional Commit 형식 사용: `type(scope): description`

### Phase 1: 브랜치 확인 및 생성

1. `git branch --show-current`로 현재 브랜치 확인
2. **main 브랜치인 경우**:
   a. 변경 내용 분석하여 브랜치명 자동 제안 (예: `feat/add-login-form`, `fix/modal-zindex`)
   b. 사용자에게 브랜치명 확인 요청 (AskUserQuestion)
   c. `git checkout -b <branch-name>` 실행
3. feature 브랜치인 경우: 그대로 진행

### Phase 2: PR 생성 또는 업데이트

#### Step 1: 기존 PR 확인

```bash
gh pr list --head <current-branch> --json number,title,body,url
```

#### Case A — 새 PR 생성:

1. `git log main..HEAD --oneline`과 `git diff main...HEAD`로 변경 분석
2. `.github/pull_request_template.md` 확인 (있으면 템플릿 활용)
3. Change type → label 결정:
   - `bug`: Bug fix
   - `enhancement`: New feature
   - `documentation`: Documentation
   - `dependencies`: Dependency update
   - `github_actions`: CI/CD changes
4. PR 제목: conventional commit 형식, 커밋이 한국어면 한국어로
5. 리뷰어 결정:
   a. `.claude/skills/shared/config/slack-members.json` 읽기
   b. `gh api user --jq '.login'`으로 현재 사용자 확인
   c. **본인 제외한 멤버 목록**을 보여주고 리뷰어 선택 요청 (AskUserQuestion)
   d. 리뷰어가 결정되지 않으면 반드시 질문
6. `git push -u origin <branch>`
7. `gh pr create --base main --title "..." --body "$(cat <<'EOF' ... EOF)"`
8. `gh pr edit <number> --add-label <label> --add-assignee <username> --add-reviewer <reviewer>`

#### Case B — 기존 PR에 추가 커밋:

1. `git push`로 새 커밋 push
2. `gh pr view --json title,body,number,url`로 기존 PR 정보 조회
3. 새로 추가된 커밋 확인: `git log <last-pr-commit>..HEAD --oneline`
4. 추가된 커밋을 반영하여 **PR 제목 및 설명 업데이트**:
   ```bash
   gh pr edit <number> --title "새 제목" --body "$(cat <<'EOF'
   업데이트된 본문
   EOF
   )"
   ```

### Phase 3: 결과 보고

```
PR 생성 완료

PR: {PR URL}
   제목: {title}
   라벨: {label}
   리뷰어: {reviewers}
```

## Error Handling

| 상황                     | 처리                                 |
| ------------------------ | ------------------------------------ |
| SAML SSO Error           | authorization URL 보여주고 인증 요청 |
| No commits ahead of base | PR 생성할 내용 없음 안내             |
| Branch already has PR    | Case B (업데이트) 로직 진행          |
