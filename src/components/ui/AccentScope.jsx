import { useMemo } from 'react';
import { hexToRgbTriplet } from '../../lib/utils';

/**
 * Publishes one event's brand colour as --accent for everything inside it, so
 * `text-accent` / `bg-accent/12` resolve per event without a second theme system.
 */
export function AccentScope({ color, className, style, as: Tag = 'div', children, ...props }) {
  const scoped = useMemo(() => ({ ...style, '--accent': hexToRgbTriplet(color) }), [color, style]);
  return (
    <Tag className={className} style={scoped} {...props}>
      {children}
    </Tag>
  );
}
