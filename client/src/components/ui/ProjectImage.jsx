import React, { useState, useEffect } from 'react';
import { Eye, ImageOff } from 'lucide-react';

// Legacy placeholder IDs from initial mock seeding (pizza, church, generic stock)
const UNRELATED_LEGACY_PATTERNS = [
  'photo-1515162305285', // church
  'photo-1544982503',    // pizza
  'photo-1580582932',
  'photo-1588072432',
  'photo-1542013936',
  'photo-1584267326',
  'photo-1586528116',
  'photo-1519494026',
  'photo-1545624446'
];

/**
 * Renders an infrastructure project image with fallback placeholder.
 * If the image URL is missing, falsy, or fails to load, renders a clean
 * "Image not uploaded" placeholder. Never displays unrelated images or broken icons.
 */
export const ProjectImage = ({
  src,
  alt = 'Project infrastructure image',
  className = 'h-48',
  label = null
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const isLegacyUnrelated = typeof src === 'string' && UNRELATED_LEGACY_PATTERNS.some((pat) => src.includes(pat));

  if (!src || hasError || isLegacyUnrelated) {
    return (
      <div
        className={`w-full ${className} rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-300 p-4 text-center transition-colors`}
      >
        <ImageOff className="h-7 w-7 text-slate-400 mb-1.5" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-700">Image not uploaded</span>
        <span className="text-[11px] text-slate-500 mt-0.5">No photographic proof registered</span>
        {label && <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{label}</span>}
      </div>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      aria-label={`View full resolution image: ${alt}`}
      className={`block relative ${className} rounded-xl overflow-hidden border border-slate-200 hover:opacity-95 transition-opacity group`}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <span className="absolute bottom-2 right-2 bg-dark-900/70 text-white font-semibold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-xs opacity-90 group-hover:opacity-100 transition-opacity">
        <Eye className="h-3 w-3" aria-hidden="true" /> Zoom
      </span>
    </a>
  );
};

export default ProjectImage;
