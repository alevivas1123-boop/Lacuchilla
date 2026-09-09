/**
 * Genera un único archivo SQL con todo lo necesario para dejar la base lista:
 * la migración inicial, los 17 productos y el registro que usa Drizzle para
 * saber que la migración ya se aplicó.
 *
 *   npx tsx scripts/generar-sql-inicial.ts > setup-neon.sql
 *
 * Sirve para pegarlo en el editor SQL de Neon cuando no hay una terminal a
 * mano. Es idempotente: correrlo dos veces no rompe ni duplica nada.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { filasDelSeed } from "../src/db/seed";

const raiz = process.cwd();
const sqlMigracion = fs.readFileSync(path.join(raiz, "drizzle", "0000_inicial.sql"), "utf8");
const diario = JSON.parse(
  fs.readFileSync(path.join(raiz, "drizzle", "meta", "_journal.json"), "utf8"),
);

// Drizzle identifica cada migración por el sha256 de su SQL.
const hash = createHash("sha256").update(sqlMigracion).digest("hex");
const cuando = diario.entries[0].when;

const cita = (valor: string | null | undefined) =>
  valor === null || valor === undefined ? "NULL" : `'${valor.replace(/'/g, "''")}'`;

const filas = filasDelSeed();
const valores = filas
  .map(
    (f) =>
      `  (${cita(f.slug)}, ${cita(f.name)}, ${cita(f.description as string)}, ${cita(f.category)}::product_category, ` +
      `${f.price}, 'UYU', ${cita(f.saleType)}::sale_type, ${cita(f.unitLabel)}, ` +
      `${f.minQuantity}, ${f.maxQuantity}, ${f.quantityStep}, ${cita(f.presentation)}, ` +
      `${cita(f.imageUrl as string)}, ${cita(f.imageAlt as string)}, true, ${f.sortOrder})`,
  )
  .join(",\n");

// La migración usa "--> statement-breakpoint" como separador; para pegar en un
// editor SQL alcanza con quitarlo.
const migracionLimpia = sqlMigracion.split("--> statement-breakpoint").join("").trim();

process.stdout.write(`-- ═══════════════════════════════════════════════════════════════════════
-- La Cuchilla · preparación de la base de datos
--
-- Pegá TODO esto en el editor SQL de Neon y ejecutalo una vez.
-- Crea la tabla de productos y carga los 17 productos del catálogo.
--
-- Es seguro ejecutarlo más de una vez: no duplica productos ni pisa cambios
-- hechos desde el panel de administración.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Estructura ---------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "public"."product_category" AS ENUM('quesos', 'dulces', 'otros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."sale_type" AS ENUM('weight', 'unit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

${migracionLimpia
  .replace(/CREATE TYPE[^;]+;/g, "")
  .replace(/CREATE TABLE "products"/, 'CREATE TABLE IF NOT EXISTS "products"')
  .replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "')
  .replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "')
  .trim()}

-- 2. Catálogo inicial ---------------------------------------------------
INSERT INTO "products"
  (slug, name, description, category, price, currency, sale_type, unit_label,
   min_quantity, max_quantity, quantity_step, presentation, image_url, image_alt,
   active, sort_order)
VALUES
${valores}
ON CONFLICT (slug) DO NOTHING;

-- 3. Registro de migración ----------------------------------------------
-- Para que un futuro \`npm run db:migrate\` sepa que esto ya está aplicado y
-- no intente crear la tabla de nuevo.
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
SELECT '${hash}', ${cuando}
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = '${hash}'
);

COMMIT;

-- 4. Comprobación -------------------------------------------------------
SELECT count(*) AS productos, count(*) FILTER (WHERE active) AS activos FROM products;
`);
