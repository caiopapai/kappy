import { clsx } from "clsx";

export function Button({ children, variant = "primary", size = "md", className, ...props }) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-all cursor-pointer border-0 disabled:opacity-50";
  const variants = {
    primary:   "bg-[#6366f1] text-white hover:bg-[#4f52d9]",
    secondary: "bg-transparent text-[#8a8fa8] border border-[#2a2d3a] hover:border-[#3a3d52] hover:text-[#c4c0b8]",
    danger:    "bg-transparent text-[#f87171] border border-[#3a1f1f] hover:bg-[#3a1f1f]",
    ghost:     "bg-transparent text-[#5a5f78] hover:text-[#8a8fa8]",
  };
  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium">
          {label}
        </label>
      )}
      <input
        className={clsx(
          "w-full bg-[#1a1d2e] border border-[#2a2d3a] rounded-lg px-3 py-2.5",
          "text-sm text-[#e8e6e0] outline-none",
          "focus:border-[#6366f1] transition-colors",
          "placeholder:text-[#3a3d52]",
          error && "border-[#f87171]",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-[#f87171]">{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "w-full bg-[#1a1d2e] border border-[#2a2d3a] rounded-lg px-3 py-2.5",
          "text-sm text-[#e8e6e0] outline-none",
          "focus:border-[#6366f1] transition-colors",
          error && "border-[#f87171]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-[#f87171]">{error}</span>}
    </div>
  );
}

export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        "bg-[#161820] border border-[#2a2d3a] rounded-xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <div className={clsx(
      "text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-4",
      className
    )}>
      {children}
    </div>
  );
}

export function Badge({ children, color = "#6366f1", className }) {
  return (
    <span
      className={clsx("inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold", className)}
      style={{ background: color + "22", color }}
    >
      {children}
    </span>
  );
}

export function Spinner({ size = 20, color = "#6366f1" }) {
  return (
    <div
      style={{
        width: size, height: size,
        border: "2px solid " + color + "33",
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
