/**
 * Datos de contacto y configuración general del sitio.
 *
 * TODO (La Cuchilla): reemplazar los valores marcados como PLACEHOLDER
 * por los datos reales del negocio. Todo lo que se muestra en la web
 * (header, contacto, footer, checkout) sale de este archivo.
 */
export const siteConfig = {
  name: "La Cuchilla",
  tagline: "Quesos con carácter",
  shortDescription:
    "Quesería artesanal uruguaya. Quesos, dulces y sabores seleccionados para compartir todos los días.",
  /** PLACEHOLDER: dominio definitivo cuando esté publicado. */
  url: "https://lacuchilla.uy",
  locale: "es_UY",
  currency: "UYU",

  contact: {
    /** PLACEHOLDER: número real de WhatsApp en formato internacional, sin signos. */
    whatsappNumber: "59800000000",
    /** PLACEHOLDER: cómo se muestra el número en pantalla. */
    whatsappDisplay: "+598 00 000 000",
    /** PLACEHOLDER: usuario de Instagram. */
    instagramHandle: "@lacuchilla.uy",
    instagramUrl: "https://instagram.com/lacuchilla.uy",
    /** PLACEHOLDER: dirección del local o punto de retiro. */
    address: "Camino de la Cuchilla s/n, Uruguay",
    /** PLACEHOLDER: email de contacto (opcional, se puede dejar vacío). */
    email: "hola@lacuchilla.uy",
    /** PLACEHOLDER: horarios de atención. */
    hours: [
      { days: "Lunes a viernes", time: "9:00 a 18:00" },
      { days: "Sábados", time: "9:00 a 13:00" },
      { days: "Domingos", time: "Cerrado" },
    ],
  },

  /** Mensaje único sobre cómo se cobra el pedido en esta etapa. */
  paymentNotice:
    "El pago se coordinará mediante transferencia bancaria una vez confirmado el pedido.",
} as const;

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${siteConfig.contact.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
