declare module '*.otf' {
  const font: import('expo-font').FontSource;
  export default font;
}

declare module '*.ttf' {
  const asset: number;
  export default asset;
}

declare module '*.png' {
  const asset: number;
  export default asset;
}

declare module '*.jpg' {
  const asset: number;
  export default asset;
}

declare module '*.jpeg' {
  const asset: number;
  export default asset;
}
