"use client";

import Link from "next/link";
import { useState } from "react";
import { App, Button, Input, Modal } from "antd";
import type { Shop } from "@calcutta/database";
import { ChevronRight, MapPin, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ShopPlaceholder from "@/assets/shop.jpeg";
import styles from "./ShopCard.module.css";

type ShopCardProps = {
  shop: Shop;
  onDeleted?: () => void;
};

export default function ShopCard({ shop, onDeleted }: ShopCardProps) {
  const { message } = App.useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const imgSrc = shop.logoUrl?.trim() || ShopPlaceholder.src;
  const address = shop.address?.trim();
  const label = [shop.name, shop.shopCode].filter(Boolean).join(" · ");

  const canConfirmDelete =
    confirmText.trim().toUpperCase() === shop.shopCode.trim().toUpperCase();

  const handleDelete = async () => {
    if (!canConfirmDelete) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/shops/${encodeURIComponent(shop.id)}`, {
        method: "DELETE",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof payload?.message === "string"
            ? payload.message
            : "Could not delete this shop.",
        );
        return;
      }
      message.success(`Shop ${shop.shopCode} was removed.`);
      setConfirmOpen(false);
      setConfirmText("");
      onDeleted?.();
    } catch {
      message.error("Network error while deleting the shop.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {onDeleted && !shop.isFactory ? (
        <>
          <button
            type="button"
            className={styles.deleteBtn}
            aria-label={`Delete shop ${shop.shopCode}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmText("");
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
          <Modal
            title="Delete shop permanently"
            open={confirmOpen}
            onCancel={() => {
              if (!deleting) {
                setConfirmOpen(false);
                setConfirmText("");
              }
            }}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                }}
                disabled={deleting}
              >
                Cancel
              </Button>,
              <Button
                key="delete"
                danger
                type="primary"
                loading={deleting}
                disabled={!canConfirmDelete}
                onClick={() => void handleDelete()}
              >
                Delete shop
              </Button>,
            ]}
          >
            <p className="mb-3 text-[var(--text-secondary)]">
              This removes the shop record, all of its products and inventory, POS
              orders, stock transfers to or from this location, role requests, and
              staff accounts assigned to{" "}
              <strong className="text-[var(--text-primary)]">{shop.shopCode}</strong>
              . Categories that are no longer used by any product are also removed.
            </p>
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
              Type the shop code <strong>{shop.shopCode}</strong> to confirm:
            </p>
            <Input
              autoComplete="off"
              placeholder={shop.shopCode}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onPressEnter={() => {
                if (canConfirmDelete && !deleting) void handleDelete();
              }}
            />
          </Modal>
        </>
      ) : null}

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
            <ChevronRight
              className={`${styles.ctaIcon} h-4 w-4`}
              strokeWidth={2.25}
              aria-hidden
            />
          </span>
        </div>
      </Link>
    </div>
  );
}
