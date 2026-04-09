# detox.mate-fe

DDD 13기 Web 2팀(일분전)의 프론트엔드 레포지토리입니다.

## 개발 환경

- Runtime manager: `mise`
- Node.js: `24`
- Package manager: `pnpm` (`mise`로 관리)
- App: React Native + Expo SDK 54 + TypeScript

## 시작하기

```bash
# 0) (최초 1회) mise 활성화
eval "$(mise activate zsh)"

# 1) 런타임 설치 (Node.js, pnpm)
mise install

# 2) 의존성 설치
pnpm install

# 3) 개발 서버 실행
pnpm start
```

## 자주 쓰는 명령어

```bash
# 플랫폼별 실행
pnpm ios
pnpm android
pnpm web
```

## 주요 라이브러리

- 상태 관리: `zustand`
- API 통신: `axios`
- 이미지 업로드: `expo-image-picker`
- 토큰 저장: `expo-secure-store`

## 코드 품질

```bash
pnpm format:check
pnpm format
```
