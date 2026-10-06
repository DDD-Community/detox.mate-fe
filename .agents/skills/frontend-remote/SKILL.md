---
name: frontend-remote
description: DetoxMate FE의 remote 로직, API 조회·변경 훅, 서버 상태와 캐시를 구현하거나 리뷰할 때 적용한다. Orval React Query 생성물 재사용과 작은 도메인 조합 계층, 로그인·로그아웃 경계 및 요청 후 캐시 처리를 다룬다.
---

# Frontend Remote

Orval이 HTTP·타입·Query 연결을 생성하고, 작은 remote 조합 계층은 앱 정책만 더한다. React Query가 서버 상태를 관리하며 화면은 데이터 표시와 사용자 액션을 연결한다.

## 적용 범위와 현행 확인

- `orval.config.ts`, 설치된 Orval/Query 버전, 해당 생성물·mutator·호출부·Provider를 먼저 읽는다. 의존성 설치만으로 Query 적용 완료를 판단하지 않고, 과거 파일 형태를 전제하지 않는다.
- 구현·수정은 요청한 기능과 실행에 필요한 기반만 연결한다. 리뷰는 부족한 기반과 수정안을 설명하고 코드·설정·의존성을 변경하지 않는다. 스킬 생성 자체는 앱 이전이 아니다.
- 모든 호출부 변경마다 Orval 설정 전환·전체 재생성·공통 인프라 확장을 요구하지 않는다. 기존 생성물이 충분하면 그대로 조합한다. 폴더명이나 파일 배치를 강제하지 않는다.

## Orval 생성물과 remote의 책임

- Query 생성 방향은 `client: 'react-query'`, `httpClient: 'axios'`, 설치된 TanStack Query와 호환되는 query v5다. 필요한 query·Suspense·mutation 생성 옵션은 설치 버전에서 확인한다.
- 생성된 HTTP 함수·DTO·조회/mutation 훅·query key/options를 재사용한다. 같은 API의 URL·응답 타입·queryFn·훅·key/options를 별도 수동 구현하지 않는다. 생성 파일을 직접 편집하지 않는다.
- remote wrapper는 도메인별 조합·select, freshness와 관련 캐시 후처리만 더한다. generated options를 기반으로 조합하고 이미 있는 기능을 한 겹 더 복제하지 않는다.
- 기존 Axios factory와 React Query 생성 export 형태는 다를 수 있다. 실제 함수명·인자·반환값·옵션 override·모델 import를 확인하고 호출부를 연결한다. 아직 생성되지 않은 훅 이름을 가정하지 않는다.
- 기존 transformer와 `customAxios`/`friendAxios`의 인증 헤더·401 갱신·오류 정규화·재시도 정책을 보존한다. 생성 오류 타입도 mutator가 실제 던지는 오류와 맞춘다.
- 생성이 필요하면 요청 범위의 tag/operation과 출력 경로를 선택한다. 점진 이전 시 기존 출력과 schemas를 분리하는 등 `clean`이 아직 사용 중인 생성물을 지우지 않게 한다.
- 공식 문서의 예제보다 설치 버전의 타입과 실제 생성 결과를 우선한다. 오래된 positional Query API나 설치 버전보다 새로운 생성 옵션을 그대로 복사하지 않는다.

## Query key와 사용 범위

