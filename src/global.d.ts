declare module '*.css' {
  const content: {
      [className: string]: string;
      (...names: Array<string | null | undefined | {[key: string]: string | boolean}>): string;
  };
  export default content;
}