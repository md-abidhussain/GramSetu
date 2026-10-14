import React from 'react';

/**
 * Setu means bridge, so the mark is one: a deck carried on a shallow arch.
 *
 * The arch is wide and shallow rather than a semicircle. Drawn tall it reads as
 * an archway or a table, and two narrow arches read as the letter m. This shape
 * still says bridge at the 20px the footer uses.
 */
const Logo = ({ className = 'h-7 w-7', onDark = false, title }) => {
  const structure = onDark ? '#ffffff' : '#143c6f';
  const deck = onDark ? '#ffffff' : '#c26400';

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      <path
        d="M5 28V25Q16 14 27 25v3"
        fill="none"
        stroke={structure}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <rect x="1.5" y="11" width="29" height="3.3" rx="1.65" fill={deck} />
    </svg>
  );
};

export default Logo;
