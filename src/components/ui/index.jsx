// src/components/ui/index.jsx
import { clsx } from "clsx";

// ── Button ───────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", className, style: styleProp, ...props }) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50";

  const styleMap = {
    primary:   { background: "var(--brand)", color: "#fff", border: "none" },
    secondary: { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" },
    danger:    { background: "transparent", color: "var(--danger)", border: "1px solid var(--danger-bg)" },
    ghost:     { background: "transparent", color: "var(--text-faint)", border: "none" },
  };

  const sizes = { sm: "px-3 py-1 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3 text-base" };

  return (
    <button
      className={clsx(base, sizes[size], className)}
      style={{ ...styleMap[variant], ...styleProp }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label-base">{label}</label>}
      <input
        className={clsx("input-base", error && "error", className)}
        {...props}
      />
      {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────
export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label-base">{label}</label>}
      <select
        className={clsx("input-base", error && "error", className)}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, className, style: styleProp, ...props }) {
  return (
    <div
      className={clsx("rounded-xl p-6", className)}
      style={{
        background:   "var(--surface-card)",
        border:       "1px solid var(--border)",
        ...styleProp,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ── CardTitle ────────────────────────────────────────────────
export function CardTitle({ children, className }) {
  return (
    <div
      className={clsx("text-[11px] uppercase tracking-widest font-semibold mb-4", className)}
      style={{ color: "var(--text-faint)" }}
    >
      {children}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────
export function Badge({ children, color = "var(--brand)", className }) {
  return (
    <span
      className={clsx("inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold", className)}
      style={{ background: color + "22", color }}
    >
      {children}
    </span>
  );
}

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div
      style={{
        width:          size,
        height:         size,
        border:         "2px solid var(--brand-dim)",
        borderTopColor: "var(--brand)",
        borderRadius:   "50%",
        animation:      "spin 0.8s linear infinite",
      }}
    />
  );
}