"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/cn";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Incremento por toque. Por defecto 1. */
  step?: number;
  /** Texto para lectores de pantalla: "Cantidad de Mermelada de higo". */
  label: string;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  step = 1,
  label,
  size = "md",
  className,
}: QuantityStepperProps) {
  const buttonSize = size === "sm" ? "size-9" : "size-11";
  const valueSize = size === "sm" ? "w-9 text-sm" : "w-11 text-base";

  const buttonClass = cn(
    buttonSize,
    "flex items-center justify-center rounded-full text-ink transition-colors",
    "hover:bg-ink/10 active:bg-ink/15",
    "disabled:cursor-not-allowed disabled:text-ink/30 disabled:hover:bg-transparent",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border-2 border-ink/15 bg-card",
        className,
      )}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label={`Quitar uno — ${label}`}
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <output
        aria-label={label}
        className={cn("text-center font-semibold tabular-nums", valueSize)}
      >
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label={`Agregar uno — ${label}`}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
