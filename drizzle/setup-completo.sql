-- ═══════════════════════════════════════════════════════════════════════
-- La Cuchilla · preparación de la base de datos
--
-- Pegá TODO esto en el editor SQL de Neon y ejecutalo.
--
-- Crea las tablas (productos, pedidos, puntos de retiro, clientes y
-- configuración), carga los 17 productos del catálogo y los puntos de retiro
-- iniciales.
--
-- Es seguro ejecutarlo más de una vez: cada migración se aplica solo si
-- todavía no estaba, y ni los productos ni los puntos se duplican ni pisan
-- los cambios hechos desde el panel.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Registro de migraciones --------------------------------------------
-- Va primero porque cada bloque de abajo lo consulta para saber si ya corrió.
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- 2. Estructura ---------------------------------------------------------
-- 0000_inicial
DO $migracion$
BEGIN
  IF EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = 'd1c5693d444290c3c37c6425ab90f69eff571b20dc8353b6e28559769fedb8d0') THEN
    RAISE NOTICE 'La migración 0000_inicial ya estaba aplicada.';
  ELSE
CREATE TYPE "public"."product_category" AS ENUM('quesos', 'dulces', 'otros');
CREATE TYPE "public"."sale_type" AS ENUM('weight', 'unit');
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"category" "product_category" NOT NULL,
	"price" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'UYU' NOT NULL,
	"sale_type" "sale_type" NOT NULL,
	"unit_label" varchar(24) NOT NULL,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"max_quantity" integer DEFAULT 5 NOT NULL,
	"quantity_step" integer DEFAULT 1 NOT NULL,
	"presentation" varchar(120) NOT NULL,
	"image_url" text,
	"image_blob_path" text,
	"image_alt" varchar(200),
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_positive" CHECK ("products"."price" > 0),
	CONSTRAINT "products_min_quantity_positive" CHECK ("products"."min_quantity" > 0),
	CONSTRAINT "products_step_positive" CHECK ("products"."quantity_step" > 0),
	CONSTRAINT "products_max_gte_min" CHECK ("products"."max_quantity" >= "products"."min_quantity")
);

CREATE UNIQUE INDEX "products_slug_unique" ON "products" USING btree ("slug");
CREATE INDEX "products_active_sort_idx" ON "products" USING btree ("active","sort_order");
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");
    INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
    VALUES ('d1c5693d444290c3c37c6425ab90f69eff571b20dc8353b6e28559769fedb8d0', 1788718413048);
  END IF;
END
$migracion$;

-- 0001_pedidos-y-retiros
DO $migracion$
BEGIN
  IF EXISTS (SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = '7a5c10c4141de2ccdf0a3cf74875dd6338fc4f0b9fa7e6e6106d5b5520810177') THEN
    RAISE NOTICE 'La migración 0001_pedidos-y-retiros ya estaba aplicada.';
  ELSE
CREATE TYPE "public"."order_status" AS ENUM('pendiente_pago', 'pagado', 'preparado', 'entregado', 'cancelado');
CREATE TYPE "public"."payment_method" AS ENUM('transferencia', 'mercadopago');
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(24) NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(160) NOT NULL,
	"product_slug" varchar(120) NOT NULL,
	"presentation" varchar(120) NOT NULL,
	"unit_label" varchar(24) NOT NULL,
	"sale_type" "sale_type" NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" integer NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_price_positive" CHECK ("order_items"."unit_price" > 0)
);

CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(24) NOT NULL,
	"status" "order_status" DEFAULT 'pendiente_pago' NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_name" varchar(160) NOT NULL,
	"customer_phone" varchar(24) NOT NULL,
	"customer_email" varchar(160),
	"pickup_point_id" uuid NOT NULL,
	"pickup_date" date NOT NULL,
	"pickup_point_name" varchar(80) NOT NULL,
	"pickup_address" varchar(200) NOT NULL,
	"pickup_time_from" varchar(5) NOT NULL,
	"pickup_time_to" varchar(5) NOT NULL,
	"notes" text,
	"total" integer NOT NULL,
	"payment_method" "payment_method" DEFAULT 'transferencia' NOT NULL,
	"paid_at" timestamp with time zone,
	"prepared_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_total_positive" CHECK ("orders"."total" > 0)
);

