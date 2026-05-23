import { defineConfig } from 'orval';

const apiDocsUrl = process.env.API_DOCS_URL ?? 'https://api-dev.detoxmate.co.kr/v3/api-docs';

export default defineConfig({
  detoxmate: {
    input: {
      target: apiDocsUrl,
      override: {
        transformer: 'src/api/transformer.ts',
      },
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
