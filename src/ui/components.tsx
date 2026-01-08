import React, { useEffect, useMemo, useRef, useState } from "react";

export function InlineCode({ children }: { children: React.ReactNode }) {
  return <span className="inline-code">{children}</span>;
}

export function ViewHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="view-header">
      <div className="view-header-text">
        <h2 className="view-title">{title}</h2>
        {subtitle ? <div className="view-subtitle">{subtitle}</div> : null}
      </div>
      <div className="view-header-spacer" />
      {actions ? <div className="view-actions">{actions}</div> : null}
    </header>
  );
}

export function InlineAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={props.type ?? "button"} className={`inline-action ${props.className ?? ""}`} />;
}

export type OverflowMenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

export function OverflowMenu({
  items,
  ariaLabel = "More actions",
}: {
  items: OverflowMenuItem[];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const enabledItems = useMemo(() => items.filter((i) => i.label.trim().length > 0), [items]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  if (enabledItems.length === 0) return null;

  return (
    <div className="menu">
      <button
        ref={btnRef}
        type="button"
        className="button button-secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        …
      </button>
      {open ? (
        <div ref={menuRef} className="menu-popover" role="menu">
          {enabledItems.map((item, idx) => (
            <button
              key={`${item.label}-${idx}`}
              type="button"
              role="menuitem"
              className="menu-item"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
