CREATE TYPE "public"."product_category" AS ENUM('quesos', 'dulces', 'otros');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('weight', 'unit');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"category" "product_category" NOT NULL,
	"price_cents" integer NOT NULL,
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
	CONSTRAINT "products_price_positive" CHECK ("products"."price_cents" > 0),
	CONSTRAINT "products_min_quantity_positive" CHECK ("products"."min_quantity" > 0),
	CONSTRAINT "products_step_positive" CHECK ("products"."quantity_step" > 0),
	CONSTRAINT "products_max_gte_min" CHECK ("products"."max_quantity" >= "products"."min_quantity")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_unique" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_active_sort_idx" ON "products" USING btree ("active","sort_order");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");