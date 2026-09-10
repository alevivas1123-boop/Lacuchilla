CREATE TYPE "public"."order_status" AS ENUM('pendiente_pago', 'pagado', 'preparado', 'entregado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('transferencia', 'mercadopago');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(24) NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_point_id_pickup_points_id_fk" FOREIGN KEY ("pickup_point_id") REFERENCES "public"."pickup_points"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_phone_unique" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_unique" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_tanda_idx" ON "orders" USING btree ("pickup_point_id","pickup_date");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pickup_points_active_idx" ON "pickup_points" USING btree ("active","sort_order");