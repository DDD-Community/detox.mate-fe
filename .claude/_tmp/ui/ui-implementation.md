# UI 컴포넌트 구현 체크리스트

**UI 구현시 반드시 체크리스트를 확인**

## 레이아웃 프리미티브 우선 사용 (필수)

- `div + CSS` 대신 `@oyg/ui-storefront` 레이아웃 컴포넌트 우선 사용
  - flex-col → `VStack`
  - flex-row → `HStack` 또는 `Stack`
  - 단순 wrapper → `Box`
- 교체 가능한 div가 있으면 CSS 파일 자체를 제거하는 방향으로 접근

## 프리미티브 컴포넌트 Props 레퍼런스

> ⚠️ CSS 작성 전 이 목록을 확인. props로 해결 가능하면 CSS 금지.
> ⚠️ spacing/size props는 **inline style**로 적용됨 → CSS `@media`로 오버라이드 **불가**

**Box / VStack / HStack / Stack** (`@oyg/ui-storefront`)

| Prop                  | 타입                                                      | CSS 역할                                          |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `fullWidth`           | `boolean`                                                 | `width: 100%`                                     |
| `bgColor`             | `ColorTokenPath`                                          | `backgroundColor` (e.g. `'gray.8'`, `'gray.100'`) |
| `color`               | `ColorTokenPath`                                          | `color`                                           |
| `p`                   | `number`                                                  | `padding` (px)                                    |
| `px`                  | `number`                                                  | `padding-left` + `padding-right` (px)             |
| `py`                  | `number`                                                  | `padding-top` + `padding-bottom` (px)             |
| `pt/pr/pb/pl`         | `number`                                                  | 개별 padding (px)                                 |
| `m/mx/my/mt/mr/mb/ml` | `number`                                                  | margin (px)                                       |
| `gap`                 | `number`                                                  | `gap` (px)                                        |
| `width/height`        | `number`                                                  | 고정 크기 (px)                                    |
| `maxWidth/maxHeight`  | `number`                                                  | 최대 크기 (px)                                    |
| `minWidth/minHeight`  | `number`                                                  | 최소 크기 (px)                                    |
| `align`               | `'start'\|'center'\|'end'\|'stretch'\|'baseline'`         | `align-items`                                     |
| `justify`             | `'start'\|'center'\|'end'\|'between'\|'around'\|'evenly'` | `justify-content`                                 |
| `direction`           | `'row'\|'column'\|'row-reverse'\|'column-reverse'`        | `flex-direction`                                  |
| `display`             | `'flex'\|'block'\|'inline'\|'grid'\|'none'\|'contents'`   | `display`                                         |
| `wrap`                | `'nowrap'\|'wrap'\|'wrap-reverse'`                        | `flex-wrap`                                       |

**Typography** (`@oyg/ui-storefront`)

| Prop                  | 타입                                   | CSS 역할                    |
| --------------------- | -------------------------------------- | --------------------------- |
| `variant`             | `'13px'\|'14px'\|'16px'\|'18px'` 등    | `font-size` + `line-height` |
| `weight`              | `'bold'\|'regular'` 등                 | `font-weight`               |
| `align`               | `'left'\|'center'\|'right'\|'justify'` | `text-align`                |
| `color`               | `ColorTokenPath`                       | `color`                     |
| `p/px/py/pt/pr/pb/pl` | `number`                               | padding (px, inline style)  |
| `m/mx/my/mt/mr/mb/ml` | `number`                               | margin (px, inline style)   |

**CSS 작성이 불가피한 경우** (props 미지원):

- `flexShrink`, `flexGrow`, `flex` (shorthand)
- `overflow`, `borderRadius`, `border`, `cursor`, `position`
- `width: '100%'` (Box width는 number만 허용)
- 반응형 spacing (inline style은 @media 오버라이드 불가)

## 컴포넌트 치환 우선 검토

- div + CSS 작성 전: VStack/HStack/Box/Typography로 대체 가능한지 확인
- spacing props는 inline style → CSS @media 오버라이드 불가
- `DesktopOnly` / `MobileOnly` 컴포넌트 사용 금지 → `usePlatform()` 기반 컴포넌트 분리로 통일

### 반응형 디자인 구현

- CSS `@media` 블록과 `usePlatform()` **혼재 금지**
- `usePlatform()`의 `platform` 값(`PC` | `MOBILE` | `APP`)으로 **섹션 컴포넌트 자체를 분리**한다.
- 단순 spacing/font 변경도 컴포넌트 분리로 처리 (CSS `@media` 사용 지양)

```tsx
// ✅ 권장: 섹션 컴포넌트 자체에서 Desktop/Mobile 분리 + 라우팅
function MySectionDesktop() {
  /* 데스크톱 전용 UI */
}
function MySectionMobile() {
  /* 모바일 전용 UI */
}

export function MySection() {
  const platform = usePlatform();
  return platform === 'PC' ? <MySectionDesktop /> : <MySectionMobile />;
}
```

- `APP` 플랫폼은 별도 분기가 필요할 때만 추가 (대부분 `MOBILE`과 동일 취급)

### 섹션 타이틀 패턴 (한줄 타이틀)

한줄 타이틀이 있는 섹션은 padding(`pt`, `pb`, `mb`)으로 간격을 잡지 않고 **Box 컨테이너 높이를 고정**한다.

```tsx
// ❌ padding으로 타이틀 간격
<Typography as="h2" variant="16px" weight="bold" pt={15} pb={16}>
  Section Title
</Typography>

// ✅ Box height={56}으로 컨테이너 크기 고정
<Box height={56} align="center" display="flex">
  <Typography as="h2" variant="16px" weight="bold" color="gray.100">
    Section Title
  </Typography>
</Box>
```

## vanilla-extract CSS 사용 최소화 (필수)

- CSS 파일(`*.css.ts`) 작성 전: 프리미티브 컴포넌트 props로 해결 가능한지 먼저 확인
- **허용되는 경우만** CSS 파일 작성:
  - 반응형 (`@media` / `tokens.mediaQuery.desktop`)
  - 애니메이션 (`@keyframes`)
  - 프리미티브 컴포넌트 props에 없는 CSS 속성 (e.g. `maxWidth`, `overflow`)
- 위 3가지에 해당하지 않으면 CSS 파일 생성 금지
