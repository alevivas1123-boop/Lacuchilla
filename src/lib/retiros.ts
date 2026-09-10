/**
 * Fechas de retiro.
 *
 * El punto de retiro guarda un patrón semanal ("jueves de 17 a 19"); acá se
 * traduce a fechas concretas para que el cliente elija una y el pedido quede
 * atado a ella.
 *
 * Toda la aritmética se hace en hora de Uruguay, que es UTC-3 todo el año
 * (no hay horario de verano desde 2015). No se usa la zona del servidor:
 * en Vercel es UTC y las fechas se correrían tres horas.
 */

const DESFASE_UY = "-03:00";

export const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

export interface PatronDeRetiro {
  weekday: number;
  timeFrom: string;
  timeTo: string;
  cutoffHours: number;
}

/** "2026-09-18" a partir de un instante, en hora uruguaya. */
export function fechaUruguaya(instante: Date): string {
  const enUy = new Date(instante.getTime() - 3 * 60 * 60 * 1000);
  return enUy.toISOString().slice(0, 10);
}

/** Día de la semana (0 domingo … 6 sábado) de una fecha "YYYY-MM-DD". */
export function diaDeLaSemana(fecha: string): number {
  // Se ancla a mediodía UTC para que ningún desfase horario corra el día.
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

/** El instante exacto en que empieza el retiro, como Date en UTC. */
export function inicioDelRetiro(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00${DESFASE_UY}`);
}

/** Hasta cuándo se aceptan pedidos para esa fecha. */
export function cierreDePedidos(fecha: string, patron: PatronDeRetiro): Date {
  return new Date(
    inicioDelRetiro(fecha, patron.timeFrom).getTime() - patron.cutoffHours * 60 * 60 * 1000,
  );
}

/** Suma días a una fecha "YYYY-MM-DD" sin salirse del calendario. */
export function sumarDias(fecha: string, dias: number): string {
  const base = new Date(`${fecha}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

/**
 * Las próximas fechas concretas de un punto, ya descartadas las que pasaron
 * el corte. Devuelve como máximo `cantidad`.
 */
export function proximasFechas(
  patron: PatronDeRetiro,
  cantidad: number,
  ahora: Date = new Date(),
): string[] {
  const hoy = fechaUruguaya(ahora);
  const fechas: string[] = [];

  // Se recorren las próximas semanas hasta juntar las que hagan falta. El
  // tope evita un bucle infinito si la configuración es imposible.
  let candidata = hoy;
  const diasHastaElDia = (patron.weekday - diaDeLaSemana(hoy) + 7) % 7;
  candidata = sumarDias(hoy, diasHastaElDia);

  for (let i = 0; i < cantidad + 4 && fechas.length < cantidad; i += 1) {
    if (cierreDePedidos(candidata, patron) > ahora) fechas.push(candidata);
    candidata = sumarDias(candidata, 7);
  }

  return fechas;
}

/**
 * ¿Se puede pedir para esta fecha en este punto?
 *
 * Lo usa el servidor antes de guardar: no alcanza con que el cliente haya
 * elegido de una lista, porque la lista la manda el navegador.
 */
export function fechaDeRetiroValida(
  fecha: string,
  patron: PatronDeRetiro,
  ahora: Date = new Date(),
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  if (Number.isNaN(new Date(`${fecha}T12:00:00Z`).getTime())) return false;
  if (diaDeLaSemana(fecha) !== patron.weekday) return false;
  return cierreDePedidos(fecha, patron) > ahora;
}

/** "jueves 18 de setiembre" */
export function fechaLegible(fecha: string): string {
  const MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre",
  ];
  const d = new Date(`${fecha}T12:00:00Z`);
  return `${DIAS_SEMANA[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}

/** "jueves 18/9" — versión corta para tablas y listados. */
export function fechaCorta(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  return `${DIAS_SEMANA[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** "de 17:00 a 19:00" */
export function franjaHoraria(desde: string, hasta: string): string {
  return `de ${desde} a ${hasta}`;
}

/** Normaliza un teléfono uruguayo a solo dígitos con prefijo país. */
export function normalizarTelefono(entrada: string): string {
  const digitos = entrada.replace(/\D/g, "");
  if (digitos.startsWith("598")) return digitos;
  // Los celulares uruguayos se escriben 09X…; el prefijo país reemplaza al 0.
  if (digitos.startsWith("0")) return `598${digitos.slice(1)}`;
  return `598${digitos}`;
}

/**
 * Convierte lo que el admin escribe en el buscador en un fragmento de teléfono
 * comparable contra los teléfonos normalizados de la base.
 *
 * Devuelve `null` cuando el texto no tiene ningún dígito: buscar "maría" como
 * teléfono degeneraba en `%598%`, que coincide con todos los números del país.
 *
 * Se le sacan el prefijo país y el cero inicial para que `099 123 456`,
 * `+598 99 123 456` y `9912` encuentren al mismo cliente guardado como
 * `59899123456`.
 */
export function terminoTelefonico(entrada: string): string | null {
  const digitos = entrada.replace(/\D/g, "");
  if (!digitos) return null;
  const sinPais = digitos.startsWith("598") ? digitos.slice(3) : digitos;
  const sinCero = sinPais.startsWith("0") ? sinPais.slice(1) : sinPais;
  return sinCero || digitos;
}
