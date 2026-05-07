declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  const src: string;
  export default src;
}

// html2pdf.js is loaded via dynamic import; provide a minimal ambient type
declare module "html2pdf.js" {
  function html2pdf(): {
    set(opt: object): ReturnType<typeof html2pdf>;
    from(el: HTMLElement): ReturnType<typeof html2pdf>;
    save(): Promise<void>;
  };
  export default html2pdf;
}
