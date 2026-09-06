import Link from "next/link";
import { PackageOpen, Pencil } from "lucide-react";

import { BotonEstado } from "@/components/admin/BotonEstado";
import { ProductImage } from "@/components/product/ProductImage";
import { buttonStyles } from "@/components/ui/button-styles";
import { NOMBRE_CATEGORIA } from "@/lib/categorias";
import { formatPrice } from "@/lib/format";
import type { ProductoAdmin } from "@/lib/types";

/**
 * Listado de productos.
 *
 * En pantallas chicas se muestra como tarjetas apiladas y desde `lg` como
 * tabla: una tabla de nueve columnas en un celular obliga a desplazar de
 * costado y se vuelve inservible.
 */
export function TablaProductos({
  productos,
  cambiarEstado,
}: {
  productos: ProductoAdmin[];
  cambiarEstado: (formData: FormData) => Promise<void>;
}) {
  if (productos.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-4 rounded-card border border-ink/10 bg-card px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-cream text-bark">
          <PackageOpen aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-ink">No hay productos que mostrar</p>
          <p className="mt-1 text-sm text-bark">
            Probá con otro filtro, o creá el primero desde “Nuevo producto”.
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className={buttonStyles("primary", "md")}>
          Nuevo producto
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Tarjetas: celular y tablet */}
      <ul className="space-y-3 lg:hidden">
        {productos.map((producto) => (
          <li
            key={producto.id}
            className="flex gap-3 rounded-card border border-ink/10 bg-card p-3"
          >
            <div className="w-20 shrink-0 overflow-hidden rounded-lg">
              <ProductImage
                src={producto.imageUrl ?? undefined}
                alt={producto.imageAlt ?? producto.name}
                name={producto.name}
                category={producto.category}
                aspectClassName="aspect-square"
                compact
                sizes="80px"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.12em] text-olive uppercase">
                    {NOMBRE_CATEGORIA[producto.category]}
                  </p>
                  <h2 className="font-display text-base font-semibold text-ink">{producto.name}</h2>
                </div>
                <Estado activo={producto.active} />
              </div>

              <p className="mt-1 text-sm text-bark">
                <span className="font-semibold text-ink">{formatPrice(producto.price)}</span>{" "}
                por {producto.unitLabel} · {rangoTexto(producto)}
              </p>
              <p className="text-sm text-bark/80">{producto.presentation}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/admin/productos/${producto.id}`}
                  className={buttonStyles("outline", "sm")}
                >
                  <Pencil aria-hidden="true" className="size-3.5" />
                  Editar
                </Link>
                <BotonEstado
                  id={producto.id}
                  nombre={producto.name}
                  activo={producto.active}
                  accion={cambiarEstado}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Tabla: escritorio */}
      <div className="hidden overflow-x-auto rounded-card border border-ink/10 bg-card lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Productos del catálogo</caption>
          <thead className="border-b border-ink/10 text-xs tracking-[0.12em] text-bark uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
              <th scope="col" className="px-4 py-3 font-semibold">Categoría</th>
              <th scope="col" className="px-4 py-3 font-semibold">Precio</th>
              <th scope="col" className="px-4 py-3 font-semibold">Venta</th>
              <th scope="col" className="px-4 py-3 font-semibold">Cantidades</th>
              <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {productos.map((producto) => (
              <tr key={producto.id} className="align-middle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage
                        src={producto.imageUrl ?? undefined}
                        alt={producto.imageAlt ?? producto.name}
                        name={producto.name}
                        category={producto.category}
                        aspectClassName="aspect-square"
                        compact
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-ink">{producto.name}</p>
                      <p className="text-xs text-bark">{producto.presentation}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-bark">{NOMBRE_CATEGORIA[producto.category]}</td>
                <td className="px-4 py-3 font-semibold text-ink tabular-nums">
                  {formatPrice(producto.price)}
                </td>
                <td className="px-4 py-3 text-bark">
                  {producto.saleType === "weight" ? "Por peso" : "Por unidad"}
                  <span className="block text-xs text-bark/70">{producto.unitLabel}</span>
                </td>
                <td className="px-4 py-3 text-bark tabular-nums">{rangoTexto(producto)}</td>
                <td className="px-4 py-3">
                  <Estado activo={producto.active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/productos/${producto.id}`}
                      className={buttonStyles("outline", "sm")}
                    >
                      <Pencil aria-hidden="true" className="size-3.5" />
                      Editar
                    </Link>
                    <BotonEstado
                      id={producto.id}
                      nombre={producto.name}
                      activo={producto.active}
                      accion={cambiarEstado}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function rangoTexto(producto: ProductoAdmin): string {
  const paso = producto.quantityStep === 1 ? "" : ` (de a ${producto.quantityStep})`;
  return `${producto.minQuantity} a ${producto.maxQuantity} ${producto.unitLabel}${paso}`;
}

function Estado({ activo }: { activo: boolean }) {
  return (
    <span
      className={
        activo
          ? "inline-flex items-center gap-1.5 rounded-full bg-olive/15 px-2.5 py-1 text-xs font-semibold text-olive"
          : "inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-bark"
      }
    >
      <span
        aria-hidden="true"
        className={activo ? "size-1.5 rounded-full bg-olive" : "size-1.5 rounded-full bg-bark"}
      />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
