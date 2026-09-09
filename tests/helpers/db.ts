import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { BaseDeDatos } from "@/db/client";
import * as schema from "@/db/schema";

/**
 * PostgreSQL efímero en proceso para las pruebas.
 *
 * Es PostgreSQL de verdad (PGlite compila el motor a WebAssembly), así que
 * corre exactamente las mismas migraciones que Neon y respeta los CHECK y los
 * índices únicos. No es un mock.
 */
export async function baseDePrueba(): Promise<{ db: BaseDeDatos; cerrar: () => Promise<void> }> {
  const cliente = new PGlite();
  const db = drizzle(cliente, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return {
    db: db as unknown as BaseDeDatos,
    cerrar: () => cliente.close(),
  };
}
