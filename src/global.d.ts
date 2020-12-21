declare module '*.css' {
  const content: {
      [className: string]: string;
      (...names: Array<string | null | undefined | {[key: string]: string | boolean}>): string;
  };
  export default content;
}

declare module '*.svg' {
  import React = require('react');
  declare interface SvgrComponent extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}
  // export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  // const src: string;
  const content: SvgrComponent
  export default content;
}