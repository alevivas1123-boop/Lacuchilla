-- ═══════════════════════════════════════════════════════════════════════
-- La Cuchilla · preparación de la base de datos
--
-- Pegá TODO esto en el editor SQL de Neon y ejecutalo una vez.
-- Crea la tabla de productos y carga los 17 productos del catálogo.
--
-- Es seguro ejecutarlo más de una vez: no duplica productos ni pisa cambios
-- hechos desde el panel de administración.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Estructura ---------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "public"."product_category" AS ENUM('quesos', 'dulces', 'otros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."sale_type" AS ENUM('weight', 'unit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "products" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "products_active_sort_idx" ON "products" USING btree ("active","sort_order");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category");

-- 2. Catálogo inicial ---------------------------------------------------
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

-- 3. Registro de migración ----------------------------------------------
-- Para que un futuro `npm run db:migrate` sepa que esto ya está aplicado y
-- no intente crear la tabla de nuevo.
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
SELECT 'd1c5693d444290c3c37c6425ab90f69eff571b20dc8353b6e28559769fedb8d0', 1788718413048
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = 'd1c5693d444290c3c37c6425ab90f69eff571b20dc8353b6e28559769fedb8d0'
);

COMMIT;

-- 4. Comprobación -------------------------------------------------------
SELECT count(*) AS productos, count(*) FILTER (WHERE active) AS activos FROM products;
