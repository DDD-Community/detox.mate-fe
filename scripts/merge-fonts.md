# 폰트 병합 가이드 (NanumSquareRound + Pretendard)

## 배경

NanumSquareRound는 자주 쓰이는 한글 음절만 포함하고 있어, `힣`, `팉`, `탛` 같은 드문 음절의 글리프가 없다.
React Native `TextInput`에서 이런 글자를 입력하면 IME 조합 중 글자가 일시적으로 사라지는 현상이 발생한다.

Pretendard는 한글 음절 11,172자 전체를 포함하므로, NanumSquareRound에 없는 글리프만 Pretendard에서 보충해 단일 폰트 파일로 병합한다.

## 사전 준비

**Python 패키지 설치**

```bash
pip install fonttools
```

**Pretendard 폰트 다운로드**

1. https://github.com/orioncactus/pretendard/releases/latest 에서 `Pretendard.zip` 다운로드
2. 압축 해제 후 아래 4개 파일을 `scripts/pretendard/` 폴더에 복사

| 파일명 | NanumSquareRound 대응 웨이트 |
|--------|------------------------------|
| `Pretendard-Light.ttf` | NanumSquareRoundL (Light) |
| `Pretendard-Regular.ttf` | NanumSquareRoundR (Regular) |
| `Pretendard-SemiBold.ttf` | NanumSquareRoundB (Bold) |
| `Pretendard-Bold.ttf` | NanumSquareRoundEB (ExtraBold) |

> `scripts/pretendard/*.ttf`는 `.gitignore`에 등록되어 있으므로 커밋되지 않는다.

## 실행

프로젝트 루트에서 실행한다.

```bash
python scripts/merge-fonts.py
```

완료되면 `assets/fonts/nanum-pretendard/` 폴더에 병합된 폰트 4개가 생성된다.

```
assets/fonts/nanum-pretendard/
  NanumSquareRoundL.ttf
  NanumSquareRoundR.ttf
  NanumSquareRoundB.ttf
  NanumSquareRoundEB.ttf
```

> 결과물 폴더도 `.gitignore`에 등록되어 있다. 앱 번들에는 포함되지만 git에는 커밋하지 않는다.

## 앱에 적용

`src/lib/token/primitive/fonts.ts`에서 import 경로를 변경한다.

```ts
// 변경 전
import nanumSquareRoundB  from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundB.ttf';
import nanumSquareRoundEB from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundEB.ttf';
import nanumSquareRoundL  from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundL.ttf';
import nanumSquareRoundR  from '../../../../assets/fonts/nanum-square-round/NanumSquareRoundR.ttf';

// 변경 후
import nanumSquareRoundB  from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundB.ttf';
import nanumSquareRoundEB from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundEB.ttf';
import nanumSquareRoundL  from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundL.ttf';
import nanumSquareRoundR  from '../../../../assets/fonts/nanum-pretendard/NanumSquareRoundR.ttf';
```

폰트 이름(`NanumSquareRoundR` 등)은 그대로이므로 이 외 코드 변경은 없다.

## 라이선스

- NanumSquareRound: OFL 1.1 — 병합 및 재배포 허용
- Pretendard: OFL 1.1 — 병합 및 재배포 허용
