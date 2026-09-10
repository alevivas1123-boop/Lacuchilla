"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";

import { listarProductosPublicos } from "@/db/queries";
import { crearPedido, listarPuntosActivos, obtenerPedido, type LineaNueva } from "@/db/queries-pedidos";
import { enviarConfirmacionDePedido } from "@/lib/email/confirmacion-de-pedido";
import { checkoutSchema } from "@/lib/checkout-schema";
import { registrarFallo, revisarIntentos } from "@/lib/rate-limit";
import { fechaDeRetiroValida } from "@/lib/retiros";
import { patronDe, TAG_PUNTOS } from "@/lib/retiros.server";
import { ajustarCantidad, type CartItem } from "@/lib/types";

export interface PedidoCreado {
  ok: true;
  /** Identificador opaco del pedido; es lo que viaja en la URL de confirmación. */
  id: string;
  orderNumber: string;
}

export interface PedidoRechazado {
  ok: false;
  mensaje: string;
  /** Errores por campo del formulario. */
  errores?: Record<string, string>;
  /**
   * Qué cambió en el carrito mientras la persona completaba sus datos. Si esto
   * viene con contenido, el carrito se reemplaza y hay que confirmar de nuevo.
   */
  avisos?: string[];
  items?: CartItem[];
}

export type ResultadoPedido = PedidoCreado | PedidoRechazado;

/** Número visible del pedido: LC-AAMMDD-XXXX. */
function numeroDePedido(fecha = new Date()): string {
  const yy = String(fecha.getFullYear()).slice(-2);
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  const azar = Math.floor(1000 + Math.random() * 9000);
  return `LC-${yy}${mm}${dd}-${azar}`;
}

/** Identifica al visitante para el freno de intentos, sin guardar nada de él. */
async function claveDelCliente(): Promise<string> {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for");
  return `pedido:${reenviada?.split(",")[0]?.trim() || cabeceras.get("x-real-ip") || "desconocido"}`;
}

/**
 * Crea el pedido.
 *
 * No hay cuenta de cliente, así que la acción es pública, pero **nada de lo
 * que manda el navegador se toma por cierto**: los precios, el punto y la
 * fecha se vuelven a leer de la base y el total se recalcula acá. Lo que viaja
 * del cliente es solo qué producto y cuánto.
 */
