/**
 * Genera un único archivo SQL con todo lo necesario para dejar la base lista:
 * todas las migraciones, el catálogo, los puntos de retiro y el registro que
 * usa Drizzle para saber qué migraciones ya se aplicaron.
 *
 *   npm run db:sql
 *
 * Sirve para pegarlo en el editor SQL de Neon cuando no hay una terminal a
 * mano. Es idempotente: cada migración se aplica solo si su hash todavía no
 * está registrado, así que correrlo dos veces no rompe ni duplica nada.
 *
 * Recorre el diario de migraciones en vez de nombrarlas una por una: al
 * agregar una migración nueva, este script la incluye sin tocarlo.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { CONFIGURACION_INICIAL, filasDelSeed, PUNTOS_INICIALES } from "../src/db/seed";

const raiz = process.cwd();
const diario = JSON.parse(
  fs.readFileSync(path.join(raiz, "drizzle", "meta", "_journal.json"), "utf8"),
) as { entries: { tag: string; when: number }[] };

const cita = (valor: string | null | undefined) =>
  valor === null || valor === undefined ? "NULL" : `'${valor.replace(/'/g, "''")}'`;

/*
 * Cada migración va dentro de un bloque guardado por su hash.
 *
 * Es lo mismo que hace `drizzle-kit migrate`, y evita tener que reescribir
 * cada sentencia a "IF NOT EXISTS": una ALTER TABLE ADD CONSTRAINT no tiene
 * esa forma, y a la segunda corrida el archivo fallaría.
 */
const bloques = diario.entries
  .map(({ tag, when }) => {
    const sql = fs.readFileSync(path.join(raiz, "drizzle", `${tag}.sql`), "utf8");
    const hash = createHash("sha256").update(sql).digest("hex");
    const cuerpo = sql.split("--> statement-breakpoint").join("").trim();
    return `-- ${tag}
DO $migracion$
BEGIN
  IF EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = '${hash}') THEN
    RAISE NOTICE 'La migración ${tag} ya estaba aplicada.';
  ELSE
${cuerpo}
    INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
    VALUES ('${hash}', ${when});
  END IF;
END
$migracion$;`;
  })
  .join("\n\n");

const productos = filasDelSeed()
  .map(
    (f) =>
      `  (${cita(f.slug)}, ${cita(f.name)}, ${cita(f.description as string)}, ${cita(f.category)}::product_category, ` +
      `${f.price}, 'UYU', ${cita(f.saleType)}::sale_type, ${cita(f.unitLabel)}, ` +
      `${f.minQuantity}, ${f.maxQuantity}, ${f.quantityStep}, ${cita(f.presentation)}, ` +
      `${cita(f.imageUrl as string)}, ${cita(f.imageAlt as string)}, true, ${f.sortOrder})`,
  )
  .join(",\n");

const puntos = PUNTOS_INICIALES.map(
  (p) =>
    `    (${cita(p.name)}, ${cita(p.address)}, ${p.weekday}, ${cita(p.timeFrom)}, ${cita(p.timeTo)}, ` +
    `${p.cutoffHours}, ${cita(p.instructions as string)}, true, ${p.sortOrder})`,
).join(",\n");

const c = CONFIGURACION_INICIAL;

process.stdout.write(`-- ═══════════════════════════════════════════════════════════════════════
-- La Cuchilla · preparación de la base de datos
--
-- Pegá TODO esto en el editor SQL de Neon y ejecutalo.
--
-- Crea las tablas (productos, pedidos, puntos de retiro, clientes y
-- configuración), carga los ${filasDelSeed().length} productos del catálogo y los puntos de retiro
-- iniciales.
--
-- Es seguro ejecutarlo más de una vez: cada migración se aplica solo si
-- todavía no estaba, y ni los productos ni los puntos se duplican ni pisan
-- los cambios hechos desde el panel.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Registro de migraciones --------------------------------------------
-- Va primero porque cada bloque de abajo lo consulta para saber si ya corrió.
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- 2. Estructura ---------------------------------------------------------
${bloques}

-- 3. Catálogo inicial ---------------------------------------------------
INSERT INTO "products"
  (slug, name, description, category, price, currency, sale_type, unit_label,
   min_quantity, max_quantity, quantity_step, presentation, image_url, image_alt,
   active, sort_order)
VALUES
${productos}
ON CONFLICT (slug) DO NOTHING;

-- 4. Puntos de retiro ---------------------------------------------------
-- Solo si no hay ninguno: dos puntos pueden llamarse igual en días distintos,
-- así que no hay clave natural para deduplicar fila por fila.
INSERT INTO "pickup_points"
  (name, address, weekday, time_from, time_to, cutoff_hours, instructions, active, sort_order)
SELECT * FROM (VALUES
${puntos}
) AS nuevos
WHERE NOT EXISTS (SELECT 1 FROM "pickup_points");

-- 5. Datos bancarios de ejemplo ----------------------------------------
-- Deliberadamente falsos: la confirmación del pedido los muestra en pantalla,
-- y una cuenta con pinta de real invita a transferir a un número que no existe.
-- Se reemplazan en /admin/configuracion. Solo se cargan si no hay nada.
INSERT INTO "store_settings"
  (id, bank_holder, bank_name, bank_account_type, bank_account, bank_document, bank_instructions)
VALUES
  (1, ${cita(c.bankHolder)}, ${cita(c.bankName)}, ${cita(c.bankAccountType)},
   ${cita(c.bankAccount)}, ${cita(c.bankDocument)}, ${cita(c.bankInstructions)})
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- 6. Comprobación -------------------------------------------------------
SELECT
  (SELECT count(*) FROM products) AS productos,
  (SELECT count(*) FROM products WHERE active) AS productos_activos,
  (SELECT count(*) FROM pickup_points WHERE active) AS puntos_activos,
  (SELECT count(*) FROM orders) AS pedidos,
  (SELECT bank_holder FROM store_settings WHERE id = 1) AS titular_bancario;
`);
