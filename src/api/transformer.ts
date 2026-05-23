import type { OpenAPIObject } from 'openapi3-ts/oas30';

const isCurrentUserQueryParam = (parameter: unknown): boolean => {
  if (!parameter || typeof parameter !== 'object' || '$ref' in parameter) {
    return false;
  }

  const {
    in: location,
    name,
    schema,
  } = parameter as {
    in?: string;
    name?: string;
    schema?: { $ref?: string };
  };

  return (
    location === 'query' &&
    (name === 'currentUser' || name === 'user') &&
    schema?.$ref === '#/components/schemas/CurrentUser'
  );
};

const removeCurrentUserQueryParams = (spec: OpenAPIObject): OpenAPIObject => {
  if (!spec.paths) {
    return spec;
  }

  for (const pathItem of Object.values(spec.paths)) {
    if (!pathItem) {
      continue;
    }

    if (pathItem.parameters) {
      pathItem.parameters = pathItem.parameters.filter(
        (parameter) => !isCurrentUserQueryParam(parameter)
      );
    }

    for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const) {
      const operation = pathItem[method];
      if (operation?.parameters) {
        operation.parameters = operation.parameters.filter(
          (parameter) => !isCurrentUserQueryParam(parameter)
        );
      }
    }
  }

  return spec;
};

const removeUnusedCurrentUserSchema = (spec: OpenAPIObject): OpenAPIObject => {
  if (!spec.components?.schemas?.CurrentUser) {
    return spec;
  }

  const { CurrentUser, ...schemas } = spec.components.schemas;
  const specWithoutCurrentUser = {
    ...spec,
    components: {
      ...spec.components,
      schemas,
    },
  };

  if (!JSON.stringify(specWithoutCurrentUser).includes('#/components/schemas/CurrentUser')) {
    spec.components.schemas = schemas;
  }

  return spec;
};

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

const transformSpec = (spec: OpenAPIObject): OpenAPIObject => {
  removeControllerSuffix(spec);
  removeCurrentUserQueryParams(spec);
  removeUnusedCurrentUserSchema(spec);

  return spec;
};

export default transformSpec;
