"use client";

import Link from "next/link";
import type { Shop } from "@prisma/client";
import { ChevronRight, MapPin } from "lucide-react";
import ShopPlaceholder from "@/assets/shop.jpeg";
import styles from "./ShopCard.module.css";

type ShopCardProps = {
  shop: Shop;
};

export default function ShopCard({ shop }: ShopCardProps) {
  const imgSrc = shop.logoUrl?.trim() || ShopPlaceholder.src;
  const address = shop.address?.trim();
  const label = [shop.name, shop.shopCode].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/shops/${shop.shopCode}`}
      className={styles.card}
      scroll={false}
      aria-label={`View ${label}`}
    >
      <div className={styles.media}>
        <img
          src={imgSrc}
          alt=""
          className={styles.mediaImg}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== ShopPlaceholder.src) {
              el.src = ShopPlaceholder.src;
            }
          }}
        />
      </div>

      <div className={styles.body}>
        <h2 className={styles.title} title={shop.name}>
          {shop.name}
        </h2>
        <div className={styles.codeRow}>
          <span className={styles.code} title={shop.shopCode}>
            {shop.shopCode}
          </span>
        </div>
        {address ? (
          <p className={styles.address} title={address}>
            <MapPin className={styles.addressIcon} aria-hidden />
            <span className={styles.addressText}>{address}</span>
          </p>
        ) : (
          <p className={styles.addressMuted}>No address on file</p>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.cta}>
          View inventory
          <ChevronRight className={`${styles.ctaIcon} h-4 w-4`} strokeWidth={2.25} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
