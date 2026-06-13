"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import styles from "./VariantThumb.module.css";

type Props = {
  imageUrl?: string | null;
  label?: string;
};

export function VariantThumb({ imageUrl, label = "Product" }: Props) {
  const [errored, setErrored] = useState(false);
  const url = (imageUrl ?? "").trim();
  const showImage = url && !errored;

  return (
    <div className={styles.wrap} title={label}>
      {showImage ? (
        <img
          src={url}
          alt={label}
          className={styles.img}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
        />
      ) : (
        <ImageOff className={styles.placeholder} aria-hidden strokeWidth={1.5} />
      )}
    </div>
  );
}
