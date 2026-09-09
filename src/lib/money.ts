/**
 * Precios en pesos uruguayos, siempre como entero.
 *
 * El negocio no maneja centésimos: los precios son pesos enteros ($390, $1.170).
 * Guardarlos como `integer` evita cualquier error de coma flotante en los
 * totales del carrito, que se calculan multiplicando y sumando enteros.
 */

/** 390 -> "$390". 1170 -> "$1.170". */
export function formatearPesos(pesos: number): string {
  const entero = Math.round(pesos);
  const signo = entero < 0 ? "-" : "";
  const conMiles = Math.abs(entero)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${signo}$${conMiles}`;
}

/**
 * Convierte lo que se escribió en el formulario a un precio entero.
 *
 * Acepta "390" y "1.170", donde el punto es separador de miles. Rechaza
 * cualquier cosa con decimales, incluido "390.5": borrar el punto sin mirar
 * lo convertiría en 3905, un precio diez veces mayor cargado por accidente.
 * Por eso el punto solo vale si separa grupos de exactamente tres dígitos.
 */
const MILES = /^\d{1,3}(\.\d{3})*$/;
const SOLO_DIGITOS = /^\d+$/;

export function parsearPesos(entrada: string | number): number | null {
  const texto = String(entrada).trim();
  if (texto === "") return null;
  if (!SOLO_DIGITOS.test(texto) && !MILES.test(texto)) return null;

  const valor = Number(texto.replace(/\./g, ""));
  return Number.isSafeInteger(valor) ? valor : null;
}
