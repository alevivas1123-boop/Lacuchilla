"use client";

import { cn } from "@/lib/cn";

interface WeightSelectorProps {
  options: number[];
  value: number;
  onChange: (value: number) => void;
  /** Nombre del producto, para describir el grupo a lectores de pantalla. */
  productName: string;
}

/** Selector de kilos con forma de control segmentado (un toque, sin desplegables). */
export function WeightSelector({
  options,
  value,
  onChange,
  productName,
}: WeightSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label={`Peso — ${productName}`}
      className="grid grid-cols-5 gap-1.5"
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${option} kg`}
            onClick={() => onChange(option)}
            className={cn(
              "min-h-11 rounded-lg border-2 text-sm font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              selected
                ? "border-ink bg-ink text-cream"
                : "border-ink/15 bg-card text-ink hover:border-ink/45 hover:bg-cream",
            )}
          >
            {option}
            <span className="ml-0.5 text-[0.7rem] font-medium opacity-75">kg</span>
          </button>
        );
      })}
    </div>
  );
}
