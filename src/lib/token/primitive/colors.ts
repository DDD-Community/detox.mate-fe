type ColorScale = Readonly<Record<string | number, string>>;

type FlatKey<Prefix extends string, Scale extends ColorScale> = {
  [K in keyof Scale]: `${Prefix}${K & (string | number)}`;
}[keyof Scale];

const green = {
  50: '#eff3f1',
  75: '#bbcfc6',
  100: '#9fbbae',
  200: '#769d8c',
  300: '#5a8974',
  400: '#3f6051',
  500: '#375447',
} as const;

const brown = {
  50: '#f9f8f4',
  100: '#f1eacf',
  500: '#ba7517',
  600: '#7a5712',
  900: '#56524a',
} as const;

const level = {
  100: '#c1ff1c',
  200: '#6EE429',
  300: '#28CD25',
  400: '#21B653',
  500: '#1d9e75',
  600: '#007542',
} as const;

const gray = {
  50: '#f0f1f3',
  100: '#d0d3d9',
  200: '#b9bdc7',
  300: '#989fad',
  400: '#858d9d',
  500: '#667085',
  600: '#5d6679',
  700: '#48505e',
  800: '#383e49',
  900: '#2b2f38',
} as const;

export type GreenShade = keyof typeof green;

export const PRIMARY_GREEN_SHADES = [300, 400, 500] as const satisfies ReadonlyArray<GreenShade>;

export type PrimaryGreenShade = (typeof PRIMARY_GREEN_SHADES)[number];

export type GreenColorScheme = {
  [K in PrimaryGreenShade]: `green${K}`;
}[PrimaryGreenShade];

export const PRIMARY_GREEN_COLOR_MAP: Record<GreenColorScheme, string> = Object.fromEntries(
  PRIMARY_GREEN_SHADES.map((shade) => [`green${shade}` as const, green[shade]]),
) as Record<GreenColorScheme, string>;

export type GreenSchemeKey = FlatKey<'green', typeof green>;
export type BrownSchemeKey = FlatKey<'brown', typeof brown>;
export type LevelSchemeKey = FlatKey<'level', typeof level>;
export type GraySchemeKey = FlatKey<'gray', typeof gray>;

export type FlatPrimitiveColorScheme = GreenSchemeKey | BrownSchemeKey | LevelSchemeKey | GraySchemeKey;

const FLAT_RESOLVER = [
  { prefix: 'gray', scale: gray },
  { prefix: 'green', scale: green },
  { prefix: 'brown', scale: brown },
  { prefix: 'level', scale: level },
] as const;

export function getFlatPrimitiveColor(scheme: FlatPrimitiveColorScheme): string {
  for (const { prefix, scale } of FLAT_RESOLVER) {
    if (scheme.startsWith(prefix)) {
      const k = Number(scheme.slice(prefix.length)) as keyof typeof scale;
      const value = (scale as ColorScale)[k];
      if (value === undefined) {
        throw new Error(
          `getFlatPrimitiveColor: no shade "${k}" in "${prefix}" (scheme: ${scheme})`,
        );
      }
      return value;
    }
  }
  const invalid: string = scheme;
  throw new Error(`getFlatPrimitiveColor: invalid scheme ${invalid}`);
}

const system = {
  blue: {
    opacity100: '#508EBF',
    opacity40: '#508EBF66',
    opacity10: '#508EBF1A',
  },
  green: {
    opacity100: '#3A8F46',
    opacity40: '#3A8F4666',
    opacity10: '#3A8F461A',
  },
  orange: {
    opacity100: '#E39433',
    opacity40: '#E3943366',
    opacity10: '#E394331A',
  },
  red: {
    opacity100: '#D5441B',
    opacity40: '#D5441B66',
    opacity10: '#D5441B1A',
  },
} as const;

export const primitiveColors = {
  green,
  brown,
  level,
  gray,
  system,
} as const;