CREATE TABLE "pickup_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"address" varchar(200) NOT NULL,
	"weekday" integer NOT NULL,
	"time_from" varchar(5) NOT NULL,
	"time_to" varchar(5) NOT NULL,
	"cutoff_hours" integer DEFAULT 24 NOT NULL,
	"instructions" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pickup_points_weekday_range" CHECK ("pickup_points"."weekday" between 0 and 6),
	CONSTRAINT "pickup_points_cutoff_positive" CHECK ("pickup_points"."cutoff_hours" >= 0)
);

CREATE TABLE "store_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"bank_holder" varchar(160),
	"bank_name" varchar(80),
	"bank_account" varchar(60),
	"bank_account_type" varchar(40),
	"bank_document" varchar(40),
	"bank_instructions" text,
	"minimum_order" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_point_id_pickup_points_id_fk" FOREIGN KEY ("pickup_point_id") REFERENCES "public"."pickup_points"("id") ON DELETE restrict ON UPDATE no action;
CREATE UNIQUE INDEX "customers_phone_unique" ON "customers" USING btree ("phone");
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");
CREATE UNIQUE INDEX "orders_number_unique" ON "orders" USING btree ("order_number");
CREATE INDEX "orders_tanda_idx" ON "orders" USING btree ("pickup_point_id","pickup_date");
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");
CREATE INDEX "pickup_points_active_idx" ON "pickup_points" USING btree ("active","sort_order");
    INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
    VALUES ('7a5c10c4141de2ccdf0a3cf74875dd6338fc4f0b9fa7e6e6106d5b5520810177', 1789037151602);
  END IF;
END
$migracion$;

-- 3. Catálogo inicial ---------------------------------------------------
INSERT INTO "products"
  (slug, name, description, category, price, currency, sale_type, unit_label,
   min_quantity, max_quantity, quantity_step, presentation, image_url, image_alt,
   active, sort_order)
