"use client";

import { useState, type ImgHTMLAttributes } from "react";

/**
 * An <img> that never shows the browser's broken-image icon: if the shop photo
 * can't load (the admin is slow or the photo was removed), it swaps to the
 * fallback picture, or hides itself when there is none.
 */
export function SafeImg({ src, fallback, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src?: string | null; fallback?: string | null }) {
  const [stage, setStage] = useState(0); // 0 = src, 1 = fallback, 2 = hidden
  const fail = () => setStage((s) => (s === 0 && fallback && fallback !== src ? 1 : 2));
  const url = stage === 0 ? src : stage === 1 ? fallback : null;
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      key={url}
      {...rest}
      src={url}
      onError={fail}
      ref={(el) => {
        // the error can fire before hydration, so check once on mount too
        if (el?.complete && el.naturalWidth === 0 && el.currentSrc) fail();
      }}
    />
  );
}
