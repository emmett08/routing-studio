import React from "react";
import type { Toast } from "../state/useRoutingEditor";

function toneToBorder(kind: Toast["kind"]) {
  if (kind === "error") return "rgba(255,107,107,0.5)";
  if (kind === "warning") return "rgba(255,209,102,0.5)";
  if (kind === "success") return "rgba(94,234,212,0.5)";
  return "rgba(147,197,253,0.35)";
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="list">
        {toasts.map((t, idx) => (
          <div key={idx} className="card" style={{ borderColor: toneToBorder(t.kind) }}>
            <div style={{ fontSize: 13 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
