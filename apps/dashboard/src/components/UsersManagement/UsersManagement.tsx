"use client";

import { App, Button, Form, Input, Modal, Select, Switch } from "antd";
import dynamic from "next/dynamic";
import { Building2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/DataTable/DataTable";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

/** Minimal Tabulator surface used here (avoids importing untyped tabulator-tables). */
type TabulatorPageable = { setPage: (page: number) => void };

import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch, getApiBaseUrl, getAuthHeaders } from "@/lib/api";

import "tabulator-tables/dist/css/tabulator.min.css";
import styles from "./UsersManagement.module.css";



const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "CASHIER", label: "Cashier" },
  { value: "STAFF", label: "Staff" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  shopCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    MANAGER: "Manager",
    CASHIER: "Cashier",
    STAFF: "Staff",
  };
  return map[role] ?? role;
}

function rolePillModifier(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "users-pill--super_admin",
    ADMIN: "users-pill--admin",
    MANAGER: "users-pill--manager",
    CASHIER: "users-pill--cashier",
    STAFF: "users-pill--staff",
  };
  return map[role] ?? "users-pill--role-default";
}

export default function UsersManagement() {
  const { message } = App.useApp();
  const baseUrl = getApiBaseUrl();
  const { effectiveShopCode, shops, shopsLoading } = useShop();
  const tableRef = useRef<TabulatorPageable | null>(null);
  const prevShopForTableRef = useRef<string | null>(null);

  const readyForTable =
    !shopsLoading && effectiveShopCode.length > 0;

  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<UserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const editHandlerRef = useRef<(row: UserRow) => void>(() => {});

  const openEdit = useCallback((row: UserRow) => {
    setEditRow(row);
    editForm.setFieldsValue({
      name: row.name ?? "",
      role: row.role,
      shopCode: row.shopCode,
      isActive: row.isActive,
      password: "",
    });
    setEditOpen(true);
  }, [editForm]);

  const generateStrongPassword = useCallback(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const len = 12;
    let pwd = "";
    for (let i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }, []);

  const handleSuggestPassword = useCallback((formType: 'create' | 'edit') => {
    const pwd = generateStrongPassword();
    if (formType === 'create') {
      createForm.setFieldsValue({ password: pwd });
    } else {
      editForm.setFieldsValue({ password: pwd });
    }
    message.success("Strong password suggested and auto-filled");
  }, [createForm, editForm, generateStrongPassword, message]);

  useEffect(() => {
    editHandlerRef.current = openEdit;
  }, [openEdit]);

  const columns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: "Email",
        field: "email",
        minWidth: 210,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = "users-email";
          span.textContent = String(cell.getValue() ?? "");
          return span;
        },
      },
      {
        title: "Name",
        field: "name",
        width: 130,
        formatter: (cell) => {
          const v = cell.getValue() as string | null;
          const span = document.createElement("span");
          if (!v) {
            span.className = "users-name-muted";
            span.textContent = "—";
          } else {
            span.textContent = v;
          }
          return span;
        },
      },
      {
        title: "Role",
        field: "role",
        width: 128,
        hozAlign: "center",
        formatter: (cell) => {
          const role = String(cell.getValue() ?? "");
          const span = document.createElement("span");
          span.className = `users-pill ${rolePillModifier(role)}`;
          span.textContent = roleLabel(role);
          return span;
        },
      },
      {
        title: "Shop",
        field: "shopCode",
        width: 108,
        hozAlign: "center",
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = "users-pill users-pill--shop";
          span.textContent = String(cell.getValue() ?? "");
          return span;
        },
      },
      {
        title: "Status",
        field: "isActive",
        width: 96,
        hozAlign: "center",
        formatter: (cell) => {
          const active = cell.getValue() as boolean;
          const span = document.createElement("span");
          span.className = `users-pill ${active ? "users-pill--active" : "users-pill--inactive"}`;
          span.textContent = active ? "Active" : "Inactive";
          return span;
        },
      },
      {
        title: "Created",
        field: "createdAt",
        width: 168,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.textContent = formatDt(cell.getValue() as string);
          return span;
        },
      },
      {
        title: "",
        field: "_actions",
        width: 100,
        hozAlign: "center",
        headerSort: false,
        resizable: false,
        formatter: (cell) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "users-edit-btn";
          btn.textContent = "Edit";
          btn.setAttribute("aria-label", "Edit user");
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            editHandlerRef.current(cell.getRow().getData() as UserRow);
          });
          return btn;
        },
      },
    ],
    [],
  );

  const options = useMemo<ReactTabulatorOptions>(() => {
    return {
      layout: "fitColumns",
      placeholder: "No users for this shop.",
      pagination: true,
      paginationMode: "remote",
      paginationSize: 20,
      paginationSizeSelector: [10, 20, 50],
      ajaxURL: `${baseUrl}/users`,
      ajaxRequestFunc: (url, _config, params) => {
        const u = new URL(
          url,
          typeof window !== "undefined" ? window.location.origin : "http://localhost",
        );
        const merged: Record<string, unknown> = {
          ...(params && typeof params === "object" ? params : {}),
        };
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
        });
        return fetch(u.toString(), {
          headers: {
            ...getAuthHeaders(),
            Accept: "application/json",
          },
        }).then(async (r) => {
          if (!r.ok) {
            const t = await r.text();
            throw new Error(t || r.statusText);
          }
          return r.json();
        });
      },
      dataLoader: true,
    };
  }, [baseUrl, effectiveShopCode]);

  /** Reload remote data when shop changes — do not remount the grid (Tabulator + ResizeObserver crash). */
  useEffect(() => {
    if (!readyForTable) return;
    const t = tableRef.current;
    if (!t) return;
    if (prevShopForTableRef.current === null) {
      prevShopForTableRef.current = effectiveShopCode;
      return;
    }
    if (prevShopForTableRef.current === effectiveShopCode) return;
    prevShopForTableRef.current = effectiveShopCode;
    t.setPage(1);
  }, [effectiveShopCode, readyForTable]);

  useEffect(() => {
    if (refreshKey === 0) return;
    tableRef.current?.setPage(1);
  }, [refreshKey]);

  const shopOptions = useMemo(() => {
    if (shops.length > 0) {
      return shops.map((s) => ({
        value: s.shopCode,
        label: `${s.name} (${s.shopCode})`,
      }));
    }
    if (effectiveShopCode) {
      return [{ value: effectiveShopCode, label: effectiveShopCode }];
    }
    return [];
  }, [shops, effectiveShopCode]);

  useEffect(() => {
    if (!createOpen) return;
    createForm.setFieldsValue({
      shopCode: effectiveShopCode,
      role: "STAFF",
    });
  }, [createOpen, effectiveShopCode, createForm]);

  const onCreateSubmit = async (values: {
    email: string;
    password: string;
    name?: string;
    role: string;
    shopCode: string;
  }) => {
    setSubmitting(true);
    try {
      const res = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name || undefined,
          role: values.role,
          shopCode: values.shopCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join(", ")
              : "Could not create user",
        );
        return;
      }
      message.success("User created");
      setCreateOpen(false);
      createForm.resetFields();
      setRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (values: {
    name?: string;
    password?: string;
    role: string;
    shopCode: string;
    isActive: boolean;
  }) => {
    if (!editRow) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: values.name || null,
        role: values.role,
        shopCode: values.shopCode,
        isActive: values.isActive,
      };
      if (values.password && values.password.length >= 6) {
        body.password = values.password;
      }
      const res = await apiFetch(`/users/${editRow.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join(", ")
              : "Could not update user",
        );
        return;
      }
      message.success("User updated");
      setEditOpen(false);
      setEditRow(null);
      setRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const currentShop = useMemo(() => {
    const s = shops.find((x) => x.shopCode === effectiveShopCode);
    return {
      name: s?.name ?? "Selected shop",
      code: effectiveShopCode,
    };
  }, [shops, effectiveShopCode]);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <p className={styles.toolbarLabel}>Directory scope</p>
          <div className={styles.shopLine}>
            <Building2 className={styles.shopIcon} aria-hidden strokeWidth={2} />
            <div>
              <p className={styles.shopName}>{currentShop.name}</p>
              <span className={styles.shopCode}>{currentShop.code}</span>
            </div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<UserPlus size={18} strokeWidth={2.25} />}
          className={styles.addBtn}
          onClick={() => setCreateOpen(true)}
        >
          Add user
        </Button>
      </div>

      <div className={styles.tableSlot}>
        {!readyForTable ? (
          <div className={styles.tableLoading} aria-busy="true">
            <LoadingDots />
          </div>
        ) : (
          <div className={styles.wrap}>
            <DataTable
              columns={columns}
              options={options}
              onRef={(instanceRef: { current?: TabulatorPageable }) => {
                tableRef.current = instanceRef.current ?? null;
              }}
            />
          </div>
        )}
      </div>

      <Modal
        title={<span className={styles.modalTitle}>Add user</span>}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={onCreateSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label={
              <div className="flex items-center justify-between w-full">
                <span>Password</span>
                <Button
                  type="link"
                  size="small"
                  className="h-auto p-0 text-[11px] font-semibold text-[var(--ochre-600)]"
                  onClick={() => handleSuggestPassword("create")}
                >
                  Suggest strong password
                </Button>
              </div>
            }
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="shopCode"
            label="Shop"
            rules={[{ required: true, message: "Select a shop" }]}
          >
            <Select options={shopOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span className={styles.modalTitle}>Edit user</span>}
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditRow(null);
        }}
        footer={null}
        destroyOnHidden
      >
        {editRow && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={onEditSubmit}
            key={editRow.id}
          >
            <Form.Item label="Email">
              <Input value={editRow.email} disabled />
            </Form.Item>
            <Form.Item name="name" label="Name">
              <Input />
            </Form.Item>
            <Form.Item
               name="password"
               label={
                 <div className="flex items-center justify-between w-full">
                   <span>New password (optional)</span>
                   <Button
                     type="link"
                     size="small"
                     className="h-auto p-0 text-[11px] font-semibold text-[var(--ochre-600)]"
                     onClick={() => handleSuggestPassword("edit")}
                   >
                     Suggest strong password
                   </Button>
                 </div>
               }
            >
              <Input.Password
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
              />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Select options={ROLE_OPTIONS} />
            </Form.Item>
            <Form.Item name="shopCode" label="Shop" rules={[{ required: true }]}>
              <Select options={shopOptions} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>
                Save changes
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
