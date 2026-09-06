import { BLOQUEANTES, IMAGENES_PROVISORIAS } from "@/data/provisional-images";

/**
 * Aviso permanente durante el desarrollo: recuerda que las fotos del catálogo
 * son material provisorio y no pueden publicarse.
 *
 * Es un componente de servidor y usa <details> para plegarse, así no necesita
 * JavaScript: en producción no se renderiza nada y, además, ni el componente
 * ni el inventario llegan al paquete que descarga el navegador.
 *
 * El corte real lo hace `scripts/verificar-imagenes.mjs` antes del build; esto
 * es el recordatorio visible mientras se trabaja.
 */
export function AvisoImagenesProvisorias() {
  if (process.env.NODE_ENV === "production") return null;
  if (IMAGENES_PROVISORIAS.length === 0) return null;

  return (
    <aside
      aria-label="Aviso de desarrollo: imágenes provisorias"
      className="fixed bottom-4 left-4 z-[80] max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-2 border-[#9B3B1F] bg-[#2A1710] text-cream shadow-lifted"
    >
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-2.5 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheese">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 shrink-0 text-[#F0A868]"
          >
            <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span className="flex-1 text-sm font-semibold">
            {IMAGENES_PROVISORIAS.length} imágenes provisorias
            <span className="ml-1.5 font-normal text-cream/70">· no publicar</span>
          </span>
          <span aria-hidden="true" className="text-xs text-cream/60">
            ver
          </span>
        </summary>

        <div className="border-t border-cream/15 px-3.5 py-3 text-xs leading-relaxed">
          <p className="text-cream/80">
            Material de Wikimedia Commons cargado para construir y validar el MVP. Hay que
            reemplazarlo por fotos propias o con licencia comercial verificada antes de publicar.
          </p>

          <p className="mt-3 font-semibold text-[#F0A868]">
            {BLOQUEANTES.length} con problema de contenido:
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {BLOQUEANTES.map((imagen) => (
              <li key={imagen.slug}>
                <code className="rounded bg-cream/10 px-1 py-0.5 font-mono text-[0.7rem]">
                  {imagen.slug}
                </code>
                <span className="ml-1.5 text-cream/70">{imagen.motivo}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-cream/60">
            Inventario completo y procedimiento en{" "}
            <code className="font-mono">IMAGE_REPLACEMENT_TODO.md</code>. El build de producción
            se corta solo mientras queden entradas en el inventario.
          </p>
        </div>
      </details>
    </aside>
  );
}
