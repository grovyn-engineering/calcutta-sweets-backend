"use client";

import { Spin } from "antd";

export type PageBootstrapLoaderProps = {
  /** Accessibility label for the loading region */
  label?: string;
};

/**
 * Lightweight full-viewport loader for session bootstrap and auth redirects.
 * Avoids the table-style shimmer used for real content placeholders.
 */
export function PageBootstrapLoader({ label = "Loading" }: PageBootstrapLoaderProps) {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-[var(--linen)] px-4"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Spin size="large" />
    </div>
  );
}
