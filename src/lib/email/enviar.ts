import "server-only";

/**
 * Envío de correo.
 *
 * El proveedor todavía no está decidido, así que el envío vive detrás de esta
 * interfaz. El resto del código arma el mensaje y llama a `enviarEmail`; el
 * día que elijamos Resend, Postmark, SES o SMTP, se agrega un caso acá y no se
 * toca nada más.
 *
 * Mientras tanto hay dos modos, según `EMAIL_PROVEEDOR`:
 *
 *   - sin definir  → no se envía nada y se dice por qué (producción hoy)
 *   - "consola"    → se escribe el mensaje en los registros, para poder
 *                    revisarlo en desarrollo sin dar de alta ningún servicio
 *
 * **Nunca lanza.** Un pedido cobrado no puede fallar porque el correo no salió.
 */

export interface MensajeEmail {
  para: string;
  asunto: string;
  html: string;
  texto: string;
}

export interface ResultadoEnvio {
  enviado: boolean;
  proveedor: string;
  /** Por qué no se envió, cuando corresponde. */
  motivo?: string;
}

export function proveedorConfigurado(): string {
  return (process.env.EMAIL_PROVEEDOR ?? "").trim().toLowerCase();
}

export async function enviarEmail(mensaje: MensajeEmail): Promise<ResultadoEnvio> {
  const proveedor = proveedorConfigurado();

  if (!proveedor) {
    return {
      enviado: false,
      proveedor: "ninguno",
      motivo: "EMAIL_PROVEEDOR no está definido: todavía no hay proveedor de correo.",
    };
  }

  if (proveedor === "consola") {
    // Sirve para leer el mensaje tal cual saldría, sin dar de alta un servicio.
    console.info(
      [
        "── Email (modo consola, no se envió) ──",
        `Para:   ${mensaje.para}`,
        `Asunto: ${mensaje.asunto}`,
        "",
        mensaje.texto,
        "───────────────────────────────────────",
      ].join("\n"),
    );
    return { enviado: true, proveedor: "consola" };
  }

  // Acá va el proveedor real cuando se elija. Ver docs/emails.md.
  return {
    enviado: false,
    proveedor,
    motivo: `El proveedor "${proveedor}" todavía no está implementado.`,
  };
}
