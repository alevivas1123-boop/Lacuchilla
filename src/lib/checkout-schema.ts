import { z } from "zod";

export const checkoutSchema = z
  .object({
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
    email: z
      .union([z.literal(""), z.email("Revisá el correo: parece incompleto.")])
      .optional(),
    fulfillment: z.enum(["envio", "retiro"]),
    address: z.string().trim().max(120, "La dirección es demasiado larga.").optional(),
    locality: z.string().trim().max(80, "La localidad es demasiado larga.").optional(),
    preferredTime: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500, "Máximo 500 caracteres.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment !== "envio") return;

    if (!data.address || data.address.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Para envío necesitamos la dirección completa.",
      });
    }
    if (!data.locality || data.locality.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["locality"],
        message: "Indicá la localidad o el departamento.",
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
