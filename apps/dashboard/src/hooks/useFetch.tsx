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

  useEffect(() => {
    if (!endpoint) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    apiFetch(path, { method: "GET", ...optionsRef.current })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));

    return () => {
      setData(null);
      setError(null);
      setLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extraDeps supplied by caller
  }, [endpoint, ...extraDeps]);

  return { data, error, loading };
};

export default useFetch;
