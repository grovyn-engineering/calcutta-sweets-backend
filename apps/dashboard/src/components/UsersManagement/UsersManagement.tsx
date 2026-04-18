"use client";

import { App, Button, Form, Input, Modal, Select, Switch } from "antd";
import { Building2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/DataTable/DataTable";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

type TabulatorPageable = { setPage: (page: number) => void };

import { useRemoteTabulatorLoading } from "@/hooks/useRemoteTabulatorLoading";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch, getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { ROLE_FORM_OPTIONS } from "@/lib/rolePermissions";
import { ShieldAlert } from "lucide-react";

import "tabulator-tables/dist/css/tabulator.min.css";
import styles from "./UsersManagement.module.css";



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

function canDeleteUserRow(
  authRole: string | undefined,
  authUserId: string | undefined,
  row: UserRow,
): boolean {
  if (!authRole || !authUserId || row.id === authUserId) return false;
  if (authRole === "SUPER_ADMIN") return true;
  if (authRole === "ADMIN") {
    return row.role !== "SUPER_ADMIN" && row.role !== "ADMIN";
  }
  if (authRole === "MANAGER") {
    return row.role === "CASHIER" || row.role === "STAFF";
  }
  return false;
}

export default function UsersManagement() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const baseUrl = getApiBaseUrl();
  const { effectiveShopCode, shops, shopsLoading } = useShop();
  const tableRef = useRef<TabulatorPageable | null>(null);
  const prevShopForTableRef = useRef<string | null>(null);

  const canManageUserRows =
    authUser?.role === "SUPER_ADMIN" || authUser?.role === "ADMIN";

  const readyForTable =
    !shopsLoading && effectiveShopCode.length > 0;

  const [refreshKey, setRefreshKey] = useState(0);

  const { loading: tableLoading, onRemoteBusyChange } = useRemoteTabulatorLoading(
    effectiveShopCode,
    refreshKey,
    readyForTable,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm] = Form.useForm();

  const navigateToEditRef = useRef<(row: UserRow) => void>(() => {});
  useEffect(() => {
    navigateToEditRef.current = (row: UserRow) => {
      router.push(`/users/${row.id}`);
    };
  }, [router]);

  const requestDeleteRef = useRef<(row: UserRow) => void>(() => {});
  useEffect(() => {
    requestDeleteRef.current = (row: UserRow) => {
      Modal.confirm({
        title: "Remove this user?",
        content: `Permanently remove ${row.email} from this shop? They will no longer be able to sign in.`,
        okText: "Remove user",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          const res = await apiFetch(`/users/${row.id}`, { method: "DELETE" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            message.error(
              typeof data?.message === "string"
                ? data.message
                : Array.isArray(data?.message)
                  ? data.message.join(", ")
                  : "Could not remove user",
            );
            throw new Error(String(data?.message ?? res.statusText));
          }
          message.success("User removed");
          setRefreshKey((k) => k + 1);
        },
      });
    };
  }, [message]);

  const generateStrongPassword = useCallback(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const len = 12;
    let pwd = "";
    for (let i = 0; i < len; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }, []);

  const handleSuggestPassword = useCallback(() => {
    const pwd = generateStrongPassword();
    createForm.setFieldsValue({ password: pwd });
    message.success("Strong password suggested and auto-filled");
  }, [createForm, generateStrongPassword, message]);

  const columns = useMemo<ColumnDefinition[]>(
    () => {
      const base: ColumnDefinition[] = [
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
        minWidth: 120,
        widthGrow: 1,
        formatter: (cell) => {
          const row = cell.getRow().getData() as UserRow;
          const v = row.name ?? (cell.getValue() as string | null | undefined);
          const span = document.createElement("span");
          if (v == null || String(v).trim() === "") {
            span.className = "users-name-muted";
            span.textContent = "-";
          } else {
            span.textContent = String(v);
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
        minWidth: 200,
        width: 200,
        hozAlign: "center",
        formatter: (cell) => {
          const row = cell.getRow().getData() as UserRow;
          const code = row.shopCode ?? String(cell.getValue() ?? "");
          const span = document.createElement("span");
          span.setAttribute("data-skip-overflow-tooltip", "1");
          span.className = "users-pill users-pill--shop";
          span.textContent = code;
          return span;
        },
      },
      {
        title: "Status",
        field: "isActive",
        width: 120,
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
    ];
      if (canManageUserRows) {
        base.push({
          title: "Actions",
          field: "_actions",
          width: 200,
          hozAlign: "center",
          headerSort: false,
          resizable: false,
          formatter: (cell) => {
            const row = cell.getRow().getData() as UserRow;
            const wrap = document.createElement("div");
            wrap.className = "users-actions-cell";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "users-edit-btn";
            editBtn.textContent = "Edit";
            editBtn.setAttribute("aria-label", "Edit user");
            editBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateToEditRef.current(row);
            });
            wrap.appendChild(editBtn);

            if (
              canDeleteUserRow(authUser?.role, authUser?.id, row)
            ) {
              const delBtn = document.createElement("button");
              delBtn.type = "button";
              delBtn.className = "users-delete-btn";
              delBtn.textContent = "Delete";
              delBtn.setAttribute("aria-label", "Remove user");
              delBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                requestDeleteRef.current(row);
              });
              wrap.appendChild(delBtn);
            }

            return wrap;
          },
        });
      }
      return base;
    },
    [authUser?.id, authUser?.role, canManageUserRows],
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

      <div className={`${styles.tableSlot} ${styles.wrap}`}>
        <DataTable
          key={`${effectiveShopCode}-${canManageUserRows ? "e" : "v"}-${refreshKey}`}
          columns={columns}
          options={options}
          onRef={(instanceRef: { current?: unknown }) => {
            tableRef.current = (instanceRef.current as TabulatorPageable | undefined) ?? null;
          }}
          loading={tableLoading}
          onRemoteBusyChange={onRemoteBusyChange}
          emptyTitle="No users found"
          emptyDescription="Add your team members and assign them roles to start managing your shop."
          emptyIcon={<ShieldAlert size={28} strokeWidth={1.35} aria-hidden />}
        />
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
                  onClick={() => handleSuggestPassword()}
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
            <Select options={[...ROLE_FORM_OPTIONS]} />
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
    </div>
  );
}
