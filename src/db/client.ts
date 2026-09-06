import "server-only";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { env } from "@/lib/env";

/**
 * Tipo del acceso a datos, deliberadamente agnóstico del driver: en la
 * aplicación es postgres.js contra Neon, y en las pruebas es un PostgreSQL
 * efímero en proceso. Las consultas no distinguen entre uno y otro.
 */
export type BaseDeDatos = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Conexión a PostgreSQL (Neon en Vercel).
 *
 * Se crea perezosamente: importar este módulo no abre ninguna conexión ni
 * exige que DATABASE_URL exista. Así el build no depende de que la base esté
 * disponible; el error aparece recién cuando alguien consulta de verdad, y
 * dice qué variable falta.
 */
let conexion: ReturnType<typeof postgres> | undefined;
let instancia: BaseDeDatos | undefined;

export function getDb(): BaseDeDatos {
  if (!instancia) {
    conexion = postgres(env.databaseUrl(), {
      // En serverless conviene poca conexión por instancia: el pooler de Neon
      // se encarga del resto.
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
    instancia = drizzle(conexion, { schema });
  }
  return instancia;
}

/** Cierra la conexión. Solo se usa en scripts y pruebas. */
export async function cerrarDb(): Promise<void> {
  await conexion?.end({ timeout: 5 });
  conexion = undefined;
  instancia = undefined;
}
