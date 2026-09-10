import "server-only";
import { unstable_cache } from "next/cache";

import { listarPuntosActivos, obtenerConfiguracion } from "@/db/queries-pedidos";
import { proximasFechas, type PatronDeRetiro, type PuntoParaElegir } from "@/lib/retiros";
import type { PickupPointRow, StoreSettingsRow } from "@/db/schema";

/** Etiquetas de caché que el panel invalida al guardar. */
export const TAG_PUNTOS = "puntos-de-retiro";
export const TAG_CONFIGURACION = "configuracion-tienda";

/** Cuántas fechas futuras se le ofrecen al cliente por cada punto. */
export const FECHAS_OFRECIDAS = 3;

export type { PuntoParaElegir };

const leerPuntos = unstable_cache(
  async (): Promise<PickupPointRow[]> => listarPuntosActivos(),
  ["puntos-activos"],
  { tags: [TAG_PUNTOS], revalidate: 300 },
);

const leerConfiguracion = unstable_cache(
  async (): Promise<StoreSettingsRow> => obtenerConfiguracion(),
  ["configuracion-tienda"],
  { tags: [TAG_CONFIGURACION], revalidate: 300 },
);


/**
 * Los puntos que el checkout puede ofrecer.
 *
 * Un punto sin fechas disponibles (todas pasaron el corte) se descarta: dejarlo
 * en pantalla sería ofrecer algo que después el servidor va a rechazar.
 *
 * Las fechas se calculan en cada pedido, no se cachean: la caché de los puntos
 * guarda la configuración, no el calendario, que cambia con el reloj.
 */
export async function puntosParaElegir(ahora: Date = new Date()): Promise<PuntoParaElegir[]> {
  const puntos = await leerPuntos();
  return puntos
    .map((punto) => ({
      id: punto.id,
      name: punto.name,
      address: punto.address,
      weekday: punto.weekday,
      timeFrom: punto.timeFrom,
      timeTo: punto.timeTo,
      instructions: punto.instructions,
      fechas: proximasFechas(patronDe(punto), FECHAS_OFRECIDAS, ahora),
    }))
    .filter((punto) => punto.fechas.length > 0);
}

export function patronDe(punto: PickupPointRow): PatronDeRetiro {
  return {
    weekday: punto.weekday,
    timeFrom: punto.timeFrom,
    timeTo: punto.timeTo,
    cutoffHours: punto.cutoffHours,
  };
}

export async function configuracionDeLaTienda(): Promise<StoreSettingsRow> {
  return leerConfiguracion();
}