VALUES
  ('queso-colonia', 'Queso Colonia', 'Clásico uruguayo de pasta semidura, cremoso y parejo. El de todos los días.', 'quesos'::product_category, 390, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-colonia.webp', 'Queso Colonia de La Cuchilla', true, 10),
  ('queso-dambo', 'Queso Dambo', 'Suave, elástico y de sabor amable. Ideal para sándwiches y picadas.', 'quesos'::product_category, 370, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-dambo.webp', 'Queso Dambo de La Cuchilla', true, 20),
  ('queso-magro-con-sal', 'Queso magro con sal', 'Bajo en grasa, firme y con el punto justo de sal.', 'quesos'::product_category, 340, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-magro-con-sal.webp', 'Queso magro con sal de La Cuchilla', true, 30),
  ('queso-magro-sin-sal', 'Queso magro sin sal', 'La versión sin sal agregada, pensada para dietas cuidadas.', 'quesos'::product_category, 340, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-magro-sin-sal.webp', 'Queso magro sin sal de La Cuchilla', true, 40),
  ('queso-mozzarella', 'Queso mozzarella', 'Funde parejo y estira como corresponde. Para pizza y horno.', 'quesos'::product_category, 390, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-mozzarella.webp', 'Queso mozzarella de La Cuchilla', true, 50),
  ('queso-semiduro', 'Queso semiduro', 'De maduración media, sabor redondo y textura compacta.', 'quesos'::product_category, 360, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-semiduro.webp', 'Queso semiduro de La Cuchilla', true, 60),
  ('queso-parmesano', 'Queso parmesano', 'Maduración larga, sabor intenso y salino. Para rallar o comer en lascas.', 'quesos'::product_category, 480, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-parmesano.webp', 'Queso parmesano de La Cuchilla', true, 70),
  ('queso-provolone', 'Queso provolone', 'Carácter fuerte y aroma marcado. El del disco y la parrilla.', 'quesos'::product_category, 420, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-provolone.webp', 'Queso provolone de La Cuchilla', true, 80),
  ('queso-rallado', 'Queso rallado', 'Rallado fresco, listo para pastas, salsas y gratinados.', 'quesos'::product_category, 350, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/queso-rallado.webp', 'Queso rallado de La Cuchilla', true, 90),
  ('queso-untable', 'Queso untable', 'Cremoso y fresco, para el pan de la mañana o una picada.', 'quesos'::product_category, 115, 'UYU', 'unit'::sale_type, 'unidad', 1, 20, 1, 'Envase de 385 g', '/products/queso-untable.webp', 'Queso untable de La Cuchilla en envase de 385 g', true, 100),
  ('mermelada-frutilla', 'Mermelada de frutilla', 'Fruta y azúcar, nada más. Dulzor parejo y color intenso.', 'dulces'::product_category, 120, 'UYU', 'unit'::sale_type, 'unidad', 1, 20, 1, 'Frasco de 380 g', '/products/mermelada-frutilla.webp', 'Mermelada artesanal de frutilla', true, 110),
  ('mermelada-higo', 'Mermelada de higo', 'Compañera perfecta de un queso de carácter.', 'dulces'::product_category, 120, 'UYU', 'unit'::sale_type, 'unidad', 1, 20, 1, 'Frasco de 380 g', '/products/mermelada-higo.webp', 'Mermelada artesanal de higo', true, 120),
  ('mermelada-durazno', 'Mermelada de durazno', 'Suave y aromática, con trozos de fruta.', 'dulces'::product_category, 120, 'UYU', 'unit'::sale_type, 'unidad', 1, 20, 1, 'Frasco de 380 g', '/products/mermelada-durazno.webp', 'Mermelada artesanal de durazno', true, 130),
  ('dulce-membrillo', 'Dulce de membrillo', 'Firme y de corte prolijo. Queso y dulce, como siempre.', 'dulces'::product_category, 120, 'UYU', 'unit'::sale_type, 'unidad', 1, 20, 1, 'Envase de 1 kg', '/products/dulce-membrillo.webp', 'Dulce de membrillo artesanal', true, 140),
  ('dulce-de-leche', 'Dulce de leche', 'Cocción lenta, textura espesa y sabor de campo.', 'dulces'::product_category, 150, 'UYU', 'unit'::sale_type, 'unidad', 1, 20, 1, 'Envase de 1 kg', '/products/dulce-de-leche.webp', 'Dulce de leche de La Cuchilla', true, 150),
  ('pizza-cuatro-quesos', 'Pizza cuatro quesos', 'Lista para el horno, con nuestra propia mezcla de quesos.', 'otros'::product_category, 250, 'UYU', 'unit'::sale_type, 'unidad', 1, 20, 1, '1 unidad', '/products/pizza-cuatro-quesos.webp', 'Pizza artesanal de cuatro quesos', true, 160),
  ('chorizo-chacarero', 'Chorizo chacarero', 'Elaboración artesanal, condimento justo. Para la parrilla.', 'otros'::product_category, 690, 'UYU', 'weight'::sale_type, 'kg', 1, 5, 1, 'Venta por kilo', '/products/chorizo-chacarero.webp', 'Chorizo chacarero', true, 170)
ON CONFLICT (slug) DO NOTHING;

-- 4. Puntos de retiro ---------------------------------------------------
-- Solo si no hay ninguno: dos puntos pueden llamarse igual en días distintos,
-- así que no hay clave natural para deduplicar fila por fila.
INSERT INTO "pickup_points"
  (name, address, weekday, time_from, time_to, cutoff_hours, instructions, active, sort_order)
SELECT * FROM (VALUES
    ('Carrasco', 'Coordinamos el punto exacto por WhatsApp', 4, '17:00', '19:00', 24, 'Te escribimos el mismo jueves para confirmar la esquina exacta.', true, 10),
    ('Cuchilla Alta', 'En el tambo, Cuchilla Alta', 6, '10:00', '13:00', 24, NULL, true, 20),
    ('Cuchilla Alta', 'En el tambo, Cuchilla Alta', 0, '10:00', '13:00', 24, NULL, true, 21)
) AS nuevos
WHERE NOT EXISTS (SELECT 1 FROM "pickup_points");

COMMIT;

-- 5. Comprobación -------------------------------------------------------
SELECT
  (SELECT count(*) FROM products) AS productos,
  (SELECT count(*) FROM products WHERE active) AS productos_activos,
  (SELECT count(*) FROM pickup_points WHERE active) AS puntos_activos,
  (SELECT count(*) FROM orders) AS pedidos;
