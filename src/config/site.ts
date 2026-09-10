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
    /** Número real de WhatsApp, en formato internacional y sin signos. */
    whatsappNumber: "59899617718",
    /** Cómo se muestra el número en pantalla. */
    whatsappDisplay: "+598 99 617 718",

    /*
     * Los campos de abajo se dejan vacíos a propósito: la web omite del
     * contacto y del pie cualquier dato que esté en blanco, así no se muestra
     * información inventada. Completalos cuando el negocio los confirme.
     */
    /** Usuario de Instagram. Ej: "@lacuchilla.uy". Vacío = no se muestra. */
    instagramHandle: "",
    instagramUrl: "",
    /** Dirección del local o punto de retiro. Vacío = no se muestra. */
    address: "",
    /** Email de contacto. Vacío = no se muestra. */
    email: "",
    /** Horarios de atención. Lista vacía = no se muestra la tarjeta. */
    hours: [
      { days: "Lunes a viernes", time: "9:00 a 18:00" },
      { days: "Sábados", time: "9:00 a 13:00" },
      { days: "Domingos", time: "Cerrado" },
    ],
  },

  /** Mensaje único sobre cómo se cobra el pedido. */
  paymentNotice:
    "Se paga por transferencia bancaria. Al confirmar el pedido te mostramos los datos para transferir.",
};

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${siteConfig.contact.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
