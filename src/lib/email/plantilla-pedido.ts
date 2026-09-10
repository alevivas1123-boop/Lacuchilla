import { formatearPesos } from "@/lib/money";
import { formatQuantity, unitLabelText } from "@/lib/format";
import { fechaLegible, franjaHoraria } from "@/lib/retiros";
import { datosBancariosCompletos } from "@/lib/settings-schema";
import type { OrderItemRow, OrderRow, StoreSettingsRow } from "@/db/schema";

/**
 * El email de confirmación del pedido.
 *
 * Es el único mensaje que el cliente recibe, así que tiene que bastarse solo:
 * cuánto transferir, a qué cuenta, y dónde y cuándo retirar. Quien lo abra en
 * el supermercado tres días después no debería tener que volver a la web.
 *
 * Se arma con los datos **copiados en el pedido**, no con la configuración de
 * hoy: si mañana cambia el horario del punto, el email que ya se mandó sigue
 * siendo cierto respecto de lo que se le prometió.
 */

export interface MensajeDePedido {
  asunto: string;
  html: string;
  texto: string;
}

/** Escapa lo que viene del cliente antes de meterlo en el HTML del email. */
function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function descripcionDeLinea(linea: OrderItemRow): string {
  const cantidad = formatQuantity(linea.quantity, linea.unitLabel);
  const base =
    linea.saleType === "weight" ? cantidad : `${cantidad} · ${linea.presentation}`;
  return `${base} · ${formatearPesos(linea.unitPrice)} ${unitLabelText(linea.unitLabel)}`;
}

