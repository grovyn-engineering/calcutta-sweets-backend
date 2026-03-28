'use client';

import { Badge, Dropdown, Spin, Typography } from 'antd';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { apiFetch, dedupeInFlight } from '@/lib/api';

import styles from './ActivityNotificationsBell.module.css';

type ActivityItem = {
  type: 'new_product' | 'new_variant' | 'low_stock';
  at: string;
  title: string;
  body: string;
  hrefHint?: string;
};

type ActivityResponse = {
  since: string;
  items: ActivityItem[];
};

function formatAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

const POLL_MS = 90_000;

export function ActivityNotificationsBell() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const json = await dedupeInFlight('GET:/notifications/activity', async () => {
        const r = await apiFetch('/notifications/activity');
        if (!r.ok) {
          return { since: '', items: [] } satisfies ActivityResponse;
        }
        return (await r.json()) as ActivityResponse;
      });
      setData(json);
    } catch {
      setData({ since: '', items: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const count = data?.items.length ?? 0;

  const dropdown = (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <Typography.Text strong>Shop activity</Typography.Text>
        <Typography.Text type="secondary" className={styles.panelSub}>
          New items in the last 24h and stock at or below minimum
        </Typography.Text>
      </div>
      {loading && !data ? (
        <div className={styles.centered}>
          <Spin size="small" />
        </div>
      ) : count === 0 ? (
        <div className={styles.empty}>No alerts or recent additions.</div>
      ) : (
        <ul className={styles.list}>
          {data!.items.map((item, i) => (
            <li key={`${item.type}-${item.at}-${i}`} className={styles.item}>
              <div className={styles.itemMeta}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemTime}>{formatAt(item.at)}</span>
              </div>
              <p className={styles.itemBody}>{item.body}</p>
              {item.hrefHint ? (
                <Link
                  href={item.hrefHint}
                  className={styles.itemLink}
                  onClick={() => setOpen(false)}
                >
                  Open
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className={styles.bellHost}>
      <Dropdown
        popupRender={() => dropdown}
        trigger={['click']}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) void load();
        }}
        placement="bottomRight"
      >
        <button
          type="button"
          className={styles.bellBtn}
          aria-label="Activity notifications"
        >
          <Badge count={loading ? 0 : count} size="small" offset={[-2, 2]}>
            <Bell className={styles.bellIcon} strokeWidth={1.75} size={20} />
          </Badge>
        </button>
      </Dropdown>
    </div>
  );
}
