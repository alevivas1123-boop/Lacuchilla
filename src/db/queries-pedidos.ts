import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";

import { getDb, type BaseDeDatos } from "@/db/client";
import {
  customers,
  orderItems,
  orders,
  pickupPoints,
  storeSettings,
  type NewPickupPointRow,
  type OrderItemRow,
  type OrderRow,
  type OrderStatus,
  type PickupPointRow,
  type StoreSettingsRow,
} from "@/db/schema";
import { fechaUruguaya, normalizarTelefono, terminoTelefonico } from "@/lib/retiros";

/* ── Puntos de retiro ─────────────────────────────────────────────────── */

export async function listarPuntosActivos(db: BaseDeDatos = getDb()): Promise<PickupPointRow[]> {
  return db
    .select()
    .from(pickupPoints)
    .where(eq(pickupPoints.active, true))
    .orderBy(asc(pickupPoints.sortOrder), asc(pickupPoints.name));
}

export async function listarPuntos(db: BaseDeDatos = getDb()): Promise<PickupPointRow[]> {
  return db
    .select()
    .from(pickupPoints)
    .orderBy(asc(pickupPoints.sortOrder), asc(pickupPoints.name));
}

export async function obtenerPunto(
  id: string,
  db: BaseDeDatos = getDb(),
): Promise<PickupPointRow | undefined> {
  const [fila] = await db.select().from(pickupPoints).where(eq(pickupPoints.id, id)).limit(1);
  return fila;
}

export async function crearPunto(
  datos: NewPickupPointRow,
  db: BaseDeDatos = getDb(),
): Promise<PickupPointRow> {
  const [fila] = await db.insert(pickupPoints).values(datos).returning();
  return fila;
}

export async function actualizarPunto(
  id: string,
  datos: Partial<NewPickupPointRow>,
  db: BaseDeDatos = getDb(),
): Promise<PickupPointRow | undefined> {
  const [fila] = await db
    .update(pickupPoints)
    .set({ ...datos, updatedAt: new Date() })
    .where(eq(pickupPoints.id, id))
    .returning();
  return fila;
}

/** Baja lógica del punto. Los pedidos históricos conservan su copia de los datos. */
export async function cambiarEstadoPunto(
  id: string,
  active: boolean,
  db: BaseDeDatos = getDb(),
): Promise<PickupPointRow | undefined> {
  const [fila] = await db
    .update(pickupPoints)
    .set({ active, updatedAt: new Date() })
    .where(eq(pickupPoints.id, id))
    .returning();
  return fila;
}

/* ── Configuración ────────────────────────────────────────────────────── */