export function armarMensajeDePedido({
  pedido,
  lineas,
  configuracion,
  whatsapp,
  urlDelPedido,
}: {
  pedido: OrderRow;
  lineas: OrderItemRow[];
  configuracion: StoreSettingsRow;
  /** Enlace de contacto, ya armado. */
  whatsapp: string;
  /** Enlace a la confirmación en la web, con el id opaco. */
  urlDelPedido?: string;
}): MensajeDePedido {
  const puedeCobrar = datosBancariosCompletos(configuracion);
  const total = formatearPesos(pedido.total);
  const cuando = `${fechaLegible(pedido.pickupDate)}, ${franjaHoraria(pedido.pickupTimeFrom, pedido.pickupTimeTo)}`;

  const asunto = `Tu pedido ${pedido.orderNumber} · La Cuchilla`;

  /* ── Texto plano ─────────────────────────────────────────────────────
     No es un accesorio: hay clientes de correo que no muestran HTML, y un
     mensaje solo-HTML tiene más chance de caer en spam. */
  const lineasTexto = lineas
    .map((l) => `  - ${l.productName} · ${descripcionDeLinea(l)} = ${formatearPesos(l.lineTotal)}`)
    .join("\n");

  const pago = puedeCobrar
    ? [
        "PARA PAGAR — transferencia bancaria",
        `  Monto:      ${total}`,
        `  Titular:    ${configuracion.bankHolder}`,
        configuracion.bankName ? `  Banco:      ${configuracion.bankName}` : "",
        configuracion.bankAccountType ? `  Tipo:       ${configuracion.bankAccountType}` : "",
        `  Cuenta:     ${configuracion.bankAccount}`,
        configuracion.bankDocument ? `  Cédula/RUT: ${configuracion.bankDocument}` : "",
        `  Referencia: ${pedido.orderNumber}`,
        configuracion.bankInstructions ? `\n  ${configuracion.bankInstructions}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : `PARA PAGAR\n  Escribinos por WhatsApp con tu número de pedido y te pasamos los datos\n  para transferir: ${whatsapp}`;

  const texto = [
    `Hola ${pedido.customerName}, recibimos tu pedido.`,
    "",
    `Número de pedido: ${pedido.orderNumber}`,
    "",
    pago,
    "",
    "DÓNDE Y CUÁNDO RETIRARLO",
    `  ${pedido.pickupPointName}`,
    `  ${pedido.pickupAddress}`,
    `  ${cuando}`,
    "",
    "TU PEDIDO",
    lineasTexto,
    `  Total: ${total}`,
    "",
    "Cuando veamos la transferencia dejamos tu pedido pronto para ese día.",
    "No hace falta que nos avises.",
    "",
    urlDelPedido ? `Ver el pedido: ${urlDelPedido}` : "",
    `Cualquier cosa, escribinos: ${whatsapp}`,
    "",
    "La Cuchilla — Quesos con carácter",
  ]
    .filter((linea) => linea !== undefined)
    .join("\n");

  /* ── HTML ────────────────────────────────────────────────────────────
     Tablas y estilos en línea, sin hojas de estilo ni imágenes externas: es
     lo único que renderiza parecido en Gmail, Outlook y Apple Mail. */
  const filasHtml = lineas
    .map(
      (l) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e8e0d4;">
            <div style="font-weight:600;color:#2E1B10;">${escapar(l.productName)}</div>
            <div style="font-size:13px;color:#6B5844;">${escapar(descripcionDeLinea(l))}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e8e0d4;text-align:right;white-space:nowrap;font-weight:600;color:#2E1B10;">
            ${escapar(formatearPesos(l.lineTotal))}
          </td>
        </tr>`,
    )
    .join("");

  const filaBanco = (etiqueta: string, valor: string | null, monoespaciada = false) =>
    valor
      ? `<tr>
           <td style="padding:6px 0;color:#6B5844;font-size:14px;">${escapar(etiqueta)}</td>
           <td style="padding:6px 0;text-align:right;color:#2E1B10;font-size:14px;${monoespaciada ? "font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:600;" : ""}">${escapar(valor)}</td>
         </tr>`
      : "";

  const bloquePago = puedeCobrar
    ? `
      <div style="background:#fffdf8;border:2px solid #d9c9a8;border-radius:12px;padding:20px;margin:24px 0;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#2E1B10;">Transferí para confirmar</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#6B5844;">
          Cuando veamos la transferencia dejamos tu pedido pronto para el día que elegiste.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:#f5efe2;border-radius:8px;padding:12px;margin-bottom:14px;">
          <tr>
            <td style="padding:10px 12px;color:#6B5844;font-size:14px;">Monto a transferir</td>
            <td style="padding:10px 12px;text-align:right;font-size:22px;font-weight:700;color:#2E1B10;">${escapar(total)}</td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${filaBanco("Titular", configuracion.bankHolder)}
          ${filaBanco("Banco", configuracion.bankName)}
          ${filaBanco("Tipo de cuenta", configuracion.bankAccountType)}
          ${filaBanco("Cuenta", configuracion.bankAccount, true)}
          ${filaBanco("Cédula / RUT", configuracion.bankDocument, true)}
          ${filaBanco("Referencia", pedido.orderNumber, true)}
        </table>

        ${
          configuracion.bankInstructions
            ? `<p style="margin:14px 0 0;padding:12px;background:#f5efe2;border-radius:8px;font-size:14px;line-height:1.5;color:#6B5844;">${escapar(configuracion.bankInstructions)}</p>`
            : ""
        }
      </div>`
    : `
      <div style="background:#fffdf8;border:2px solid #d9c9a8;border-radius:12px;padding:20px;margin:24px 0;">
        <h2 style="margin:0 0 8px;font-size:18px;color:#2E1B10;">Para pagar tu pedido</h2>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#6B5844;">
          Escribinos por WhatsApp con tu número de pedido y te pasamos los datos para transferir.
        </p>
        <a href="${escapar(whatsapp)}" style="display:inline-block;background:#2E1B10;color:#fdfaf3;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;font-size:15px;">Pedir los datos</a>
      </div>`;

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(asunto)}</title></head>
<body style="margin:0;padding:0;background:#f5efe2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe2;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#fffdf8;border-radius:16px;padding:28px 24px;text-align:left;">

          <tr><td>
            <p style="margin:0 0 4px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#7A8B5A;">La Cuchilla</p>
            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#2E1B10;">¡Recibimos tu pedido!</h1>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#6B5844;">
              Hola ${escapar(pedido.customerName)}, gracias por tu compra. Guardá este número:
            </p>

            <div style="background:#f5efe2;border-radius:10px;padding:14px 16px;margin-bottom:4px;">
              <div style="font-size:13px;color:#6B5844;">Número de pedido</div>
              <div style="font-size:20px;font-weight:700;letter-spacing:.04em;color:#2E1B10;">${escapar(pedido.orderNumber)}</div>
            </div>
          </td></tr>

          <tr><td>${bloquePago}</td></tr>

          <tr><td>
            <h2 style="margin:0 0 12px;font-size:18px;color:#2E1B10;">Dónde lo retirás</h2>
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#2E1B10;">${escapar(pedido.pickupPointName)}</p>
            <p style="margin:0 0 4px;font-size:14px;color:#6B5844;">${escapar(pedido.pickupAddress)}</p>
            <p style="margin:0 0 24px;font-size:15px;font-weight:600;color:#2E1B10;">${escapar(cuando)}</p>
          </td></tr>

          <tr><td>
            <h2 style="margin:0 0 4px;font-size:18px;color:#2E1B10;">Lo que pediste</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filasHtml}
              <tr>
                <td style="padding:14px 0 0;font-weight:600;color:#6B5844;">Total</td>
                <td style="padding:14px 0 0;text-align:right;font-size:20px;font-weight:700;color:#2E1B10;">${escapar(total)}</td>
              </tr>
            </table>
          </td></tr>

          ${
            pedido.notes
              ? `<tr><td><p style="margin:20px 0 0;padding:12px;background:#f5efe2;border-radius:8px;font-size:14px;line-height:1.5;color:#6B5844;"><strong style="color:#2E1B10;">Tu comentario:</strong> ${escapar(pedido.notes)}</p></td></tr>`
              : ""
          }

          <tr><td style="padding-top:24px;border-top:1px solid #e8e0d4;margin-top:24px;">
            <p style="margin:18px 0 12px;font-size:14px;line-height:1.6;color:#6B5844;">
              Cuando veamos la transferencia dejamos tu pedido pronto para ese día. No hace falta que nos avises.
            </p>
            ${
              urlDelPedido
                ? `<p style="margin:0 0 12px;font-size:14px;"><a href="${escapar(urlDelPedido)}" style="color:#2E1B10;">Ver tu pedido en la web</a></p>`
                : ""
            }
            <p style="margin:0;font-size:14px;color:#6B5844;">
              Cualquier cosa, <a href="${escapar(whatsapp)}" style="color:#2E1B10;">escribinos por WhatsApp</a>.
            </p>
          </td></tr>

        </table>
        <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#8B7A66;text-align:center;">
          La Cuchilla — Quesos con carácter
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { asunto, html, texto };
}
