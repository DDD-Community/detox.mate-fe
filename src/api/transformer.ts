import type { OpenAPIObject } from 'openapi3-ts/oas30';

const removeControllerSuffix = (spec: OpenAPIObject): OpenAPIObject => {
  const rename = (tag: string) => tag.replace(/-controller$/i, '');

  if (spec.tags) {
    spec.tags = spec.tags.map((tag) => ({ ...tag, name: rename(tag.name) }));
  }

  if (spec.paths) {
    for (const pathItem of Object.values(spec.paths)) {
      for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const) {
        const operation = pathItem?.[method];
        if (operation?.tags) {
          operation.tags = operation.tags.map(rename);
        }
      }
    }
  }

  return spec;
};

export default removeControllerSuffix;
