/**
 * Dinero en centésimos, siempre como entero.
 *
 * Los precios se guardan y se operan en centésimos de peso uruguayo para no
 * arrastrar errores de coma flotante: $390 es 39000. La división por 100
 * ocurre solo al mostrar.
 */

/** 39000 -> "$390". 117000 -> "$1.170". */
export function formatearPesos(centesimos: number): string {
  const pesos = Math.round(centesimos) / 100;
  const negativo = pesos < 0;
  const absoluto = Math.abs(pesos);
  const entero = Math.trunc(absoluto);
  const decimales = Math.round((absoluto - entero) * 100);

  const conMiles = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cuerpo = decimales === 0 ? conMiles : `${conMiles},${String(decimales).padStart(2, "0")}`;
  return `${negativo ? "-" : ""}$${cuerpo}`;
}

/** "390" o "390,50" -> 39000 / 39050. Devuelve null si no es un número válido. */
export function pesosACentesimos(entrada: string | number): number | null {
  const texto = String(entrada).trim().replace(",", ".");
  if (texto === "" || !/^\d+(\.\d{1,2})?$/.test(texto)) return null;
  // Se redondea sobre el string ya normalizado para no depender del binario.
  const [enteros, decimales = ""] = texto.split(".");
  const centesimos = Number(enteros) * 100 + Number(decimales.padEnd(2, "0"));
  return Number.isSafeInteger(centesimos) ? centesimos : null;
}

/** 39000 -> "390" (para precargar un formulario). */
export function centesimosAPesos(centesimos: number): string {
  const pesos = centesimos / 100;
  return Number.isInteger(pesos) ? String(pesos) : pesos.toFixed(2);
}
