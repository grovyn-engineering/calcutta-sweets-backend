export const dynamic = "force-static";

export default function TabletLegacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px",
        background: "#f7f4ee",
        color: "#1f1f1f",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e1d8",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Calcutta Sweets Tablet Test</h1>
        <p style={{ margin: "0 0 12px", fontSize: 15 }}>
          This is a lightweight fallback page for Android 7 tablet verification.
        </p>
        <p style={{ margin: "0 0 12px", fontSize: 13 }}>
          If this page opens in your app, WebView loading is stable and we can build tablet-safe
          flows on top of this route.
        </p>
        <div
          style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 8,
            background: "#f8f1d6",
            border: "1px solid #ecdca6",
            fontSize: 13,
            wordBreak: "break-word",
          }}
        >
          <strong>Status:</strong> Legacy route loaded successfully.
          <br />
          <strong>URL:</strong> /tablet-legacy
        </div>
        <a
          href="https://calcutta-sweets.vercel.app/login"
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#a67c23",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Open Main Login
        </a>
      </div>
    </main>
  );
}

