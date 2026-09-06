#!/usr/bin/env node
/**
 * Verificación previa al build: impide que el material provisorio llegue a
 * producción por descuido.
 *
 * - En cualquier build imprime un aviso con el inventario pendiente.
 * - En un build de PRODUCCIÓN corta el proceso, salvo que se autorice de forma
 *   explícita con PERMITIR_IMAGENES_PROVISORIAS=1.
 *
 * Se considera producción si VERCEL_ENV=production o si ENTORNO=produccion.
 * La idea es que publicar con estas fotos nunca sea un accidente: tiene que
 * ser una decisión que alguien tomó y dejó escrita.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rutaInventario = path.join(raiz, "src", "data", "provisional-images.json");

const ROJO = "\x1b[31m";
const AMBAR = "\x1b[33m";
const VERDE = "\x1b[32m";
const FUERTE = "\x1b[1m";
const TENUE = "\x1b[2m";
const FIN = "\x1b[0m";

function leerInventario() {
  try {
    return JSON.parse(fs.readFileSync(rutaInventario, "utf8"));
  } catch (error) {
    console.error(`${ROJO}No se pudo leer ${rutaInventario}${FIN}`);
    console.error(error.message);
    process.exit(1);
  }
}

const inventario = leerInventario();

if (inventario.length === 0) {
  console.log(`${VERDE}✓ No quedan imágenes provisorias. Vía libre para producción.${FIN}`);
  process.exit(0);
}

// Entradas que apuntan a un archivo inexistente: suele significar que la foto
// ya se reemplazó y falta borrar su entrada del inventario.
const huerfanas = inventario.filter(
  (imagen) => !fs.existsSync(path.join(raiz, "public", imagen.archivo.replace(/^\//, ""))),
);

const bloqueantes = inventario.filter((imagen) => imagen.nivel === "bloqueante");
const soloLicencia = inventario.length - bloqueantes.length;
const esProduccion =
  process.env.VERCEL_ENV === "production" || process.env.ENTORNO === "produccion";
const autorizado = process.env.PERMITIR_IMAGENES_PROVISORIAS === "1";

const linea = "─".repeat(74);
console.log("");
console.log(`${AMBAR}${linea}${FIN}`);
console.log(`${AMBAR}${FUERTE}  IMÁGENES PROVISORIAS EN EL PROYECTO${FIN}`);
console.log(`${AMBAR}${linea}${FIN}`);
console.log(
  `  ${inventario.length} imágenes son material provisorio y deben reemplazarse antes de\n` +
    `  publicar la tienda. ${FUERTE}${bloqueantes.length} tienen además un problema de contenido.${FIN}`,
);
console.log("");
for (const imagen of bloqueantes) {
  console.log(`  ${ROJO}●${FIN} ${FUERTE}${imagen.slug}${FIN} ${TENUE}(bloqueante)${FIN}`);
  console.log(`    ${TENUE}${imagen.motivo}${FIN}`);
}
if (soloLicencia > 0) {
  console.log(`  ${AMBAR}●${FIN} y ${soloLicencia} más con la licencia sin verificar.`);
}
if (huerfanas.length > 0) {
  console.log("");
  console.log(`  ${AMBAR}Atención:${FIN} ${huerfanas.length} entrada(s) apuntan a archivos que ya no existen:`);
  for (const imagen of huerfanas) console.log(`    ${TENUE}${imagen.archivo}${FIN}`);
  console.log(`  ${TENUE}Si ya reemplazaste esas fotos, borrá su entrada del inventario.${FIN}`);
}
console.log("");
console.log(`  ${TENUE}Detalle y procedimiento: IMAGE_REPLACEMENT_TODO.md${FIN}`);
console.log(`  ${TENUE}Inventario: src/data/provisional-images.json${FIN}`);
console.log(`${AMBAR}${linea}${FIN}`);
console.log("");

if (!esProduccion) {
  console.log(`${TENUE}  Build de desarrollo o vista previa: se continúa.${FIN}`);
  console.log("");
  process.exit(0);
}

if (autorizado) {
  console.log(
    `${AMBAR}  PERMITIR_IMAGENES_PROVISORIAS=1 está activo: se publica igual, a sabiendas.${FIN}`,
  );
  console.log("");
  process.exit(0);
}

console.error(`${ROJO}${FUERTE}  Build de producción detenido.${FIN}`);
console.error(
  `${ROJO}  Publicar con estas imágenes expone al negocio: hay material con licencia\n` +
    `  sin verificar, una marca ajena y una persona identificable.${FIN}`,
);
console.error("");
console.error("  Salidas posibles:");
console.error("    1. Reemplazar las fotos y borrar sus entradas del inventario.");
console.error(
  `    2. Publicar igual, de forma deliberada, definiendo la variable de entorno\n` +
    `       ${FUERTE}PERMITIR_IMAGENES_PROVISORIAS=1${FIN} (en Vercel: Settings -> Environment Variables).`,
);
console.error("");
process.exit(1);
