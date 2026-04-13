import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "gradient" | "ghost" | "outline";

export function Button({
  children,
  className = "",
  variant = "gradient",
  loading = false,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}) {
  const base =
    "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-medium tracking-tight transition-transform duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";
  const variants: Record<Variant, string> = {
    gradient: "btn-gradient text-white shadow-lg shadow-black/25",
    ghost: "bg-white/8 text-white hover:bg-white/12",
    outline:
      "border border-white/20 bg-transparent text-white hover:border-[var(--accent-a)]/60 hover:bg-white/5",
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
      disabled={loading || Boolean(disabled)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block size-5 shrink-0 rounded-full border-2 border-white/30 border-t-white"
      style={{ animation: "spin 0.7s linear infinite" }}
      aria-hidden
    />
  );
}
