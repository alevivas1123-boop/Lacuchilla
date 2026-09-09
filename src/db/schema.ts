import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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
