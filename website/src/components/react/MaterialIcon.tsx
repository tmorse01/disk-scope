import type { CSSProperties } from 'react';

type MaterialIconProps = {
  name: string;
  className?: string;
  style?: CSSProperties;
  filled?: boolean;
  'aria-hidden'?: boolean;
};

/** Matches src/renderer/components/MaterialIcon.tsx */
export function MaterialIcon({
  name,
  className,
  style,
  filled = false,
  'aria-hidden': ariaHidden = true,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined${filled ? ' filled' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      aria-hidden={ariaHidden}
    >
      {name}
    </span>
  );
}