- 경로 segment로 나뉜 key를 생성하도록 기존 `output.override.query` 설정에 `shouldSplitQueryKey: true`를 사용한다. 설정 변경이 필요하면 기존 Query 옵션을 유지하고 해당 tag/operation만 재생성한다. 생성 파일을 직접 고치지 않는다.
- key의 출처는 Orval 생성물 하나로 유지한다. 결과를 바꾸는 path/query parameter를 생성 함수에 전달하고, key literal·수동 key registry·key를 다시 만드는 wrapper를 작성하지 않는다. generated options를 그대로 쓰는 무의미한 alias도 추가하지 않는다.
- 렌더 GET과 prefetch는 generated options 전체를 재사용한다. 단일 캐시의 `getQueryData`·`setQueryData`·`getQueryState`와 단일 query를 찾거나 reset/refetch/invalidate/cancel/remove/isFetching하는 작업은 같은 options의 `queryKey`를 사용한다.
- 단일 query를 대상으로 하는 filter에는 `exact: true`를 지정한다. `getQueryData`·`setQueryData`·`getQueryState`는 key로 정확히 조회하므로 존재하지 않는 `exact` 옵션을 추가하지 않는다.
- generated options의 `DataTag`가 보존되도록 key 타입을 `QueryKey`·`string[]` 등으로 넓히지 않고, 캐시 API에 수동 DTO generic을 붙여 응답 타입 추론을 대체하지 않는다.
- 관련 query 그룹을 의도적으로 함께 처리할 때는 여러 endpoint나 parameter 변형을 포함할 수 있다. generated key getter로 얻은 prefix를 사용하고, getter가 허용할 때만 parameter를 생략한다. 예를 들어 `getSearchByEmailQueryKey()`로 검색 그룹을 갱신하며, 실제로 관련된 그룹만 선택한다.
- split key에서 친구 목록 key `['friends']`는 친구 도메인의 root이기도 하다. 목록 하나만 갱신하려면 목록 options의 key와 `exact: true`를 사용하며, prefix로 처리하면 검색·요청 등 하위 query까지 포함된다.
- `mutationKey`는 mutation의 식별·기본값을 위한 별도 key이며 GET 응답 캐시의 `queryKey`로 사용하지 않는다.

```ts
const options = getSearchByEmailQueryOptions({ email });
await queryClient.prefetchQuery(options);
const cached = queryClient.getQueryData(options.queryKey);
await queryClient.invalidateQueries({ queryKey: options.queryKey, exact: true });
```

## 서버 상태와 캐시

- 실행 중 안정적인 동일 QueryClient와 필요한 상위 Provider를 사용한다. 렌더마다 client를 만들지 않는다. 이미 있는 provider/client를 재사용한다.
- 서버 응답을 `useState`/Zustand에 이중 저장해 수동 동기화하지 않는다. 검색어·선택창·입력 등 화면 로컬 상태는 그대로 둔다.
- 이 앱은 한 번에 한 계정만 활성화한다. generated key의 path/query parameter를 그대로 사용하며 인증 userId·version·scope·세대 값을 추가하지 않는다. token을 key나 cache에 넣지 않는다.
- 조회·prefetch·`setQueryData`·invalidation은 동일한 generated key/options를 사용한다. 로그인·로그아웃 경계에서 캐시를 비우고, 일반 액션은 관련 query만 갱신한다.
- 기본값을 의미 없이 재지정하지 않는다. `staleTime`/`gcTime` 전역 숫자를 임의로 정하지 않고 제품의 freshness 요구가 있는 query에만 정책을 더한다.
- AppState·onlineManager·캐시 영구 저장·Devtools·새 인증 store를 공통 선행 조건으로 만들지 않는다. 앱 복귀와 화면 focus를 구분하고, 초기 조회와 무조건 focus refetch가 중복되지 않게 한다.

## 렌더 조회와 병렬성

- 화면 데이터 GET은 생성 Suspense 훅 또는 생성 options를 사용하는 Suspense 조회로 연결한다. 조회 자식·Error Boundary·로딩 fallback·재시도 reset은 [frontend-component](../frontend-component/SKILL.md)의 기준을 적용한다.
- Suspense 훅은 `enabled`/`skipToken`으로 비활성화할 수 없다. 인증 복원과 필수 parameter가 준비된 뒤 조회 자식을 mount한다.
- 동일 컴포넌트의 연속 `useSuspenseQuery`는 직렬 waterfall을 만든다. 함께 표시할 독립 조회는 생성 options와 `useSuspenseQueries` 등을 사용해 실제 병렬로 시작한다.
- 독립적으로 실패·복구할 영역은 경계를 유지하면서 생성 options를 함께 prefetch하는 등 병렬 시작을 구성한다. 경계나 컴포넌트 분리만으로 병렬성을 보장했다고 하지 않는다.
- queryFn 실패를 성공값으로 바꾸지 않는다. 캐시가 있는 갱신 실패의 표시 정책과 이벤트에서 시작한 GET의 예외 처리는 frontend-component 기준을 따른다.

