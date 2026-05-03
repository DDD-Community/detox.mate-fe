# Design Token System

detox.mate 디자인 토큰 시스템입니다.

## 구조

```
src/lib/token/
├── primitive/          # Raw 디자인 값
│   ├── colors.ts       # green, level, gray, system 색상
│   ├── typography.ts   # 폰트 프리셋 (Pretendard)
│   ├── spacing.ts      # 간격 (2~192, 짝수만)
│   └── radius.ts       # 보더 라디어스 (4, 8, 12, 16, full)
├── icons/              # 아이콘 레지스트리
│   └── index.ts        # 아이콘 이름 → 파일명 매핑
└── index.ts            # barrel export
```

## 사용법

### Import

```typescript
import { primitiveColors, typography, spacing, radius } from 'src/lib/token';
```

### Colors

컴포넌트에서는 `primitiveColors`를 직접 참조합니다.

```typescript
import { primitiveColors } from 'src/lib/token';

const { gray, green } = primitiveColors;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderColor: gray[200],
  },
  text: {
    color: gray[900],
  },
  errorText: {
    color: '#E53935',
  },
});
```

**Primitive color 팔레트:** `green`, `brown`, `level`, `gray`, `system`. 각 팔레트의 키는 `src/lib/token/primitive/colors.ts` 참고.

### Typography

Pretendard 폰트 기반, 모든 프리셋은 `...spread`로 사용합니다.

```typescript
import { typography } from 'src/lib/token';

const styles = StyleSheet.create({
  heading: { ...typography.h1 }, // 32/bold/150%
  title: { ...typography.title1B }, // 20/bold/150%
  body: { ...typography.body1R }, // 16/regular/150%
  caption: { ...typography.caption2 }, // 11/regular/150%
});
```

**프리셋 목록:**

| 프리셋                         | Size | Weight                  | 용도       |
| ------------------------------ | ---- | ----------------------- | ---------- |
| `h1`                           | 32   | bold                    | 대제목     |
| `h2`                           | 28   | bold                    | 중제목     |
| `h3`                           | 24   | bold                    | 소제목     |
| `title1B` / `title1M`          | 20   | bold / medium           | 타이틀     |
| `title2B` / `title2M`          | 18   | bold / medium           | 서브타이틀 |
| `body1B` / `body1M` / `body1R` | 16   | bold / medium / regular | 본문       |
| `body2B` / `body2M` / `body2R` | 14   | bold / medium / regular | 보조 본문  |
| `body3B` / `body3M` / `body3R` | 12   | bold / medium / regular | 작은 본문  |
| `caption2`                     | 11   | regular                 | 캡션       |

### Spacing

짝수만 사용합니다. 8배수 또는 4배수를 권장합니다.

```typescript
import { spacing } from 'src/lib/token';

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    gap: spacing[8],
    marginBottom: spacing[24],
  },
});
```

**값:** 2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 80, 96, 128, 192

### Border Radius

짝수만 사용합니다. `full`은 pill/원형입니다.

```typescript
import { radius } from 'src/lib/token';

const styles = StyleSheet.create({
  card: { borderRadius: radius[12] },
  input: { borderRadius: radius[8] },
  chip: { borderRadius: radius.full }, // 999
});
```

**값:** 4, 8, 12, 16, full(999)

### Icons

SVG 파일은 `src/assets/icons/`에 저장하고, 레지스트리에 등록합니다.

```typescript
// src/lib/token/icons/index.ts 에 등록
export const iconNames = {
  home: 'ic-home',
  search: 'ic-search',
} as const;

// 사용
import { iconNames, type IconName } from 'src/lib/token';
const myIcon: IconName = 'home'; // 타입 안전
```

**새 아이콘 추가 절차:**

1. SVG 파일을 `src/assets/icons/`에 저장 (kebab-case: `ic-arrow-left.svg`)
2. `src/lib/token/icons/index.ts`의 `iconNames`에 등록
3. 컴포넌트에서 import하여 사용

## 핵심 규칙

1. **primitive 직접 사용**: 컴포넌트에서는 `primitiveColors`를 사용.
2. **as const**: 모든 토큰은 `as const`로 정의되어 TypeScript 자동완성 지원.
3. **짝수만**: spacing과 radius는 짝수 값만 사용.
4. **letter-spacing**: typography 프리셋에 -2% letter-spacing 포함.
