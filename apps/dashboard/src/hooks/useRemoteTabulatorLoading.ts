import { useCallback, useEffect, useState } from "react";

export function useRemoteTabulatorLoading(...resetDeps: unknown[]) {
  const [loading, setLoading] = useState(true);
  const onRemoteBusyChange = useCallback((busy: boolean) => {
    setLoading(busy);
  }, []);

  const resetKey = JSON.stringify(resetDeps);
  useEffect(() => {
    setLoading(true);
  }, [resetKey]);

  return { loading, onRemoteBusyChange };
}
