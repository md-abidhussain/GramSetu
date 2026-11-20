import React from 'react';

/**
 * GramSetu Infrastructure Brand Mark.
 *
 * Minimalist geometric civil infrastructure mark representing public roadways
 * and interconnected bridges. Designed for optical clarity at sizes from 16px to 64px.
 */
const Logo = ({ className = 'h-7 w-7', onDark = false, title }) => {
  const structure = onDark ? '#F8F5F0' : '#2E231B';
  const accent = onDark ? '#E59B2A' : '#C27803';

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Roadway perspective corridor */}
      <path
        d="M6 26L11 8H21L26 26"
        stroke={structure}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bridge cross-beam / infrastructure horizon span */}
      <line
        x1="4"
        y1="14"
        x2="28"
        y2="14"
        stroke={accent}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Centerline marking / transit alignment */}
      <line
        x1="16"
        y1="17"
        x2="16"
        y2="24"
        stroke={structure}
        strokeWidth="2"
        strokeDasharray="2.5 2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;
