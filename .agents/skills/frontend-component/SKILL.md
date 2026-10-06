---
name: frontend-component
description: DetoxMate FE 컴포넌트를 구현, 수정, 분리하거나 리뷰할 때 적용한다. 이벤트 API 예외와 Error Boundary의 Sentry 기록, 렌더 조회의 Suspense, SRP에 따른 컴포넌트 및 훅 분리를 다룬다.
---

# Frontend Component

현재 컴포넌트와 상위 트리, 데이터 조회 방식을 먼저 읽고 아래 네 영역을 적용한다. `package.json`의 의존성만으로 Query provider나 Suspense 연동이 있다고 판단하지 않는다. 구현·수정 요청에서는 필요한 범위만 연결하고, 리뷰 요청에서는 부족한 기반과 수정안을 설명하되 코드·의존성을 변경하지 않는다. 필요한 기반 연결은 요청한 컴포넌트와 그 실행에 필요한 범위로 한정하며, 관련 없는 화면의 데이터 계층을 일괄 전환하지 않는다. 스킬 작성만으로 라이브러리 설치나 프로젝트 전환이 완료됐다고 하지 않는다.

## 1. 이벤트 API 예외 처리

- 버튼·입력 등 이벤트에서 시작한 API 호출은 `await` 또는 `mutateAsync`를 `try/catch`로 처리한다. 이벤트에서 시작한 GET도 같은 규칙이다. HTTP 메서드가 아니라 실행 경로로 구분한다.
- 처리 책임은 handler 또는 위임한 hook 한 곳에 둔다. 같은 실패를 양쪽에서 다시 안내하거나 기록하지 않는다.
- 사용자 메시지는 기존 `normalizeError`와 `getUserErrorMessage`, 요청별 에러·로깅 정책을 재사용한다. interceptor의 전역 toast/log와 화면 안내가 겹치지 않게 한다. 빈 `catch`로 실패를 숨기지 않는다.
- 이벤트 API 실패는 사용자 안내와 함께 Sentry 기록 책임도 처리한다. 기존 `logError(normalizeError(error), { scope, operation })` 경로를 재사용하고, 해당 scope와 오류 유형이 `captureObservedError`의 운영 수집 정책을 통과하는지 확인한다. interceptor가 기록을 호출했다는 이유만으로 수집 완료를 가정하지 않는다. 서버·예상하지 못한 오류는 누락 없이 기록하고, 예상 가능한 사용자·도메인 오류는 요청별 정책을 따른다. 토큰·개인정보·요청 본문을 context에 넣지 않는다.
- pending 동안 중복 실행을 막고 `finally`에서 pending을 복구한다. mutation의 pending 표시는 Suspense와 별도로 관리한다.

## 2. Error Boundary와 복구

- 컴포넌트의 렌더 오류와 렌더에 필요한 GET 실패는 상위 Error Boundary가 보호하도록 한다. 먼저 기존 ancestor의 보호 범위를 확인하고, 사용자가 함께 실패를 보고 재시도할 단위에 경계를 둔다. 모든 leaf에 래퍼를 복제하지 않는다.
- Error Boundary는 일반 이벤트 handler나 effect 안에서 시작한 비동기 실패를 자동으로 잡지 않는다. 렌더 조회 실패는 suspend 가능한 데이터 계층이 렌더 중 throw하도록 연결한다. 화면 데이터 GET은 아래 Suspense 규칙에 맞춰 렌더 조회로 연결한다. 그 밖의 effect 비동기 부수효과는 자체 예외 처리 또는 명시적인 렌더 오류 전달을 사용한다.
- Error Boundary가 잡은 오류는 `componentDidCatch` 등 경계의 오류 처리 지점에서 기존 `logError`를 통해 Sentry에 기록한다. `scope: 'render'`와 `componentStack`을 전달하고 fallback 렌더 중에는 기록하지 않는다. `AppError` 등 정규화된 오류라는 이유만으로 건너뛰지 않는다. 동일 실패가 다른 계층에서 실제 수집되는 경로가 확인된 경우에만 중복 기록을 막는다.
- 에러 fallback에는 사용자 문구와 재시도 방법을 제공한다. 재시도는 경계 상태와 데이터 계층의 오류·캐시 상태를 함께 조정해 실제 재조회로 이어져야 한다. TanStack Query라면 `QueryErrorResetBoundary` 또는 `useQueryErrorResetBoundary`의 reset과 경계 reset을 연결한다. 무조건 전체 캐시를 지우지 않는다.
- `useSuspenseQuery`는 캐시 데이터가 있으면 백그라운드 조회 오류를 기본적으로 throw하지 않는다. 기존 데이터 유지와 오류 안내 정책을 결정하고, 경계에 보내기로 했다면 재조회가 끝난 뒤 `error && !isFetching` 조건에서 명시적으로 throw한다.

