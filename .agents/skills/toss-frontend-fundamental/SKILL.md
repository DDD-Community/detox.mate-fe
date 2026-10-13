---
name: toss-frontend-fundamental
description: 'DetoxMate FE 코드를 구현, 수정, 리팩터링하거나 리뷰할 때 적용한다. Toss Frontend Fundamentals의 17개 가이드 핵심을 이 본문에서 읽고, 현재 문제에 맞는 구조와 유지할 상황을 판단한다.'
---

# Toss Frontend Fundamental

Toss Frontend Fundamentals의 17개 가이드 핵심을 프로젝트에 맞게 재구성했다. 공식 스킬은 아니다.

이 본문만으로 구조를 판단한다. 원문·관련 스킬을 확인하려고 기본적으로 추가 문서나 링크를 열지 않는다. 사용자가 원문 확인을 요청하거나 실제 라이브러리 사용의 불확실성을 해소해야 할 때만 해당 근거를 확인한다.

실제 코드·호출부·요구 동작을 읽고 아래 원칙이 현재 문제와 맞을 때만 최소 범위에 적용한다. 리뷰 요청에서는 근거와 수정안을 설명하고 명시적인 변경 요청 없이 코드·의존성을 바꾸지 않는다.

가독성은 이해할 맥락, 예측 가능성은 호출 계약, 응집도는 함께 바뀌는 관계, 결합도는 변경 영향 범위다. 고정 우선순위는 없다. 수정 누락이 버그로 이어지면 연결을 강화하고, 독립 정책의 변경이 퍼지면 분리한다. 추상화가 흐름을 숨기면 가까이 드러내고 상세가 목적을 가리면 책임으로 감싼다.

줄 수·반복 횟수·props 단계 수로 결정하지 않는다. 변경 이유, 보존한 동작과 트레이드오프를 설명한다. 아래 ‘원문’은 의미 요약이며 코드 블록은 주변 코드를 생략한 각색 비교다.

## 조건과 흐름

**1. 복잡한 조건에 이름 붙이기** 중첩 탐색·비교의 뜻을 해석해야 할 때 조건을 이름으로 드러낸다. 원문: 상품 필터의 `categories.some(...) && prices.some(...)` → `isSameCategory && isPriceInRange`. 단순 비교·짧은 일회성 식은 유지하며 모든 식을 함수로 추출하지 않는다.

**2. 숫자의 이유와 단위 드러내기** 목적을 모르는 숫자는 실제 이유를 확인해 이름 붙인다. 원문: 좋아요 후 재조회 전 `delay(300)` → 애니메이션 완료 대기인 `ANIMATION_DELAY_MS`. 모든 `0`·`1`을 상수화하거나 임의 지연을 정당화하지 않는다.

**3. 단순 정책을 사용 위치 가까이 두기** 버튼 조건을 찾느라 여러 추상화를 오가면 단순 정책을 가까이 표현한다. 원문: 버튼 → `getPolicyByRole` → 정책 목록 → 가까운 관리자·조회자 분기 또는 역할 맵. 복잡하거나 함께 바뀌는 권한 기준은 공통 계약을 유지한다.

**4. 중첩 분기를 순서대로 읽기** 분기 우선순위를 펼쳐야 한다면 순차적인 조건과 반환으로 바꾼다. 원문: `A && B ? BOTH : A || B ? (A ? A : B) : NONE` → 둘 다·A만·B만·그 외의 `if` 분기. 단순 삼항식은 유지하고 평가 순서·반환값을 보존한다.

**5. 범위 비교를 수학적 순서로 읽기** 원문: `value >= min && value <= max` → `min <= value && value <= max`. 순수 범위를 읽기 쉽게 할 때 적용한다. JavaScript의 `min <= value <= max`는 다른 뜻이며 부수효과가 있는 식의 평가 순서를 바꾸지 않는다.

## 책임과 추상화

**6. 함께 실행되지 않는 경로 분리하기** 역할별 JSX와 전용 effect가 섞이면 상위는 경로를 선택하고 하위는 동작을 소유한다. 원문: `SubmitButton`의 조회자·관리자 조건과 관리자 애니메이션 → `ViewerSubmitButton`·`AdminSubmitButton`. 색상·텍스트 차이만으로 분리하지 않는다.

```tsx
// 각색 전: 역할 조건이 effect와 JSX에 흩어짐
function Actions({ role }: { role: 'viewer' | 'editor' }) {
  useEffect(() => {
    if (role === 'editor') return startEditorAnimation();
  }, [role]);
  return role === 'viewer' ? <ReadOnlyActions /> : <EditableActions />;
}
// 각색 후: 부모 선택, 하위 동작 소유
function Actions({ role }: { role: 'viewer' | 'editor' }) {
  return role === 'viewer' ? <ReadOnlyActions /> : <EditorActions />;
}
function EditorActions() {
  useEffect(() => startEditorAnimation(), []);
  return <EditableActions />;
}
```

`startEditorAnimation`은 정리 함수를 반환하는 가상 계약이다. 실제 effect 의존성·정리와 역할 전환 시 마운트·상태 보존을 확인하고 훅 호출 순서를 유지한다.

