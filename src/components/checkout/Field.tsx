import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface FieldProps {
  id: string;
  label: string;
  /** Texto de ayuda bajo la etiqueta. */
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-cheese-deep">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-medium text-bark">(opcional)</span>
        )}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-bark">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-[#9B3B1F]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-xl border-2 border-ink/15 bg-cream px-3.5 text-base text-ink " +
  "placeholder:text-bark/55 transition-colors " +
  "hover:border-ink/30 focus:border-ink focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink " +
  "aria-[invalid=true]:border-[#9B3B1F]";