## 3. Suspense와 렌더 조회

- 렌더에 필요한 GET은 가능한 한 `useSuspenseQuery` 또는 생성된 Suspense 조회 훅을 우선 사용하고, 초기 로딩은 Suspense fallback에 맡긴다. 조회는 경계 아래 자식에서 호출하고, 별도 `loading` state나 `isLoading` 분기로 초기 로딩을 중복 관리하지 않는다. Suspense를 적용하기 어려운 구체적인 이유가 있을 때만 일반 조회 훅과 명시적 로딩 처리를 사용한다. 단순 `useEffect + fetch`를 Suspense로 감싸는 것만으로 로딩이 연동되지 않는다.
- 배치는 **Error Boundary → Suspense → 조회 자식**으로 한다. 같은 함수에서 조회 hook을 먼저 호출하고 반환 JSX 안에 경계를 두면 그 hook은 해당 경계의 보호를 받지 못한다.
- 같은 Suspense 영역에서 필요한 독립 query가 여러 개라면 직렬 요청(waterfall)이 생기지 않도록 병렬로 시작한다. 동일 컴포넌트에서 `useSuspenseQuery`를 연속 호출하면 첫 조회가 suspend하면서 뒤 조회의 시작이 늦어진다. 함께 표시할 독립 조회는 생성 query options와 `useSuspenseQueries`를 우선 사용한다. 영역별 경계를 유지해야 한다면 공통 상위에서 독립 조회를 함께 prefetch하는 등 실제 병렬 시작을 구성하고, 경계나 컴포넌트 분리만으로 병렬성을 보장했다고 판단하지 않는다. 앞 조회 결과가 다음 요청의 입력인 실제 의존 query만 순차 실행한다. 캐시가 없는 초기 진입에서 요청 시작 시점을 확인한다. query options와 prefetch 구성은 [frontend-remote](../frontend-remote/SKILL.md)의 기준을 따른다.
- queryFn 오류를 `try/catch`로 삼키거나 빈 배열 같은 성공값으로 바꾸지 않는다. 오류는 데이터 계층에 전달하고, 정상적인 empty 결과와 구분한다. 렌더할 때마다 새 요청 Promise를 생성하지 않는다.
- fallback은 해당 영역에 맞는 로딩 표시를 제공한다. 기존 데이터가 있는 재조회와 이벤트 mutation을 모두 초기 로딩 화면으로 바꾸지 않는다.

아래는 배치 예시다. `ErrorBoundary`는 실제 저장소 API가 아닌 추상 이름이며, 오류 fallback과 위의 재시도/reset 계약을 구현한 경계를 뜻한다. `QueryContent` 안에서 suspend 가능한 GET hook을 호출하고, 필요한 provider는 이 트리의 상위에 이미 연결되어 있어야 한다.

```tsx
<ErrorBoundary>
  <Suspense fallback={<LoadingFallback />}>
    <QueryContent />
  </Suspense>
</ErrorBoundary>
```

## 4. SRP와 컴포넌트·훅 분리

- 변경 이유와 독립적인 책임을 기준으로 작게 나눈다. 화면 조립·표시·데이터 조회·사용자 액션이 서로 독립적으로 바뀐다면 적절한 컴포넌트나 hook으로 분리한다.
- 다단계 처리, 비동기 생명주기·상태 조정, 재사용할 큰 로직은 hook으로 옮긴다. 간단한 handler, local state, 조건식·필터는 읽기 쉬우면 제자리에 둔다.
- 작은 JSX 조각을 이름만 붙여 무의미하게 분리하지 않는다. 폴더 모양이나 줄수 한도를 강제하지 않고 기존 도메인 구조를 따른다.

필요한 저장소 참고: `app/_layout.tsx`, `src/components/AppErrorBoundary/`, `src/api/errors/`, `src/api/client.ts`, `src/observability/sentry.ts`, `docs/error-handling-architecture.md`. 오류 처리를 구현·수정했다면 이벤트 catch와 boundary 각각의 수집·제외 정책 및 중복 방지를 확인한다. 로컬 logger 호출 확인과 운영 Sentry 수신 확인을 구분해 보고한다. 테스트를 선택할 때는 기존 [frontend-testing](../frontend-testing/SKILL.md) 정책을 따르고 광범위한 테스트 추가를 기본값으로 삼지 않는다.

공식 근거: [React Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary), [React Suspense](https://react.dev/reference/react/Suspense), [TanStack Query Suspense](https://tanstack.com/query/v5/docs/framework/react/guides/suspense), [TanStack Query Parallel Queries](https://tanstack.com/query/v5/docs/framework/react/guides/parallel-queries).
