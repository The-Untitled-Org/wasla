import type { ComponentType, CSSProperties, ReactNode } from 'react';
import LogoLoopImplementation from './LogoLoop.jsx';

export interface LogoLoopItem {
  src: string;
  alt?: string;
  name?: string;
}

export interface LogoLoopProps {
  logos: LogoLoopItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  renderItem?: (item: LogoLoopItem, key: string) => ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const LogoLoop = LogoLoopImplementation as ComponentType<LogoLoopProps>;

export default LogoLoop;
