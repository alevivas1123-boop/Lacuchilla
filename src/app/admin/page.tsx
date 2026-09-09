import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { accionCambiarEstado } from "@/app/admin/actions";
import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { FiltrosProductos } from "@/components/admin/FiltrosProductos";
import { TablaProductos } from "@/components/admin/TablaProductos";
import { buttonStyles } from "@/components/ui/button-styles";
import { listarProductosAdmin } from "@/db/queries";
import type { ProductCategory, ProductoAdmin } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administración de productos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Busqueda {
  q?: string;
  categoria?: string;
  estado?: string;
  guardado?: string;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Busqueda>;
}) {
  const filtros = await searchParams;
  const categoria = (filtros.categoria ?? "todas") as ProductCategory | "todas";
  const estado = (filtros.estado ?? "todos") as "activos" | "inactivos" | "todos";

  let productos: ProductoAdmin[];
  let errorBase: string | undefined;
  try {
    productos = await listarProductosAdmin({ busqueda: filtros.q, categoria, estado });
  } catch {
    productos = [];
    errorBase =
      "No se pudo conectar con la base de datos. Revisá la variable DATABASE_URL del entorno.";
  }

  return (
    <>
      <BarraAdmin />

      <main className="container-page flex-1 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Administración de productos
            </h1>
            <p className="mt-1.5 text-sm text-bark">
              Los cambios se ven en la tienda apenas guardás.
            </p>
          </div>

          <Link href="/admin/productos/nuevo" className={buttonStyles("primary", "md")}>
            <Plus aria-hidden="true" className="size-4.5" />
            Nuevo producto
          </Link>
        </div>

        {filtros.guardado ? (
          <p
            role="status"
            className="mt-5 rounded-card border-2 border-olive/30 bg-olive/10 px-4 py-3 text-sm font-medium text-ink"
          >
            Producto guardado. Ya está publicado en la tienda.
          </p>
        ) : null}

        {errorBase ? (
          <p
            role="alert"
            className="mt-5 rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 px-4 py-3 text-sm font-medium text-ink"
          >
            {errorBase}
          </p>
        ) : null}

        <FiltrosProductos
          busqueda={filtros.q ?? ""}
          categoria={categoria}
          estado={estado}
          total={productos.length}
        />

        <TablaProductos productos={productos} cambiarEstado={accionCambiarEstado} />
      </main>
    </>
  );
}
