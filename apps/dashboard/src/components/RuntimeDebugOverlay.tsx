"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type LogLevel = "info" | "warn" | "error";

type DebugLog = {
  id: number;
  at: string;
  level: LogLevel;
  message: string;
};

const MAX_LOGS = 80;

function isTabletDebugTarget(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const maybeCapacitor =
    !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.() || ua.includes("wv");
  return isAndroid && maybeCapacitor;
}

export function RuntimeDebugOverlay() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  useEffect(() => {
    setEnabled(isTabletDebugTarget());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        at: new Date().toISOString(),
        level: "info",
        message: `route=${pathname} authLoading=${String(isLoading)} authenticated=${String(isAuthenticated)} user=${user?.email ?? "none"}`,
      },
    ].slice(-MAX_LOGS));
  }, [enabled, pathname, isLoading, isAuthenticated, user?.email]);

  useEffect(() => {
    if (!enabled) return;

    const addLog = (level: LogLevel, message: string) => {
      setLogs((prev) => {
        const next = [
          ...prev,
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            at: new Date().toISOString(),
            level,
            message,
          },
        ];
        return next.slice(-MAX_LOGS);
      });
    };

    const onWindowError = (event: ErrorEvent) => {
      addLog("error", `window.error ${event.message} @ ${event.filename}:${event.lineno}`);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      let detail = "unknown";
      const reason = event.reason;
      if (typeof reason === "string") detail = reason;
      else if (reason && typeof reason.message === "string") detail = reason.message;
      addLog("error", `unhandledrejection ${detail}`);
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const started = Date.now();
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0] instanceof Request
            ? args[0].url
            : "unknown-url";
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          addLog(
            "warn",
            `fetch ${response.status} ${response.statusText} (${Date.now() - started}ms) ${url}`,
          );
        }
        return response;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        addLog("error", `fetch failed (${Date.now() - started}ms) ${url} :: ${msg}`);
        throw error;
      }
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    addLog("info", "runtime debug overlay attached");

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [enabled]);

  const status = useMemo(
    () =>
      `path=${pathname} | authLoading=${String(isLoading)} | auth=${String(isAuthenticated)} | user=${user?.email ?? "none"}`,
    [pathname, isLoading, isAuthenticated, user?.email],
  );

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          zIndex: 999999,
          borderRadius: 20,
          border: "1px solid #222",
          background: "#111",
          color: "#fff",
          padding: "8px 12px",
          fontSize: 12,
        }}
      >
        Debug {open ? "Hide" : "Show"}
      </button>

      {open ? (
        <div
          style={{
            position: "fixed",
            left: 8,
            right: 8,
            bottom: 52,
            maxHeight: "48vh",
            overflow: "auto",
            zIndex: 999999,
            background: "rgba(12,12,12,0.95)",
            color: "#f5f5f5",
            border: "1px solid #3a3a3a",
            borderRadius: 8,
            padding: 10,
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <strong>Runtime Debug</strong>
            <button type="button" onClick={() => setLogs([])} style={{ padding: "3px 8px" }}>
              Clear
            </button>
          </div>
          <div style={{ marginBottom: 8, wordBreak: "break-word" }}>{status}</div>
          <div style={{ display: "grid", gap: 4 }}>
            {logs.length === 0 ? <div>No logs yet.</div> : null}
            {logs.map((entry) => (
              <div key={entry.id} style={{ wordBreak: "break-word" }}>
                [{entry.level.toUpperCase()}] {entry.at} - {entry.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
