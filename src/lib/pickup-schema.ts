import { z } from "zod";

/**
 * Validación del ABM de puntos de retiro.
 *
 * Rige igual en el navegador y en el servidor, pero la que decide es la del
 * servidor. La base repite las reglas críticas como CHECK: el día tiene que
 * estar entre 0 y 6 y el corte no puede ser negativo.
 */

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const entero = (mensaje: string, minimo: number, maximo: number) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .transform((valor, ctx) => {
      if (!/^-?\d+$/.test(valor)) {
        ctx.addIssue({ code: "custom", message: mensaje });
        return z.NEVER;
      }
      const numero = Number(valor);
      if (numero < minimo || numero > maximo) {
        ctx.addIssue({ code: "custom", message: mensaje });
        return z.NEVER;
      }
      return numero;
    });

export const puntoSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Escribí el nombre del punto. Ej: Carrasco.")
      .max(80, "El nombre es demasiado largo."),
    address: z
      .string()
      .trim()
      .min(5, "Escribí la dirección completa.")
      .max(200, "La dirección es demasiado larga."),
    weekday: entero("Elegí el día de la semana.", 0, 6),
    timeFrom: z.string().trim().regex(HORA, "El horario va en formato 24 h. Ej: 17:00."),
    timeTo: z.string().trim().regex(HORA, "El horario va en formato 24 h. Ej: 19:00."),
    cutoffHours: entero("Las horas de corte van de 0 a 336 (dos semanas).", 0, 336),
    instructions: z
      .string()
      .trim()
      .max(300, "Máximo 300 caracteres.")
      .optional()
      .transform((valor) => valor || undefined),
    sortOrder: entero("El orden va de 0 a 999.", 0, 999),
    active: z.boolean(),
  })
  .superRefine((datos, ctx) => {
    // Un punto que cierra antes de abrir no describe ningún horario real y
    // dejaría al cliente eligiendo una franja imposible.
    if (datos.timeTo <= datos.timeFrom) {
      ctx.addIssue({
        code: "custom",
        path: ["timeTo"],
        message: "El horario de cierre tiene que ser posterior al de apertura.",
      });
    }
  });

export type PuntoFormValues = z.infer<typeof puntoSchema>;
