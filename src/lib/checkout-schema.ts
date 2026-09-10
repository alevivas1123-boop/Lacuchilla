import { z } from "zod";

/**
 * Validación del checkout.
 *
 * La operación son dos puntos fijos con día fijo, así que no se pregunta
 * "envío o retiro" ni se pide dirección: se elige un punto y una de sus
 * próximas fechas. El servidor vuelve a verificar que esa fecha caiga en el
 * día del punto y respete el corte; acá solo se atajan los errores obvios
 * antes de mandar el formulario.
 */

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Escribí tu nombre y apellido.")
    .max(80, "El nombre es demasiado largo."),
  phone: z
    .string()
    .trim()
    .min(8, "Necesitamos un teléfono para coordinar el pedido.")
    .max(25, "El teléfono es demasiado largo.")
    .regex(/^[0-9+()\s-]+$/, "Usá solo números, espacios y los signos + ( ) -"),
  email: z.union([z.literal(""), z.email("Revisá el correo: parece incompleto.")]).optional(),
  pickupPointId: z.uuid("Elegí dónde vas a retirar el pedido."),
  pickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí el día en que vas a retirar."),
  notes: z.string().trim().max(500, "Máximo 500 caracteres.").optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