/** Siempre devuelve una fila: la crea vacía si todavía no existe. */
export async function obtenerConfiguracion(
  db: BaseDeDatos = getDb(),
): Promise<StoreSettingsRow> {
  const [fila] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  if (fila) return fila;

  const [nueva] = await db
    .insert(storeSettings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();
  if (nueva) return nueva;

  const [existente] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  return existente;
}

export async function guardarConfiguracion(
  datos: Partial<StoreSettingsRow>,
  db: BaseDeDatos = getDb(),
): Promise<StoreSettingsRow> {
  const [fila] = await db
    .insert(storeSettings)
    .values({ ...datos, id: 1, updatedAt: new Date() })
    .onConflictDoUpdate({ target: storeSettings.id, set: { ...datos, updatedAt: new Date() } })
    .returning();
  return fila;
}

/* ── Clientes ─────────────────────────────────────────────────────────── */

/**
 * Busca al cliente por teléfono normalizado o lo crea. Si ya existía, se le
 * actualiza el nombre y el email: vale el último dato que dejó.
 */
export async function asegurarCliente(
  datos: { name: string; phone: string; email?: string | null },
  db: BaseDeDatos = getDb(),
): Promise<string> {
  const phone = normalizarTelefono(datos.phone);
  const [fila] = await db
    .insert(customers)
    .values({ phone, name: datos.name, email: datos.email ?? null })
    .onConflictDoUpdate({
      target: customers.phone,
      set: { name: datos.name, email: datos.email ?? null, updatedAt: new Date() },
    })
    .returning({ id: customers.id });
  return fila.id;
}

export interface ClienteConHistorial {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  pedidos: number;
  gastado: number;
  ultimoPedido: Date | null;
}

export async function listarClientes(
  busqueda?: string,
  db: BaseDeDatos = getDb(),
): Promise<ClienteConHistorial[]> {
  const texto = busqueda?.trim();
  let condicion = undefined;
  if (texto) {
    const telefono = terminoTelefonico(texto);
    const alternativas = [ilike(customers.name, `%${texto}%`)];
    if (telefono) alternativas.push(ilike(customers.phone, `%${telefono}%`));
    condicion = or(...alternativas);
  }

  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      pedidos: sql<number>`count(${orders.id})::int`,
      // Solo cuenta lo que efectivamente se cobró.
      gastado: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelado' and ${orders.paidAt} is not null), 0)::int`,
      ultimoPedido: sql<Date | null>`max(${orders.createdAt})`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .where(condicion)
    .groupBy(customers.id)
    .orderBy(desc(sql`max(${orders.createdAt})`));
}

/* ── Pedidos ──────────────────────────────────────────────────────────── */

export interface LineaNueva {
  productId: string;
  productName: string;
  productSlug: string;
  presentation: string;
  unitLabel: string;
  saleType: "weight" | "unit";
  unitPrice: number;
  quantity: number;
}

export interface PedidoNuevo {
  orderNumber: string;
  cliente: { name: string; phone: string; email?: string | null };
  punto: PickupPointRow;
  pickupDate: string;
  notes?: string | null;
  total: number;
  lineas: LineaNueva[];
}

/**
 * Crea el pedido, sus líneas y el cliente en una sola transacción: o queda
 * todo, o no queda nada. Un pedido sin líneas sería peor que ningún pedido.
 */
export async function crearPedido(
  datos: PedidoNuevo,
  db: BaseDeDatos = getDb(),
): Promise<OrderRow> {
  return db.transaction(async (tx) => {
    const customerId = await asegurarCliente(datos.cliente, tx as BaseDeDatos);

    const [pedido] = await tx
      .insert(orders)
      .values({
        orderNumber: datos.orderNumber,
        status: "pendiente_pago",
        customerId,
        customerName: datos.cliente.name,
        customerPhone: normalizarTelefono(datos.cliente.phone),
        customerEmail: datos.cliente.email ?? null,
        pickupPointId: datos.punto.id,
        pickupDate: datos.pickupDate,
        // Copia del punto: el pedido tiene que seguir diciendo dónde era
        // aunque después se edite o se dé de baja.
        pickupPointName: datos.punto.name,
        pickupAddress: datos.punto.address,
        pickupTimeFrom: datos.punto.timeFrom,
        pickupTimeTo: datos.punto.timeTo,
        notes: datos.notes ?? null,
        total: datos.total,
        paymentMethod: "transferencia",
      })
      .returning();

    await tx.insert(orderItems).values(
      datos.lineas.map((linea) => ({
        orderId: pedido.id,
        productId: linea.productId,
        productName: linea.productName,
        productSlug: linea.productSlug,
        presentation: linea.presentation,
        unitLabel: linea.unitLabel,
        saleType: linea.saleType,
        unitPrice: linea.unitPrice,
        quantity: linea.quantity,
        lineTotal: linea.unitPrice * linea.quantity,
      })),
    );

    return pedido;
  });
}

export interface FiltrosPedidos {
  estado?: OrderStatus | "todos";
  puntoId?: string;
  fecha?: string;
  busqueda?: string;
  /** Solo pedidos con retiro de esta fecha en adelante. */
  desde?: string;
  limite?: number;
}

export async function listarPedidos(
  filtros: FiltrosPedidos = {},
  db: BaseDeDatos = getDb(),
): Promise<OrderRow[]> {
  const condiciones = [];
  if (filtros.estado && filtros.estado !== "todos") {
    condiciones.push(eq(orders.status, filtros.estado));
  }
  if (filtros.puntoId) condiciones.push(eq(orders.pickupPointId, filtros.puntoId));
  if (filtros.fecha) condiciones.push(eq(orders.pickupDate, filtros.fecha));
  // Por defecto el panel mira hacia adelante: los pedidos viejos no son
  // trabajo pendiente y con el tiempo serían la mayoría de la lista.
  if (filtros.desde) condiciones.push(gte(orders.pickupDate, filtros.desde));
  if (filtros.busqueda?.trim()) {
    const texto = filtros.busqueda.trim();
    const telefono = terminoTelefonico(texto);
    const alternativas = [
      ilike(orders.customerName, `%${texto}%`),
      ilike(orders.orderNumber, `%${texto}%`),
    ];
    if (telefono) alternativas.push(ilike(orders.customerPhone, `%${telefono}%`));
    condiciones.push(or(...alternativas));
  }

  return db
    .select()
    .from(orders)
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(asc(orders.pickupDate), desc(orders.createdAt))
    .limit(filtros.limite ?? 200);
}

/** Cuántos pedidos esperan que el dueño verifique la transferencia. */
export async function contarPendientesDePago(db: BaseDeDatos = getDb()): Promise<number> {
  const [fila] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pendiente_pago"));
  return fila?.total ?? 0;
}

export async function obtenerPedido(
  id: string,
  db: BaseDeDatos = getDb(),
): Promise<{ pedido: OrderRow; lineas: OrderItemRow[] } | undefined> {
  const [pedido] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!pedido) return undefined;
  const lineas = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { pedido, lineas };
}

