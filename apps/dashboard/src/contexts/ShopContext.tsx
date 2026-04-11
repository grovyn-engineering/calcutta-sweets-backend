"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiFetch,
  dedupeInFlight,
  EFFECTIVE_SHOP_STORAGE_KEY,
} from "@/lib/api";

const STORAGE_KEY = EFFECTIVE_SHOP_STORAGE_KEY;

export type ShopOption = {
  id: string;
  shopCode: string;
  name: string;
  isFactory: boolean;
};

type ShopContextValue = {
  effectiveShopCode: string;
  setEffectiveShopCode: (code: string) => void;
  shops: ShopOption[];
  shopsLoading: boolean;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [effectiveShopCode, setEffectiveShopCodeState] = useState("");

  const defaultEnv =
    process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === "SUPER_ADMIN") {
      setShopsLoading(true);
      apiFetch("/shops")
        .then(async (res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json() as Promise<
            { id: string; shopCode: string; name: string; isFactory: boolean }[]
          >;
        })
        .then((list) => {
          const mapped = list.map((s) => ({
            id: s.id,
            shopCode: s.shopCode,
            name: s.name,
            isFactory: !!s.isFactory,
          }));
          setShops(mapped);
          const codes = new Set(mapped.map((s) => s.shopCode));
          const stored =
            typeof window !== "undefined"
              ? localStorage.getItem(STORAGE_KEY)
              : null;
          const fromStorage = stored && codes.has(stored) ? stored : null;
          const fallback =
            fromStorage ||
            mapped[0]?.shopCode ||
            user.shopCode ||
            defaultEnv;
          setEffectiveShopCodeState(fallback);
          if (typeof window !== "undefined" && fallback) {
            localStorage.setItem(STORAGE_KEY, fallback);
          }
        })
        .catch(() => {
          setShops([]);
          setEffectiveShopCodeState(user.shopCode || defaultEnv);
        })
        .finally(() => setShopsLoading(false));
    } else {
      setShops([]);
      const code = user.shopCode || defaultEnv;
      setEffectiveShopCodeState(code);
      if (typeof window !== "undefined" && code) {
        localStorage.setItem(STORAGE_KEY, code);
      }
    }
  }, [isAuthenticated, user, defaultEnv]);

  const setEffectiveShopCode = useCallback((code: string) => {
    setEffectiveShopCodeState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, code);
      // Reload the page so all shop-scoped data re-fetches cleanly
      window.location.reload();
    }
  }, []);

  const value = useMemo<ShopContextValue>(
    () => ({
      effectiveShopCode,
      setEffectiveShopCode,
      shops,
      shopsLoading,
    }),
    [effectiveShopCode, setEffectiveShopCode, shops, shopsLoading],
  );

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (e.g. tests). */
export function useShopOptional(): ShopContextValue | null {
  return useContext(ShopContext);
}
