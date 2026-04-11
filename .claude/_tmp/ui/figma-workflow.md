# Figma MCP Usage Flow (follow in order)

> **⚠️ 구현 전 강제 체크포인트 — 코드 한 줄 작성 전 아래 항목을 순서대로 확인하고 준수여부 함께 출력할 것**
>
> - [ ] `get_design_context` 를 **모든 뷰포트**(mobile + PC)에 대해 호출했는가?
> - [ ] 각 `div`를 프리미티브로 치환했는가? (`flex-col` → `VStack`, `flex-row` → `HStack`/`Stack`, wrapper → `Box`)
> - [ ] `span`, `p` 를 `Typography`로 치환했는가?
> - [ ] 하드코딩 색상(`#xxx`)이 없는가? → `tokens.color.*` 사용
> - [ ] vanilla-extract CSS(`*.css.ts`)를 최소화했는가? → 반응형·애니메이션·props 미지원 속성에 한해서만 허용
> - [ ] 서브에이전트에게 넘기는 프롬프트에도 위 규칙이 명시되어 있는가?

## Step 1. Fetch Design (`get_design_context`)

- If Figma MCP is unavailable → **block implementation**, request connection
- **Never** use estimated values (fontSize, gap, padding, etc.)

## Step 2. Review Design

- Inspect **every node** (parent and child): size, spacing, borderRadius, color, alignment
- Validate each variant and odd/even row individually — do not trust variant values blindly
- Cross-check component variant values against actual Figma values
- Even if nodes use margin/padding, verify whether Stack `gap` can replace them first

## Step 3. Convert to Code (primitive replacement required)

Do not copy Figma output HTML structure as-is. Before writing any code, replace **all HTML elements** with primitives:

| HTML             | Primitive                               |
| ---------------- | --------------------------------------- |
| `div` (flex-col) | `VStack`                                |
| `div` (flex-row) | `HStack` / `Stack`                      |
| `div` (wrapper)  | `Box`                                   |
| `span`, `p`      | `Typography` (use `as` prop to set tag) |

- `Box` covers most layout elements
- Raw HTML is only allowed for elements with no clear primitive equivalent (e.g. `br`)

## Step 4. Verify

- No hardcoded colors: `#fff`, `#000` → use `tokens.color.*`
- When changing Button size: calculate padding + lineHeight + border → compare against Figma height
- Final check: no raw HTML (`div`, `span`, `p`) remaining
