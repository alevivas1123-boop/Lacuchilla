/**
 * Aplica las migraciones pendientes contra DATABASE_URL.
 *
 *   npm run db:migrate
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL. Definila antes de migrar.");
    process.exit(1);
  }

  const conexion = postgres(url, { max: 1, prepare: false });
  try {
    await migrate(drizzle(conexion), { migrationsFolder: "./drizzle" });
    console.log("Migraciones aplicadas.");
  } finally {
    await conexion.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("La migración falló:", error instanceof Error ? error.message : error);
  process.exit(1);
});