**7. 상세가 목적을 가릴 때 감싸기** 원문 1: 로그인 화면의 상태 확인·홈 이동 + 로그인 내용 → `AuthGuard` 또는 HOC가 진입 책임을 소유한다. 원문 2: 초대 버튼과 먼 확인 다이얼로그·알림 전송 → `InviteButton`이 행동과 구현을 연결한다. 상세가 주된 흐름을 가릴 때만 감싸며 wrapper 자체를 목표로 삼지 않는다.

**8. 기술 종류보다 변경 책임으로 훅 나누기** 원문 두 관점: 모든 URL 파라미터를 다루는 `usePageState` → `useCardIdQueryParam` 등 필요한 책임에만 의존한다. 이해할 맥락과 수정 범위를 줄이려는 선택이다. 함께 바뀌는 파라미터는 유지하고 필드마다·기술 층마다 쪼개지 않는다. 분리만으로 리렌더 감소를 보장하지 않는다.

## 계약과 부수효과

**9. 이름에 추가 책임 드러내기** 원문: 기반 HTTP 라이브러리와 인증 wrapper가 모두 `http` → `httpService.getWithAuth`처럼 토큰 추가 책임을 드러낸다. 호출부가 동작을 잘못 예상할 때 구분하며 이미 명시된 인증 interceptor 계약은 유지한다.

**10. 비슷한 역할의 반환 계약 맞추기** 원문 1: Query 객체를 반환하는 `useUser`와 데이터만 반환하는 `useServerTime` → 비슷한 조회 훅의 결과 형태를 맞춘다. 원문 2: boolean 검증과 `{ ok, reason }` 검증 혼용 → 공통 계약과 `.ok` 분기로 실패 객체의 truthy 오류를 막는다. 의도적인 데이터 전용 역할은 구분해 유지할 수 있다.

```ts
// 각색 전: 실패 객체도 truthy
if (validateSelection(selection)) proceed();
// 각색 후: 검증 결과 계약을 명시
type Validation = { ok: true } | { ok: false; reason: string };
const result: Validation = validateSelection(selection);
if (result.ok) proceed();
```

**11. 숨은 부수효과를 호출 의도와 연결하기** 원문: `fetchBalance` 안의 암시적 `logging.log` 때문에 로그 실패도 조회 실패 → 조회와 로그를 분리해 필요한 경로에서 명시적으로 조합한다. 기록 시점·실패 영향·retry/refetch 중복을 결정하되 기존 필수 분석·관측 로그나 인증 정책을 임의로 삭제·이동하지 않는다.

## 함께 바뀌는 코드

**12. 변경·삭제 관계가 있는 파일 가까이 두기** 원문: 컴포넌트·훅·상수별로 흩어진 도메인 파일 → 관련 파일을 모아 변경·삭제 누락을 줄인다. 실제 함께 바뀌는 관계에 적용하며 공용 책임은 공용으로 유지한다. 특정 폴더명이나 전체 이동을 강제하지 않는다.

**13. 같은 의미의 값 함께 변경되게 연결하기** 원문: 애니메이션 완료 대기인 `delay(300)`는 애니메이션 시간 변경 시 함께 수정해야 한다. 각색: 같은 전환의 별도 `duration: 240`·`delay(240)` → 모두 `PANEL_TRANSITION_MS` 참조. 숫자가 같아도 의미·단위·완료 조건이 다르면 공유하지 않는다.

**14. 검증이 함께 바뀌는 단위 선택하기** 원문은 두 선택지다. 이름·이메일의 독립 검증·재사용은 필드 단위, 필드 간 의존·단계별 입력은 폼 단위로 관리한다. 각색: `validateTitle(title)`과 교차 필드의 `validateDateRange({ start, end })`. 모두 중앙화·개별화하지 않으며 React Hook Form·Zod 설치를 요구하지 않는다.

## 의존성과 재사용

**15. 작은 중복으로 독립 변경 허용하기** 원문: 동의 로그·닫기를 모은 `useBottomSheet` → 페이지별 문구·이미지·로그·닫기 변화가 다르면 정책을 분리하거나 중복을 허용한다. 공통 `Sheet` 표현과 페이지 콜백·콘텐츠를 조합할 수 있다. 같은 규칙으로 함께 바뀌는 부분은 공유한다.

**16. 전달만 하는 중간 계층 줄이기** 원문: `ItemEditModal → Body → List`로 추천 목록·확인 콜백 전달 → 부모가 목록을 구성하고 Body는 children 배치. 각색: `<Body items={items} onSelect={select} />` → `<Body><List items={items} onSelect={select} /></Body>`. composition을 먼저 검토하고 깊고 복잡한 공유가 남을 때 Context를 고려한다. 의미 있는 props 계약은 유지한다.

## 구현 시 지킬 경계

구조 개선으로 기존 정책을 덮어쓰지 않는다. Orval 생성 HTTP·타입·훅·키를 복제하지 않고 필수 로그를 유지한다. 호출 계약·실행 순서·오류 처리·생명주기와 사용자 동작을 보존한다. 이벤트 API 예외 처리와 렌더 조회의 Error Boundary·Suspense를 유지하고 단순 상태·조건·작은 핸들러는 그 자리에 둘 수 있다. 테스트는 중요한 불변식과 회귀 위험으로 선정하며 구조 변경만으로 광범위한 검증을 추가하지 않는다.
