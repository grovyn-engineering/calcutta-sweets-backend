'use client';

import { useState } from 'react';
import thumbStyles from '@/lib/tabulatorVariantThumb.module.css';

function PlaceholderGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      <line x1="3" x2="21" y1="3" y2="21" />
    </svg>
  );
}

export type ProductLineThumbProps = {
  imageUrl?: string | null;
  alt: string;
  variant?: 'table' | 'fill';
};

export function ProductLineThumb({
  imageUrl,
  alt,
  variant = 'fill',
}: ProductLineThumbProps) {
  const [broken, setBroken] = useState(false);
  const url = (imageUrl ?? '').trim();
  const showImg = Boolean(url) && !broken;
  const label = alt.trim() || 'Product';

  const wrapClass =
    variant === 'table' ? thumbStyles.wrap : thumbStyles.wrapAdaptive;

  return (
    <div
      className={wrapClass}
      role="img"
      aria-label={showImg ? label : `No image for ${label}`}
      title={label}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- variant images are arbitrary remote URLs from the API
        <img
          src={url}
          alt={label}
          className={thumbStyles.img}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <PlaceholderGlyph className={thumbStyles.placeholderIcon} />
      )}
    </div>
  );
}
