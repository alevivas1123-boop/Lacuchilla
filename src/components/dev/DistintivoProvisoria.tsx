/**
 * Marca sobre la foto de un producto cuya imagen es provisoria.
 *
 * Recibe un booleano ya resuelto en el servidor en lugar de consultar el
 * inventario, para que la lista de imágenes provisorias no viaje al navegador.
 * Solo aparece en desarrollo.
 */
export function DistintivoProvisoria({ provisoria }: { provisoria?: boolean }) {
  if (process.env.NODE_ENV === "production") return null;
  if (!provisoria) return null;

  return (
    <span
      className="pointer-events-none absolute top-2 left-2 z-10 rounded-full bg-[#2A1710]/90 px-2 py-1 text-[0.65rem] font-semibold tracking-[0.1em] text-[#F0A868] uppercase"
      title="Imagen provisoria: reemplazar antes de publicar"
    >
      Provisoria
    </span>
  );
}
