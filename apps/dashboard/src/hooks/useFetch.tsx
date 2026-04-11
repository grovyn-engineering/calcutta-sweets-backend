import { useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";

/**
 * GET helper with auth + `X-Shop` via `apiFetch`.
 * Pass `extraDeps` (e.g. `[effectiveShopCode]`) so the request re-runs when shop scope changes.
 */
const useFetch = (
  endpoint: string,
  options?: RequestInit,
  extraDeps: unknown[] = [],
) => {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchApi = async () => {
    if (!endpoint) return;
    setLoading(true);
    try {
      const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const response = await apiFetch(path, { method: "GET", ...optionsRef.current });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApi();
    return () => {
      setData(null);
      setError(null);
      setLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extraDeps supplied by caller
  }, [endpoint, ...extraDeps]);

  return { data, error, loading, fetchApi };
};

export default useFetch;