export async function crearPedidoDesdeElCheckout(
  datosDelFormulario: unknown,
  items: CartItem[],
): Promise<ResultadoPedido> {
  const clave = await claveDelCliente();
  const limite = revisarIntentos(clave);
  if (!limite.permitido) {
    return {
      ok: false,
      mensaje: `Recibimos varios intentos seguidos. Probá de nuevo en ${Math.ceil(limite.esperaSegundos / 60)} minutos.`,
    };
  }

  const analisis = checkoutSchema.safeParse(datosDelFormulario);
  if (!analisis.success) {
    const errores: Record<string, string> = {};
    for (const problema of analisis.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !errores[campo]) errores[campo] = problema.message;
    }
    return { ok: false, mensaje: "Revisá los campos marcados.", errores };
  }
  const datos = analisis.data;

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, mensaje: "Tu carrito está vacío." };
  }

  /* ── El punto y la fecha ───────────────────────────────────────────── */

  let puntos;
  let catalogo;
  try {
    [puntos, catalogo] = await Promise.all([listarPuntosActivos(), listarProductosPublicos()]);
  } catch {
    return {
      ok: false,
      mensaje: "No pudimos confirmar tu pedido en este momento. Probá de nuevo en unos minutos.",
    };
  }

  const punto = puntos.find((candidato) => candidato.id === datos.pickupPointId);
  if (!punto) {
    // La página ofreció un punto que la base ya no tiene: la lista cacheada
    // quedó vieja. Se expira acá para que al recargar aparezcan los puntos
    // reales, en vez de dejar a la persona eligiendo opciones que no existen.
    updateTag(TAG_PUNTOS);
    return {
      ok: false,
      mensaje: "Ese punto de retiro ya no está disponible. Elegí otro.",
      errores: { pickupPointId: "Elegí un punto de retiro." },
    };
  }

  // La lista de fechas la arma el navegador; el corte lo decide el servidor.
  if (!fechaDeRetiroValida(datos.pickupDate, patronDe(punto))) {
    return {
      ok: false,
      mensaje: "Esa fecha de retiro ya no está disponible. Elegí otra.",
      errores: { pickupDate: "Elegí una fecha disponible." },
    };
  }

  /* ── Los productos y el total ──────────────────────────────────────── */

  const porSlug = new Map(catalogo.map((producto) => [producto.slug, producto]));
  const avisos: string[] = [];
  const revalidados: CartItem[] = [];
  const lineas: LineaNueva[] = [];

  for (const item of items) {
    const producto = porSlug.get(item.slug);

    if (!producto) {
      avisos.push(`${item.name} ya no está disponible y se quitó del pedido.`);
      continue;
    }

    const cantidad = ajustarCantidad(item.quantity, producto);
    if (cantidad !== item.quantity) {
      avisos.push(`La cantidad de ${producto.name} se ajustó a ${cantidad} ${producto.unitLabel}.`);
    }
    if (producto.price !== item.unitPrice) {
      avisos.push(`El precio de ${producto.name} cambió y se actualizó en tu pedido.`);
    }

    revalidados.push({
      id: producto.slug,
      slug: producto.slug,
      name: producto.name,
      category: producto.category,
      saleType: producto.saleType,
      unitLabel: producto.unitLabel,
      presentation: producto.presentation,
      unitPrice: producto.price,
      quantity: cantidad,
      minQuantity: producto.minQuantity,
      maxQuantity: producto.maxQuantity,
      quantityStep: producto.quantityStep,
      imageUrl: producto.imageUrl,
    });

    lineas.push({
      productId: producto.id,
      productName: producto.name,
      productSlug: producto.slug,
      presentation: producto.presentation,
      unitLabel: producto.unitLabel,
      saleType: producto.saleType,
      unitPrice: producto.price,
      quantity: cantidad,
    });
  }

  if (lineas.length === 0) {
    return {
      ok: false,
      mensaje: "Los productos de tu pedido ya no están disponibles.",
      items: [],
      avisos,
    };
  }

  if (avisos.length > 0) {
    // No se guarda nada: nadie tiene que terminar comprando a un precio o una
    // cantidad distintos de los que vio en pantalla.
    return {
      ok: false,
      mensaje: "Tu pedido cambió. Revisalo y confirmá otra vez.",
      avisos,
      items: revalidados,
    };
  }

  const total = lineas.reduce((suma, linea) => suma + linea.unitPrice * linea.quantity, 0);

  /* ── Guardar ───────────────────────────────────────────────────────── */

  // El número lleva cuatro dígitos al azar: dos pedidos del mismo día pueden
  // chocar. Se reintenta con otro número en vez de fallarle a la persona.
  for (let intento = 0; intento < 5; intento += 1) {
    try {
      const pedido = await crearPedido({
        orderNumber: numeroDePedido(),
        cliente: {
          name: datos.fullName,
          phone: datos.phone,
          email: datos.email || null,
        },
        punto,
        pickupDate: datos.pickupDate,
        notes: datos.notes || null,
        total,
        lineas,
      });
      // La confirmación por correo va después de que el pedido está guardado, y
      // su resultado no cambia el de la compra: si el correo falla, el pedido
      // ya existe y el cliente igual ve los datos bancarios en pantalla.
      try {
        const guardado = await obtenerPedido(pedido.id);
        if (guardado) await enviarConfirmacionDePedido(guardado.pedido, guardado.lineas);
      } catch (error) {
        console.error(
          `El pedido ${pedido.orderNumber} se guardó, pero falló la confirmación por correo:`,
          error instanceof Error ? error.message : error,
        );
      }

      return { ok: true, id: pedido.id, orderNumber: pedido.orderNumber };
    } catch (error) {
      if (esNumeroRepetido(error) && intento < 4) continue;
      // El error de la base nunca se le devuelve al cliente: puede traer
      // detalles internos. Queda en los registros del servidor.
      console.error(
        "No se pudo crear el pedido:",
        error instanceof Error ? error.message : error,
      );
      registrarFallo(clave);
      return {
        ok: false,
        mensaje: "No pudimos guardar tu pedido. Probá de nuevo en unos minutos.",
      };
    }
  }

  return { ok: false, mensaje: "No pudimos guardar tu pedido. Probá de nuevo en unos minutos." };
}

/** ¿El error es la colisión del número de pedido y no otra cosa? */
function esNumeroRepetido(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : String(error);
  return mensaje.includes("orders_number_unique");
}
