declare module 'react-world-flags' {
  import { ComponentType } from 'react';

  interface FlagProps {
    code: string;
    width?: number | string;
    height?: number | string;
    className?: string;
    style?: React.CSSProperties;
    fallback?: React.ReactNode | string;
    alt?: string;
    title?: string;
  }

  const Flag: ComponentType<FlagProps>;
  export default Flag;
}
