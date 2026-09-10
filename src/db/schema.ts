import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** Cómo se vende el producto: por peso (kilos) o por unidad. */
export const saleTypeEnum = pgEnum("sale_type", ["weight", "unit"]);

/** Categorías del catálogo. Coinciden con los filtros de la tienda. */
export const categoryEnum = pgEnum("product_category", ["quesos", "dulces", "otros"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Identificador estable del producto en la web. Único. */
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    category: categoryEnum("category").notNull(),

    /**
     * Precio en pesos uruguayos ENTEROS. $390 se guarda como 390.
     * El negocio no maneja centésimos, así que no hay decimales en juego y
     * los totales del carrito son multiplicaciones y sumas de enteros.
     */
    price: integer("price").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("UYU"),

    saleType: saleTypeEnum("sale_type").notNull(),
    /** Cómo se nombra la unidad en pantalla: "kg", "unidad", "frasco". */
    unitLabel: varchar("unit_label", { length: 24 }).notNull(),

    /** Configuración del selector de cantidad, por producto. */
    minQuantity: integer("min_quantity").notNull().default(1),
    maxQuantity: integer("max_quantity").notNull().default(5),
    quantityStep: integer("quantity_step").notNull().default(1),

    /** Cómo se presenta: "Venta por kilo", "Frasco de 380 g", "1 kg". */
    presentation: varchar("presentation", { length: 120 }).notNull(),

    /** URL de la foto: ruta local del seed o URL de Vercel Blob. */
    imageUrl: text("image_url"),
    /** Ruta dentro de Vercel Blob, para poder administrarla después. */
    imageBlobPath: text("image_blob_path"),
    /** Texto alternativo de la foto. */
    imageAlt: varchar("image_alt", { length: 200 }),

    /** Baja lógica: un producto inactivo no aparece en la tienda. */
    active: boolean("active").notNull().default(true),
    /** Orden de aparición en el catálogo. Menor primero. */
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_active_sort_idx").on(table.active, table.sortOrder),
    index("products_category_idx").on(table.category),
    // Las mismas reglas que valida Zod, también en la base: si algún día
    // entra un dato por otra vía, la base lo rechaza igual.
    check("products_price_positive", sql`${table.price} > 0`),
    check("products_min_quantity_positive", sql`${table.minQuantity} > 0`),
    check("products_step_positive", sql`${table.quantityStep} > 0`),
    check("products_max_gte_min", sql`${table.maxQuantity} >= ${table.minQuantity}`),
  ],
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

/* ═══════════════════════════════════════════════════════════════════════════
   Pedidos y puntos de retiro
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Estados por los que pasa un pedido. Son internos: el cliente no recibe
 * ningún aviso al cambiar de uno a otro.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "pendiente_pago",
  "pagado",
  "preparado",
  "entregado",
  "cancelado",
]);

/** Medios de pago. Mercado Pago queda preparado para más adelante. */
export const paymentMethodEnum = pgEnum("payment_method", ["transferencia", "mercadopago"]);

/**
 * Puntos de retiro, con su patrón semanal.
 *
 * El punto guarda el patrón recurrente ("Carrasco, jueves de 17 a 19"); el
 * pedido guarda la fecha concreta que le tocó. Un punto que atiende dos días
 * se carga como dos filas: es más simple que un arreglo de días y permite
 * horarios distintos en cada uno.
 */
export const pickupPoints = pgTable(
  "pickup_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name", { length: 80 }).notNull(),
    address: varchar("address", { length: 200 }).notNull(),

    /** Día de la semana: 0 domingo … 6 sábado. */
    weekday: integer("weekday").notNull(),
    /** Horario de atención, en hora local de Uruguay. "17:00". */
    timeFrom: varchar("time_from", { length: 5 }).notNull(),
    timeTo: varchar("time_to", { length: 5 }).notNull(),

    /** Horas antes del retiro en que se dejan de tomar pedidos. */
    cutoffHours: integer("cutoff_hours").notNull().default(24),

    /** Referencias para encontrar el punto. Se le muestran al cliente. */
    instructions: text("instructions"),

    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("pickup_points_active_idx").on(table.active, table.sortOrder),
    check("pickup_points_weekday_range", sql`${table.weekday} between 0 and 6`),
    check("pickup_points_cutoff_positive", sql`${table.cutoffHours} >= 0`),
  ],
);