export async function obtenerPedidoPorNumero(
  orderNumber: string,
  db: BaseDeDatos = getDb(),
): Promise<{ pedido: OrderRow; lineas: OrderItemRow[] } | undefined> {
  const [pedido] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!pedido) return undefined;
  const lineas = await db.select().from(orderItems).where(eq(orderItems.orderId, pedido.id));
  return { pedido, lineas };
}

/** Marcas de tiempo que acompañan a cada estado. */
const MARCA_DE_ESTADO: Record<OrderStatus, keyof OrderRow | null> = {
  pendiente_pago: null,
  pagado: "paidAt",
  preparado: "preparedAt",
  entregado: "deliveredAt",
  cancelado: "cancelledAt",
};

export async function cambiarEstadoPedido(
  id: string,
  estado: OrderStatus,
  motivo?: string,
  db: BaseDeDatos = getDb(),
): Promise<OrderRow | undefined> {
  const campo = MARCA_DE_ESTADO[estado];
  const cambios: Record<string, unknown> = { status: estado, updatedAt: new Date() };
  if (campo) cambios[campo] = new Date();
  if (estado === "cancelado" && motivo) cambios.cancelReason = motivo;

  const [fila] = await db.update(orders).set(cambios).where(eq(orders.id, id)).returning();
  return fila;
}

/* ── Tandas ───────────────────────────────────────────────────────────── */

export interface ResumenTanda {
  pickupPointId: string;
  pickupPointName: string;
  pickupDate: string;
  pedidos: number;
  pendientes: number;
  total: number;
}

/** Las tandas con pedidos, de hoy en adelante. Es la portada del panel. */
export async function listarTandas(
  db: BaseDeDatos = getDb(),
  hoy: string = fechaUruguaya(new Date()),
): Promise<ResumenTanda[]> {
  return db
    .select({
      pickupPointId: orders.pickupPointId,
      pickupPointName: orders.pickupPointName,
      pickupDate: orders.pickupDate,
      pedidos: sql<number>`count(*)::int`,
      pendientes: sql<number>`count(*) filter (where ${orders.status} = 'pendiente_pago')::int`,
      total: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelado'), 0)::int`,
    })
    .from(orders)
    .where(and(gte(orders.pickupDate, hoy), sql`${orders.status} <> 'cancelado'`))
    .groupBy(orders.pickupPointId, orders.pickupPointName, orders.pickupDate)
    .orderBy(asc(orders.pickupDate));
}

export interface LineaDeCarga {
  productName: string;
  unitLabel: string;
  saleType: "weight" | "unit";
  cantidad: number;
  pedidos: number;
}

/**
 * Qué hay que llevar a una tanda: el total por producto sumando los pedidos.
 *
 * Es la consulta que responde "qué cargo en el auto el jueves". Solo cuenta
 * los pedidos pagados o ya preparados: lo que no se cobró no se lleva.
 */
export async function hojaDeCarga(
  puntoId: string,
  fecha: string,
  db: BaseDeDatos = getDb(),
): Promise<LineaDeCarga[]> {
  return db
    .select({
      productName: orderItems.productName,
      unitLabel: orderItems.unitLabel,
      saleType: orderItems.saleType,
      cantidad: sql<number>`sum(${orderItems.quantity})::int`,
      pedidos: sql<number>`count(distinct ${orderItems.orderId})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.pickupPointId, puntoId),
        eq(orders.pickupDate, fecha),
        inArray(orders.status, ["pagado", "preparado", "entregado"]),
      ),
    )
    .groupBy(orderItems.productName, orderItems.unitLabel, orderItems.saleType)
    .orderBy(asc(orderItems.productName));
}

/** Los pedidos de una tanda con sus líneas, para armar bolsa por bolsa. */
export async function pedidosDeLaTanda(
  puntoId: string,
  fecha: string,
  db: BaseDeDatos = getDb(),
): Promise<{ pedido: OrderRow; lineas: OrderItemRow[] }[]> {
  const pedidos = await db
    .select()
    .from(orders)
    .where(and(eq(orders.pickupPointId, puntoId), eq(orders.pickupDate, fecha)))
    .orderBy(asc(orders.customerName));

  if (pedidos.length === 0) return [];

  const lineas = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        pedidos.map((p) => p.id),
      ),
    );

  return pedidos.map((pedido) => ({
    pedido,
    lineas: lineas.filter((linea) => linea.orderId === pedido.id),
  }));
}
