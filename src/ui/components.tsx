import React from "react";

export function Badge({
  kind,
  children,
}: {
  kind: "ok" | "warn" | "danger";
  children: React.ReactNode;
}) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <h2>{title}</h2>
        {subtitle ? <div className="muted">{subtitle}</div> : null}
      </div>
      <div style={{ flex: 1 }} />
      {right}
    </header>
  );
}

export function Help({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warn";
}) {
  const border = tone === "warn" ? "rgba(255,209,102,0.45)" : "rgba(147,197,253,0.35)";
  return (
    <div className="card" style={{ borderColor: border }}>
      <div className="small">{children}</div>
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return <span className="mono" style={{ fontSize: 12 }}>{children}</span>;
}

export function SmallButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        padding: "6px 10px",
        borderRadius: 10,
        ...(props.style ?? {}),
      }}
    />
  );
}

export function IconPill({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="pill">
      <span aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </span>
  );
}