## Mutation과 후처리

- 생성 mutation 훅을 조합하고 이벤트에서 `mutateAsync`를 `try/catch`로 처리한다. handler 또는 위임 hook 한 곳이 실패 안내를 책임지고 pending 중 중복 실행을 막는다.
- 캐시를 직접 후처리하는 mutation은 캐시를 비운 뒤 늦은 응답이 캐시를 다시 만들거나 갱신하지 않도록 시작 당시 Query 인스턴스의 소유권을 필요한 지점에서 확인한다. 성공 후 관련 캐시를 반영하고 필요한 query를 invalidate하며, 갱신 완료가 UX 조건일 때만 invalidate의 완료를 기다린다.
- 확정된 쓰기와 후속 재조회 결과를 구분한다. 재조회 실패를 쓰기 실패로 안내하거나 같은 쓰기를 다시 실행하지 않는다. generated callback을 override할 때 필요한 기존 후처리를 누락하지 않는다.
- optimistic update는 즉각 반영이 필요한 경우에만 선택한다. 사용한다면 실패 rollback 또는 서버 reconciliation을 마련한다.
- Query retry·Axios retry 큐·전역 toast·화면 안내가 겹치지 않게 재시도와 안내의 책임을 정한다. 쓰기 자동 retry는 중복 처리 안전성 등 명시적인 근거가 있을 때만 허용한다.

## 취소와 사용자 전환

- Query 관찰·캐시 취소와 실제 HTTP abort를 구분한다. 생성 signal 인자와 mutator의 Axios 전달 계약을 확인하고, 취소를 일반 API 오류 toast/log로 처리하지 않는다.
- Suspense query에는 취소 제한이 있고 mutation은 `cancelQueries`나 캐시 삭제로 취소되지 않는다. 취소만으로 이전 사용자 응답이 차단됐다고 주장하지 않는다.
- 캐시를 직접 후처리해야 하는 mutation은 기존 인증·API 경로의 중앙 취소와 Query 소유권 확인으로 늦은 캐시 후처리를 막는다. 이를 위해 인증 scope·session·세대 store나 bootstrap을 선행 조건으로 추가하거나 같은 구조를 다른 이름으로 도입하지 않는다.
- 늦은 정리 콜백이 새 사용자 캐시를 지우지 않게 한다. auth·Query·API 연결에서 순환 의존을 만들지 않는다.

## 검증과 참고

선택할 테스트는 [frontend-testing](../frontend-testing/SKILL.md)을 따른다. 중요한 경합·격리·실패 후 복구 불변식만 검증하고 라이브러리 계약·생성 설정을 복제하는 테스트를 강제하지 않는다. 실제 실행 결과와 미검증 범위를 구분해 보고한다.

저장소 참고: `src/api/client.ts`, `src/api/mutator.ts`, `src/api/friendMutator.ts`, `src/api/transformer.ts`, `src/api/auth.ts`, `app/_layout.tsx`. 로컬 계획 문서 없이도 위 규칙을 적용할 수 있어야 한다.

공식 근거:

- [Orval React Query](https://orval.dev/docs/guides/react-query/), [Orval Output](https://orval.dev/docs/reference/configuration/output/)
- [Query Keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys), [Mutation Invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations)
- [Parallel Queries](https://tanstack.com/query/v5/docs/framework/react/guides/parallel-queries), [Query Cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation)
