/**
 * PostgreSQL local para desarrollo, sin instalar nada.
 *
 *   npm run db:local
 *
 * Levanta PGlite —PostgreSQL compilado a WebAssembly— escuchando en un socket
 * TCP, así que la aplicación se conecta igual que a Neon. Sirve para trabajar
 * sin una base en la nube y para probar migraciones antes de aplicarlas.
 *
 * Los datos quedan en .pglite/ (ignorado por git). Es SOLO para desarrollo:
 * en Vercel se usa Neon.
 *
 * Con el servidor levantado, en otra terminal:
 *   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres npm run db:migrate
 *   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres npm run db:seed
 */
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PUERTO = Number(process.env.PUERTO_DB_LOCAL ?? 5433);
const directorio = path.resolve(process.cwd(), ".pglite");

const db = await PGlite.create(directorio);
const servidor = new PGLiteSocketServer({ db, port: PUERTO, host: "127.0.0.1" });
await servidor.start();

console.log(`PostgreSQL local escuchando en 127.0.0.1:${PUERTO}`);
console.log(`Datos en ${directorio}`);
console.log(`\nDATABASE_URL=postgresql://postgres:postgres@127.0.0.1:${PUERTO}/postgres\n`);
console.log("Atiende una conexión por vez: cerrá la app antes de usar psql.");

for (const senal of ["SIGINT", "SIGTERM"]) {
  process.on(senal, async () => {
    await servidor.stop();
    await db.close();
    process.exit(0);
  });
}
