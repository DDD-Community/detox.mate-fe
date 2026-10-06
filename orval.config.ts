import { defineConfig } from 'orval';

const apiDocsUrl = process.env.API_DOCS_URL ?? 'https://api-dev.detoxmate.co.kr/v3/api-docs';

export default defineConfig({
  friendsQuery: {
    input: {
      target: apiDocsUrl,
      override: { transformer: 'src/api/transformer.ts' },
      filters: { mode: 'include', tags: ['friend'] },
    },
    output: {
      mode: 'single',
      target: 'src/api/query-generated/friend.ts',
      schemas: 'src/api/query-generated/model',
      formatter: 'prettier',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: { path: 'src/api/friendMutator.ts', name: 'friendAxios' },
        query: {
          version: 5,
          useQuery: true,
          useSuspenseQuery: true,
          useMutation: true,
          signal: true,
        },
      },
      clean: true,
    },
  },
  detoxmate: {
    input: {
      target: apiDocsUrl,
      override: {
        transformer: 'src/api/transformer.ts',
      },
      filters: { mode: 'exclude', tags: ['friend'] },
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/generated/model',
      client: 'axios',
      override: {
        mutator: {
          path: 'src/api/mutator.ts',
          name: 'customAxios',
        },
      },
      clean: true,
    },
  },
});
