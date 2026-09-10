import { z } from "zod";

import { parsearPesos } from "@/lib/money";

/**
 * Validación de la configuración del negocio.
 *
 * Son los datos bancarios que ve el cliente para transferir. Viven en la base
 * y no en el código porque son la única forma de cobrar: si cambia la cuenta,
 * el dueño no puede quedar esperando a que alguien despliegue.
 */

const texto = (maximo: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensaje)
    .optional()
    .transform((valor) => valor || null);

export const configuracionSchema = z
  .object({
    bankHolder: texto(120, "El titular es demasiado largo."),
    bankName: texto(80, "El nombre del banco es demasiado largo."),
    bankAccount: texto(60, "El número de cuenta es demasiado largo."),
    bankAccountType: texto(40, "El tipo de cuenta es demasiado largo."),
    bankDocument: texto(30, "El documento es demasiado largo."),
    bankInstructions: texto(500, "Máximo 500 caracteres."),
    minimumOrder: z
      .string()
      .trim()
      .optional()
      .transform((valor, ctx) => {
        if (!valor) return null;
        const pesos = parsearPesos(valor);
        if (pesos === null) {
          ctx.addIssue({
            code: "custom",
            message: "El mínimo va en pesos enteros, sin centésimos. Ej: 500.",
          });
          return z.NEVER;
        }
        if (pesos <= 0) {
          ctx.addIssue({ code: "custom", message: "El mínimo tiene que ser mayor que cero." });
          return z.NEVER;
        }
        return pesos;
      }),
  })
  .superRefine((datos, ctx) => {
    // Sin titular y número de cuenta la pantalla de confirmación no puede
    // decirle a nadie dónde transferir, que es su único trabajo.
    const empezoACargar = Boolean(
      datos.bankHolder || datos.bankName || datos.bankAccount || datos.bankAccountType,
    );
    if (!empezoACargar) return;

    if (!datos.bankHolder) {
      ctx.addIssue({ code: "custom", path: ["bankHolder"], message: "Falta el titular de la cuenta." });
    }
    if (!datos.bankAccount) {
      ctx.addIssue({ code: "custom", path: ["bankAccount"], message: "Falta el número de cuenta." });
    }
  });

export type ConfiguracionFormValues = z.infer<typeof configuracionSchema>;

/** true si hay lo mínimo para que alguien pueda transferir. */
export function datosBancariosCompletos(datos: {
  bankHolder: string | null;
  bankAccount: string | null;
}): boolean {
  return Boolean(datos.bankHolder?.trim() && datos.bankAccount?.trim());
}
