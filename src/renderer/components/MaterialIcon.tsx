import type { CSSProperties } from 'react';

type MaterialIconProps = {
  name: string;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
};

export function MaterialIcon({
  name,
  className,
  style,
  'aria-hidden': ariaHidden = true,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ''}`}
      style={style}
      aria-hidden={ariaHidden}
    >
      {name}
    </span>
  );
}
