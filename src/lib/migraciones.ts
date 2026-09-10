/**
 * Qué migraciones están aplicadas y cuáles no.
 *
 * Vive acá y no dentro del script para poder probarlo: el informe de estado
 * existe para que nadie tenga que adivinar, así que equivocarse en este
 * criterio es peor que no tener informe.
 */

export interface MigracionDelRepo {
  tag: string;
  /** sha256 del .sql, que es lo que Drizzle guarda al aplicarla. */
  hash: string;
  /** La marca de tiempo del diario. Es por lo que Drizzle decide. */
  cuando: number;
}

export interface MigracionRegistrada {
  hash: string;
  created_at: number | string;
}

export type EstadoMigracion =
  | "aplicada"
  /** Aplicada, pero el .sql se editó después: el hash guardado ya no coincide. */
  | "aplicada-con-otro-contenido"
  | "pendiente";

export interface MigracionRevisada {
  tag: string;
  estado: EstadoMigracion;
}

/**
 * Clasifica cada migración según lo que Drizzle va a hacer con ella.
 *
 * **Drizzle decide por fecha, no por hash.** Su migrador toma la fila más
 * reciente de la tabla y aplica todo lo que tenga una marca posterior; nunca
 * comprueba si el hash de las anteriores coincide (ver `pg-core/dialect.js`).
 *
 * Comparar solo por hash da falsos pendientes: si un .sql se editó después de
 * haberse aplicado —como pasó con la migración inicial al pasar a precios
 * enteros— el hash guardado deja de coincidir, pero la migración está aplicada
 * y Drizzle la va a saltear igual. Marcarla como pendiente manda a alguien a
 * "arreglar" algo que no está roto.
 */
export function revisarMigraciones(
  delRepo: MigracionDelRepo[],
  registradas: MigracionRegistrada[],
): MigracionRevisada[] {
  const hashes = new Set(registradas.map((fila) => fila.hash));
  const ultimaMarca = registradas.reduce(
    (mayor, fila) => Math.max(mayor, Number(fila.created_at)),
    0,
  );

  return delRepo.map((migracion) => {
    if (hashes.has(migracion.hash)) return { tag: migracion.tag, estado: "aplicada" as const };

    // Una base sin ninguna fila no tiene nada aplicado, por más que la marca
    // de la migración sea vieja.
    const laVaASaltear = registradas.length > 0 && migracion.cuando <= ultimaMarca;
    return {
      tag: migracion.tag,
      estado: laVaASaltear ? ("aplicada-con-otro-contenido" as const) : ("pendiente" as const),
    };
  });
}

export function contar(revisadas: MigracionRevisada[]) {
  return {
    pendientes: revisadas.filter((m) => m.estado === "pendiente").length,
    conOtroContenido: revisadas.filter((m) => m.estado === "aplicada-con-otro-contenido").length,
  };
}
