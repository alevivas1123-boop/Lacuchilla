import "server-only";

import { obtenerConfiguracion } from "@/db/queries-pedidos";
import { whatsappLink } from "@/config/site";
import { armarMensajeDePedido } from "@/lib/email/plantilla-pedido";
import { enviarEmail, type ResultadoEnvio } from "@/lib/email/enviar";
import type { OrderItemRow, OrderRow } from "@/db/schema";

/**
 * Manda la confirmación del pedido, si hay a quién.
 *
 * **No lanza nunca.** El pedido ya está guardado y cobrado cuando esto corre:
 * que el correo no salga es una molestia, no un motivo para hacer fallar una
 * compra. El cliente igual ve los datos bancarios en pantalla, que es la vía
 * principal; el email es la copia que se lleva.
 */
export async function enviarConfirmacionDePedido(
  pedido: OrderRow,
  lineas: OrderItemRow[],
): Promise<ResultadoEnvio> {
  if (!pedido.customerEmail) {
    return { enviado: false, proveedor: "ninguno", motivo: "El cliente no dejó correo." };
  }

  try {
    const configuracion = await obtenerConfiguracion();
    const mensaje = armarMensajeDePedido({
      pedido,
      lineas,
      configuracion,
      whatsapp: whatsappLink(`Hola, tengo el pedido ${pedido.orderNumber}.`),
      urlDelPedido: urlPublica(`/pedido-confirmado?id=${pedido.id}`),
    });

    return await enviarEmail({
      para: pedido.customerEmail,
      asunto: mensaje.asunto,
      html: mensaje.html,
      texto: mensaje.texto,
    });
  } catch (error) {
    console.error(
      `No se pudo preparar la confirmación del pedido ${pedido.orderNumber}:`,
      error instanceof Error ? error.message : error,
    );
    return { enviado: false, proveedor: "ninguno", motivo: "Falló al armar el mensaje." };
  }
}

/**
 * URL absoluta del sitio.
 *
 * En Vercel `VERCEL_PROJECT_PRODUCTION_URL` trae el dominio de producción sin
 * esquema. Si no hay ninguna, se devuelve `undefined` y el email sale sin el
 * enlace, en vez de con uno roto.
 */
function urlPublica(ruta: string): string | undefined {
  const base =
    process.env.SITIO_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}${ruta}`;
}
