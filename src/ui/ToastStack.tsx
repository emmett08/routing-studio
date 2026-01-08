import React from "react";
import type { Toast } from "../state/useRoutingEditor";

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t, idx) => (
        <div key={idx} className={`toast-item toast-${t.kind}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
