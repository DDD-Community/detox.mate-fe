export type RootRouteConfig<TTarget extends string> = {
  defaultTarget: TTarget;
  pathTargets: Readonly<Record<string, TTarget>>;
};

const URL_PATH_PREFIX = '://';

export const ROOT_ROUTE_CONFIG = {
  defaultTarget: 'app',
  pathTargets: {
    'screen-time-analyze-test': 'screen-time-analyze-test',
  },
} as const satisfies RootRouteConfig<'app' | 'screen-time-analyze-test'>;

export type RootTarget =
  | typeof ROOT_ROUTE_CONFIG.defaultTarget
  | (typeof ROOT_ROUTE_CONFIG.pathTargets)[keyof typeof ROOT_ROUTE_CONFIG.pathTargets];

function extractPathFromUrl(url: string): string {
  const prefixIndex = url.indexOf(URL_PATH_PREFIX);

  if (prefixIndex === -1) {
    return '';
  }

  const pathWithExtras = url.slice(prefixIndex + URL_PATH_PREFIX.length);
  const path = pathWithExtras.split('?')[0]?.split('#')[0] ?? '';

  return path.replace(/^\/+|\/+$/g, '');
}

export function resolveRootTarget(url: string | null): RootTarget;
export function resolveRootTarget<TTarget extends string>(
  url: string | null,
  routeConfig: RootRouteConfig<TTarget>
): TTarget;
export function resolveRootTarget(
  url: string | null,
  routeConfig: RootRouteConfig<string> = ROOT_ROUTE_CONFIG
): string {
  if (!url) {
    return routeConfig.defaultTarget;
  }

  return routeConfig.pathTargets[extractPathFromUrl(url)] ?? routeConfig.defaultTarget;
}
