/**
 * Qué tiene la base y qué le falta.
 *
 *   npm run db:estado
 *
 * Responde tres preguntas, en orden de urgencia:
 *
 *   1. ¿Falta aplicar alguna migración?
 *   2. ¿Está la tienda en condiciones de vender?
 *   3. ¿Cuántos pedidos hay y en qué estado?
 *
 * No modifica nada. Termina bien siempre, incluso con migraciones pendientes:
 * es un informe, no un candado. Lo que importa es lo que dice, no el código
 * de salida.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import postgres from "postgres";

import { contar, revisarMigraciones, type MigracionDelRepo } from "../src/lib/migraciones";

const raiz = process.cwd();

/** Las migraciones del repositorio, con el hash y la marca que usa Drizzle. */
function migracionesDelRepo(): MigracionDelRepo[] {
  const diario = JSON.parse(
    fs.readFileSync(path.join(raiz, "drizzle", "meta", "_journal.json"), "utf8"),
  ) as { entries: { tag: string; when: number }[] };

  return diario.entries.map(({ tag, when }) => ({
    tag,
    cuando: when,
    hash: createHash("sha256")
      .update(fs.readFileSync(path.join(raiz, "drizzle", `${tag}.sql`), "utf8"))
      .digest("hex"),
  }));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL. Definila antes de consultar el estado.");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, prepare: false });

  try {
    /* ── 1. Migraciones ─────────────────────────────────────────────── */

    const delRepo = migracionesDelRepo();

    // La tabla no existe si nunca se migró: eso también es una respuesta.
    const hayTabla = await sql<{ existe: boolean }[]>`
      select to_regclass('drizzle.__drizzle_migrations') is not null as existe
    `;
    const aplicadas = hayTabla[0].existe
      ? await sql<{ hash: string; created_at: string }[]>`
          select hash, created_at from "drizzle"."__drizzle_migrations"
        `
      : [];
    const revisadas = revisarMigraciones(delRepo, aplicadas);
    const { pendientes, conOtroContenido } = contar(revisadas);

    console.log("MIGRACIONES");
    for (const { tag, estado } of revisadas) {
      if (estado === "aplicada") console.log(`  ✓ ${tag}`);
      else if (estado === "aplicada-con-otro-contenido")
        console.log(`  ✓ ${tag}   (el archivo cambió desde que se aplicó)`);
      else console.log(`  ✗ ${tag}   ← PENDIENTE`);
    }

    console.log(
      pendientes === 0
        ? "  La base está al día.\n"
        : `\n  Falta aplicar ${pendientes}. Corré la tarea "migrar".\n`,
    );

    if (conOtroContenido > 0) {
      console.log(
        `  Nota: ${conOtroContenido} ${conOtroContenido === 1 ? "migración quedó registrada" : "migraciones quedaron registradas"} ` +
          "con un contenido distinto al del repositorio.\n" +
          "  Drizzle no las va a volver a aplicar. No hay nada que hacer,\n" +
          "  pero si alguien recreara la base desde cero podría no quedar igual.\n",
      );
    }

    if (pendientes > 0) {
      // Sin las tablas nuevas, todo lo de abajo fallaría con un error feo que
      // no agrega nada: ya se sabe qué hay que hacer.
      console.log("El resto del informe necesita esas migraciones aplicadas.");
      return;
    }

    /* ── 2. ¿Se puede vender? ───────────────────────────────────────── */

    const [catalogo] = await sql<{ activos: number; total: number }[]>`
      select count(*) filter (where active)::int as activos, count(*)::int as total
      from products
    `;
    const [puntos] = await sql<{ activos: number; total: number }[]>`
      select count(*) filter (where active)::int as activos, count(*)::int as total
      from pickup_points
    `;
    const [banco] = await sql<{ listo: boolean }[]>`
      select coalesce(
        (select bank_holder is not null and btrim(bank_holder) <> ''
            and bank_account is not null and btrim(bank_account) <> ''
         from store_settings where id = 1),
        false
      ) as listo
    `;

    console.log("¿SE PUEDE VENDER?");
    console.log(`  ${catalogo.activos > 0 ? "✓" : "✗"} Productos activos: ${catalogo.activos} de ${catalogo.total}`);
    console.log(`  ${puntos.activos > 0 ? "✓" : "✗"} Puntos de retiro activos: ${puntos.activos} de ${puntos.total}`);
    console.log(`  ${banco.listo ? "✓" : "✗"} Datos bancarios cargados: ${banco.listo ? "sí" : "NO — el cliente no sabe dónde transferir"}`);

    const trabas: string[] = [];
    if (catalogo.activos === 0) trabas.push("no hay productos activos");
    if (puntos.activos === 0) trabas.push("no hay puntos de retiro activos: el checkout no puede tomar pedidos");
    if (!banco.listo) trabas.push("faltan los datos bancarios en /admin/configuracion");
    console.log(trabas.length === 0 ? "  Todo listo.\n" : `\n  Traba: ${trabas.join("; ")}.\n`);

    /* ── 3. Pedidos ─────────────────────────────────────────────────── */

    const porEstado = await sql<{ status: string; n: number; total: number }[]>`
      select status, count(*)::int as n, coalesce(sum(total), 0)::int as total
      from orders group by status order by status
    `;

    console.log("PEDIDOS");
    if (porEstado.length === 0) {
      console.log("  Todavía no entró ninguno.");
    } else {
      for (const fila of porEstado) {
        console.log(`  ${fila.status.padEnd(16)} ${String(fila.n).padStart(4)}   $${fila.total.toLocaleString("es-UY")}`);
      }
      const [proxima] = await sql<{ nombre: string; fecha: string; n: number; sin_cobrar: number }[]>`
        select pickup_point_name as nombre, pickup_date::text as fecha,
               count(*)::int as n,
               count(*) filter (where status = 'pendiente_pago')::int as sin_cobrar
        from orders
        where pickup_date >= (now() - interval '3 hours')::date
          and status <> 'cancelado'
        group by pickup_point_name, pickup_date
        order by pickup_date
        limit 1
      `;
      if (proxima) {
        console.log(
          `\n  Próxima entrega: ${proxima.nombre}, ${proxima.fecha} — ` +
            `${proxima.n} ${proxima.n === 1 ? "pedido" : "pedidos"}, ${proxima.sin_cobrar} sin cobrar.`,
        );
      }
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("No se pudo leer el estado:", error instanceof Error ? error.message : error);
  process.exit(1);
});
