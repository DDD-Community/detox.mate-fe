# Feature API Layer Pattern

## 디렉토리 구조

```
features/{feature-name}/
├── api/
│   ├── hooks/
│   │   └── use{Action}Mutation.ts   # API 함수 + mutation hook (colocated)
│   ├── {action}.ts                  # standalone API 함수 (hook 불필요 시)
│   └── index.ts                     # public re-exports
├── model/                           # (optional) form hooks, schema
├── ui/                              # (optional) UI components
└── index.ts                         # feature public API (re-exports api/)
```

## Mutation Hook 파일 예시

파일: `api/hooks/use{Action}Mutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { OnlineIntegrationComponents } from '@oyg/sdk/online-integration';
import { onlineIntegrationClient } from '~/shared/api/client';
import { myInfoQueries } from '~/domains/user/entities/user';

// 1. SDK 스키마에서 Request 타입 추출
export type UpdateMyInfoRequest =
  OnlineIntegrationComponents['schemas']['com.oyg.online.infra.external.member.dto.UpdateMyInfoRequest'];

// 2. API 함수는 private (export 안 함)
async function updateMyInfo(request: UpdateMyInfoRequest) {
  await onlineIntegrationClient.PUT('/v1/me', {
    body: request,
  });
}

// 3. Hook만 export — 외부에서는 hook으로만 접근
export function useUpdateMyInfoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMyInfo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myInfoQueries.all() }),
  });
}
```

## 핵심 규칙

- **타입**: `@oyg/sdk`의 `Components['schemas']`에서 추출 (직접 정의 금지)
- **API 클라이언트**: `onlineIntegrationClient` (openapi-fetch 기반 typed client) 사용
- **API 함수 private**: hook 파일 내부에 colocate하고 export하지 않음
- **Hook만 public export**: 컴포넌트에서는 반드시 hook을 통해 API 호출
- **Cache invalidation**: mutation 성공 시 관련 entity query를 `invalidateQueries`로 갱신
- **Standalone API 함수**: hook이 불필요한 경우(예: 인증 토큰 직접 전달)만 `api/{action}.ts`로 분리하여 export

## Export 체인

```
api/hooks/useXxxMutation.ts  →  api/index.ts  →  feature/index.ts
```
