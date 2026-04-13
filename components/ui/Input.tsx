import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-medium text-[var(--muted)]">{label}</span>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-[var(--muted)]/80">{hint}</p> : null}
    </label>
  );
}

export function Input({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <input
        className={`min-h-[52px] w-full rounded-2xl border border-white/12 bg-black/25 px-4 text-[15px] text-white outline-none ring-0 transition placeholder:text-white/30 focus:border-[var(--accent-a)]/55 focus:shadow-[0_0_0_3px_rgba(124,140,255,0.18)] ${className}`}
        {...props}
      />
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  className = "",
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        rows={rows}
        className={`min-h-[120px] w-full resize-y rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-[var(--accent-a)]/55 focus:shadow-[0_0_0_3px_rgba(124,140,255,0.18)] ${className}`}
        {...props}
      />
    </Field>
  );
}
