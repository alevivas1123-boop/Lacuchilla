/**
 * Siembra el catálogo inicial en la base configurada en DATABASE_URL.
 *
 *   npm run db:seed
 *
 * Es idempotente: correrlo dos veces no duplica ni pisa cambios del panel.
 * Abre su propia conexión en lugar de reusar el cliente de la aplicación,
 * porque ese vive dentro de Next (`server-only`) y este script corre suelto.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { BaseDeDatos } from "../src/db/client";
import * as schema from "../src/db/schema";
import { sembrarCatalogo, sembrarConfiguracion, sembrarPuntos } from "../src/db/seed";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL. Definila antes de correr el seed.");
    process.exit(1);
  }

  const conexion = postgres(url, { max: 1, prepare: false });
  try {
    const db = drizzle(conexion, { schema }) as unknown as BaseDeDatos;
    const resultado = await sembrarCatalogo(db);
    console.log(
      `Catálogo: ${resultado.insertados} insertados, ` +
        `${resultado.existentes} ya existían. Total en la base: ${resultado.total}.`,
    );

    const puntos = await sembrarPuntos(db);
    console.log(
      puntos.insertados > 0
        ? `Puntos de retiro: ${puntos.insertados} creados.`
        : `Puntos de retiro: ya había ${puntos.total}, no se tocó ninguno.`,
    );

    const configuracion = await sembrarConfiguracion(db);
    console.log(
      configuracion.sembrada
        ? "Configuración: datos bancarios DE EJEMPLO cargados. Reemplazalos en /admin/configuracion."
        : "Configuración: ya había datos bancarios, no se tocaron.",
    );
  } finally {
    await conexion.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("El seed falló:", error instanceof Error ? error.message : error);
  process.exit(1);
});
