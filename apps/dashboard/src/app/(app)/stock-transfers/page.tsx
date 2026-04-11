'use client';

import { App, Button, Empty, Select, Spin, Table, Tag, Tooltip } from 'antd';
import {
  CheckCircle,
  Clock,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useShop } from '@/contexts/ShopContext';
import { EmptyState } from '@/components/EmptyState/EmptyState';

type TransferItem = {
  id: string;
  barcode: string;
  productName: string;
  variantName: string;
  quantity: number;
};

type TransferRequest = {
  id: string;
  fromShopCode: string;
  toShopCode: string;
  fromShop: { name: string; shopCode: string };
  toShop: { name: string; shopCode: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  note: string | null;
  createdById: string | null;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransferItem[];
};

const statusConfig = {
  PENDING: { color: 'orange', icon: Clock, label: 'Pending' },
  APPROVED: { color: 'blue', icon: CheckCircle, label: 'Approved' },
  REJECTED: { color: 'red', icon: XCircle, label: 'Rejected' },
  FULFILLED: { color: 'green', icon: PackageCheck, label: 'Fulfilled' },
} as const;

export default function StockTransfersPage() {
  const { message } = App.useApp();
  const { effectiveShopCode, shops } = useShop();

  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const currentShop = shops.find((s) => s.shopCode === effectiveShopCode);

  const fetchRequests = useCallback(async () => {
    if (!effectiveShopCode) return;
    setLoading(true);
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await apiFetch(`/stock-transfers${qs}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      message.error('Failed to load transfer requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveShopCode, statusFilter, message]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    id: string,
    action: 'approve' | 'reject' | 'fulfill',
  ) => {
    setActionBusy(id);
    try {
      const res = await apiFetch(`/stock-transfers/${id}/${action}`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body?.message === 'string'
            ? body.message
            : `Failed to ${action}`,
        );
      }
      message.success(
        action === 'approve'
          ? 'Request approved!'
          : action === 'reject'
            ? 'Request rejected.'
            : 'Transfer fulfilled! Stock has been updated. ✅',
      );
      fetchRequests();
    } catch (err: any) {
      message.error(err?.message || `Failed to ${action}`);
    } finally {
      setActionBusy(null);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v: string) =>
        new Date(v).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      title: 'From',
      dataIndex: 'fromShop',
      key: 'fromShop',
      render: (shop: TransferRequest['fromShop']) => (
        <span className="font-medium">{shop.name}</span>
      ),
    },
    {
      title: 'To',
      dataIndex: 'toShop',
      key: 'toShop',
      render: (shop: TransferRequest['toShop']) => (
        <span className="font-medium">{shop.name}</span>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      render: (items: TransferItem[]) => (
        <Tooltip
          title={items
            .map((i) => `${i.productName} (${i.variantName}) × ${i.quantity}`)
            .join('\n')}
        >
          <span className="cursor-help font-medium">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: TransferRequest['status']) => {
        const cfg = statusConfig[status];
        const Icon = cfg.icon;
        return (
          <Tag
            color={cfg.color}
            className="flex w-fit items-center gap-1.5 px-2 py-0.5"
          >
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (v: string | null) => (
        <span className="text-[var(--text-muted)]">{v || '-'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: TransferRequest) => {
        const busy = actionBusy === record.id;

        if (record.status === 'PENDING') {
          return (
            <div className="flex gap-2">
              <Button
                size="small"
                type="primary"
                loading={busy}
                onClick={() => handleAction(record.id, 'approve')}
                style={{
                  backgroundColor: 'var(--ochre-600)',
                  borderColor: 'var(--ochre-600)',
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                loading={busy}
                onClick={() => handleAction(record.id, 'reject')}
              >
                Reject
              </Button>
            </div>
          );
        }

        if (record.status === 'APPROVED') {
          return (
            <Button
              size="small"
              type="primary"
              loading={busy}
              icon={<Truck className="h-3.5 w-3.5" />}
              onClick={() => handleAction(record.id, 'fulfill')}
              style={{
                backgroundColor: 'var(--ochre-600)',
                borderColor: 'var(--ochre-600)',
              }}
            >
              Fulfill & Ship
            </Button>
          );
        }

        return <span className="text-xs text-[var(--text-muted)]">-</span>;
      },
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Stock Transfers
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {currentShop
              ? `Viewing transfers for ${currentShop.name}`
              : 'Manage stock transfer requests between shops and factory'}
          </p>
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'PENDING', label: '🕐 Pending' },
            { value: 'APPROVED', label: '✅ Approved' },
            { value: 'REJECTED', label: '❌ Rejected' },
            { value: 'FULFILLED', label: '📦 Fulfilled' },
          ]}
        />
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          message="No transfer requests found"
          description="Stock transfer requests between shops and factory will appear here once created."
          icon={<Truck size={48} />}
        />
      ) : (
        <Table
          dataSource={requests}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 700 }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="space-y-1 pl-4">
                {record.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 text-sm"
                  >
                    <span className="font-medium text-[var(--text-primary)]">
                      {item.productName}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {item.variantName}
                    </span>
                    <span className="font-mono text-xs text-[var(--bistre-400)]">
                      {item.barcode.slice(-8)}
                    </span>
                    <span className="font-semibold">× {item.quantity}</span>
                  </div>
                ))}
              </div>
            ),
          }}
        />
      )}
    </div>
  );
}