/**
 * Clientes.
 *
 * La identidad es el teléfono, que es como se los ubica en Uruguay. Se guarda
 * normalizado (solo dígitos, con prefijo país) para que "099 123 456" y
 * "+598 99 123 456" caigan en el mismo cliente.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: varchar("phone", { length: 24 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("customers_phone_unique").on(table.phone)],
);

/**
 * Pedidos.
 *
 * Los datos del punto de retiro se COPIAN al crear el pedido. Si después se
 * cambia el horario de Carrasco o se da de baja el punto, el pedido histórico
 * tiene que seguir diciendo dónde y cuándo era: un pedido es un documento, no
 * una consulta a la configuración de hoy.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 24 }).notNull(),
    status: orderStatusEnum("status").notNull().default("pendiente_pago"),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 24 }).notNull(),
    customerEmail: varchar("customer_email", { length: 160 }),

    pickupPointId: uuid("pickup_point_id")
      .notNull()
      .references(() => pickupPoints.id, { onDelete: "restrict" }),
    /** Fecha concreta del retiro. Es lo que agrupa la tanda. */
    pickupDate: date("pickup_date").notNull(),
    /** Copia del punto al momento del pedido. */
    pickupPointName: varchar("pickup_point_name", { length: 80 }).notNull(),
    pickupAddress: varchar("pickup_address", { length: 200 }).notNull(),
    pickupTimeFrom: varchar("pickup_time_from", { length: 5 }).notNull(),
    pickupTimeTo: varchar("pickup_time_to", { length: 5 }).notNull(),

    notes: text("notes"),

    /** Total en pesos enteros. Se recalcula en el servidor. */
    total: integer("total").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("transferencia"),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    preparedAt: timestamp("prepared_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: varchar("cancel_reason", { length: 200 }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_number_unique").on(table.orderNumber),
    // La consulta que más se usa: los pedidos de una tanda.
    index("orders_tanda_idx").on(table.pickupPointId, table.pickupDate),
    index("orders_status_idx").on(table.status),
    index("orders_customer_idx").on(table.customerId),
    index("orders_created_idx").on(table.createdAt),
    check("orders_total_positive", sql`${table.total} > 0`),
  ],
);

/**
 * Líneas del pedido.
 *
 * Igual que con el punto de retiro, los datos del producto se copian: si
 * mañana sube el precio del Colonia, el pedido de la semana pasada tiene que
 * seguir diciendo lo que se cobró.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    productName: varchar("product_name", { length: 160 }).notNull(),
    productSlug: varchar("product_slug", { length: 120 }).notNull(),
    presentation: varchar("presentation", { length: 120 }).notNull(),
    unitLabel: varchar("unit_label", { length: 24 }).notNull(),
    saleType: saleTypeEnum("sale_type").notNull(),

    /** Lo que se cobró por unidad, no lo que vale hoy. */
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_price_positive", sql`${table.unitPrice} > 0`),
  ],
);

/**
 * Configuración del negocio. Una sola fila.
 *
 * Los datos bancarios viven en la base y no en el código porque son la única
 * forma de cobrar: si cambia la cuenta, el dueño tiene que poder corregirlo
 * desde el panel, sin depender de un despliegue.
 */
export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),

  bankHolder: varchar("bank_holder", { length: 160 }),
  bankName: varchar("bank_name", { length: 80 }),
  bankAccount: varchar("bank_account", { length: 60 }),
  bankAccountType: varchar("bank_account_type", { length: 40 }),
  bankDocument: varchar("bank_document", { length: 40 }),
  bankInstructions: text("bank_instructions"),

  /** Compra mínima en pesos. 0 o null = sin mínimo. */
  minimumOrder: integer("minimum_order"),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PickupPointRow = typeof pickupPoints.$inferSelect;
export type NewPickupPointRow = typeof pickupPoints.$inferInsert;
export type CustomerRow = typeof customers.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
export type StoreSettingsRow = typeof storeSettings.$inferSelect;
export type OrderStatus = OrderRow["status"];
