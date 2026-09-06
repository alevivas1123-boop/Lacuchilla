/** Placeholder mientras se lee el carrito guardado en el navegador. */
export function CartSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="size-24 shrink-0 rounded-xl bg-cream-deep" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-2/5 rounded bg-cream-deep" />
            <div className="h-3 w-1/4 rounded bg-cream-deep" />
            <div className="h-9 w-32 rounded-full bg-cream-deep" />
          </div>
        </div>
      ))}
    </div>
  );
}
