"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { accionGuardarProducto } from "@/app/admin/actions";
import { ESTADO_INICIAL } from "@/lib/admin-form-state";
import { Field, inputClass } from "@/components/checkout/Field";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { CATEGORIES } from "@/lib/categorias";
import { cn } from "@/lib/cn";
import { centesimosAPesos } from "@/lib/money";
import { generarSlug, TAMANO_MAXIMO_IMAGEN } from "@/lib/product-schema";
import type { ProductoAdmin } from "@/lib/types";

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp";

export function FormularioProducto({ producto }: { producto?: ProductoAdmin }) {
  const [estado, enviar, pendiente] = useActionState(accionGuardarProducto, ESTADO_INICIAL);
  const esEdicion = Boolean(producto);

  const [nombre, setNombre] = useState(producto?.name ?? "");
  const [saleType, setSaleType] = useState(producto?.saleType ?? "weight");
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const inputImagen = useRef<HTMLInputElement>(null);

  /*
   * El slug y la etiqueta de unidad se proponen a partir de los otros campos,
   * hasta que alguien los edita a mano. Se calculan durante el render en lugar
   * de sincronizarse con un efecto: así no hay un render intermedio con el
   * valor viejo ni riesgo de que los dos estados se desfasen.
   */
  const [slugManual, setSlugManual] = useState<string | null>(producto?.slug ?? null);
  const slug = slugManual ?? generarSlug(nombre);

  const [unitLabelManual, setUnitLabelManual] = useState<string | null>(
    producto?.unitLabel ?? null,
  );
  const unitLabel = unitLabelManual ?? (saleType === "weight" ? "kg" : "unidad");

  useEffect(() => {
    return () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    };
  }, [vistaPrevia]);

  function alElegirImagen(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    setErrorImagen(null);
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    setVistaPrevia(null);
    if (!archivo) return;

    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
      setErrorImagen(`La imagen supera los ${Math.round(TAMANO_MAXIMO_IMAGEN / 1024 / 1024)} MB.`);
      event.target.value = "";
      return;
    }
    if (!TIPOS_ACEPTADOS.split(",").includes(archivo.type)) {
      setErrorImagen("Solo se aceptan imágenes JPG, PNG o WebP.");
      event.target.value = "";
      return;
    }
    setVistaPrevia(URL.createObjectURL(archivo));
  }

  const error = (campo: string) => estado.errores?.[campo];
  /**
   * Valor a pintar en cada campo: primero lo que la persona acaba de escribir
   * (React vacía el formulario al terminar la acción), después lo que tiene el
   * producto, y si no, el valor por defecto.
   */
  const valor = (campo: string, porDefecto: string | number = "") =>
    estado.valores?.[campo] ?? String(porDefecto);
  const imagenActual = producto?.imageUrl ?? null;

  return (
    <form action={enviar} className="space-y-6">
      {producto ? <input type="hidden" name="id" value={producto.id} /> : null}

      <section className="space-y-5 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Datos del producto</h2>

        <Field id="name" label="Nombre" required error={error("name")}>
          <input
            id="name"
            name="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(error("name"))}
            required
          />
        </Field>

        <Field
          id="slug"
          label="Slug"
          required
          hint="Identificador en la web. Se propone solo, pero podés cambiarlo."
          error={error("slug")}
        >
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlugManual(e.target.value)}
            className={cn(inputClass, "font-mono text-sm")}
            aria-invalid={Boolean(error("slug"))}
            required
          />
        </Field>

        <Field id="description" label="Descripción" error={error("description")}>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={valor("description", producto?.description ?? "")}
            className={cn(inputClass, "min-h-24 py-3 leading-relaxed")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="category" label="Categoría" required error={error("category")}>
            <select
              id="category"
              name="category"
              defaultValue={valor("category", producto?.category ?? "quesos")}
              className={inputClass}
              required
            >
              {CATEGORIES.filter((c) => c.id !== "todos").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="price"
            label="Precio en pesos uruguayos"
            required
            hint="Sin símbolo. Ej: 390 o 390,50."
            error={error("priceCents")}
          >
            <input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={valor("price", producto ? centesimosAPesos(producto.priceCents) : "")}
              className={inputClass}
              aria-invalid={Boolean(error("priceCents"))}
              required
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Venta y cantidades</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="saleType" label="Tipo de venta" required error={error("saleType")}>
            <select
              id="saleType"
              name="saleType"
              value={saleType}
              onChange={(e) => setSaleType(e.target.value as "weight" | "unit")}
              className={inputClass}
              required
            >
              <option value="weight">Por peso</option>
              <option value="unit">Por unidad</option>
            </select>
          </Field>

          <Field
            id="unitLabel"
            label="Etiqueta de unidad"
            required
            hint="Cómo se nombra: kg, unidad, frasco."
            error={error("unitLabel")}
          >
            <input
              id="unitLabel"
              name="unitLabel"
              value={unitLabel}
              onChange={(e) => setUnitLabelManual(e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(error("unitLabel"))}
              required
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="minQuantity" label="Cantidad mínima" required error={error("minQuantity")}>
            <input
              id="minQuantity"
              name="minQuantity"
              inputMode="numeric"
              defaultValue={valor("minQuantity", producto?.minQuantity ?? 1)}
              className={inputClass}
              aria-invalid={Boolean(error("minQuantity"))}
              required
            />
          </Field>
          <Field id="maxQuantity" label="Cantidad máxima" required error={error("maxQuantity")}>
            <input
              id="maxQuantity"
              name="maxQuantity"
              inputMode="numeric"
              defaultValue={valor("maxQuantity", producto?.maxQuantity ?? 5)}
              className={inputClass}
              aria-invalid={Boolean(error("maxQuantity"))}
              required
            />
          </Field>
          <Field id="quantityStep" label="Incremento" required error={error("quantityStep")}>
            <input
              id="quantityStep"
              name="quantityStep"
              inputMode="numeric"
              defaultValue={valor("quantityStep", producto?.quantityStep ?? 1)}
              className={inputClass}
              aria-invalid={Boolean(error("quantityStep"))}
              required
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="presentation"
            label="Presentación"
            required
            hint="Ej: Venta por kilo, Frasco de 380 g, Envase de 1 kg."
            error={error("presentation")}
          >
            <input
              id="presentation"
              name="presentation"
              defaultValue={valor("presentation", producto?.presentation ?? "")}
              className={inputClass}
              aria-invalid={Boolean(error("presentation"))}
              required
            />
          </Field>

          <Field
            id="sortOrder"
            label="Orden de aparición"
            required
            hint="Menor primero. Conviene dejar huecos: 10, 20, 30."
            error={error("sortOrder")}
          >
            <input
              id="sortOrder"
              name="sortOrder"
              inputMode="numeric"
              defaultValue={valor("sortOrder", producto?.sortOrder ?? 999)}
              className={inputClass}
              aria-invalid={Boolean(error("sortOrder"))}
              required
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-ink/15 bg-cream/60 p-4">
          <input
            type="checkbox"
            name="active"
            defaultChecked={estado.valores ? estado.valores.active === "true" : (producto?.active ?? true)}
            className="mt-0.5 size-4.5 shrink-0 accent-[#4A2E1E]"
          />
          <span>
            <span className="block font-semibold text-ink">Producto activo</span>
            <span className="mt-0.5 block text-sm text-bark">
              Si lo desmarcás, deja de aparecer en la tienda pero sigue guardado.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Imagen</h2>

        <div className="flex flex-wrap items-start gap-5">
          <div className="w-40 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-cream">
            {vistaPrevia ? (
              // Vista previa local: no pasa por el optimizador de Next.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vistaPrevia} alt="Vista previa de la nueva imagen" className="aspect-[4/3] w-full object-cover" />
            ) : imagenActual ? (
              <Image
                src={imagenActual}
                alt={producto?.imageAlt ?? "Imagen actual del producto"}
                width={320}
                height={240}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <p className="flex aspect-[4/3] items-center justify-center px-3 text-center text-xs text-bark">
                Sin imagen
              </p>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <input
              ref={inputImagen}
              type="file"
              id="imagen"
              name="imagen"
              accept={TIPOS_ACEPTADOS}
              onChange={alElegirImagen}
              className="sr-only"
            />
            <label htmlFor="imagen" className={cn(buttonStyles("outline", "md"), "cursor-pointer")}>
              <Upload aria-hidden="true" className="size-4" />
              {imagenActual ? "Reemplazar imagen" : "Elegir imagen"}
            </label>
            <p className="text-sm text-bark">
              JPG, PNG o WebP, hasta {Math.round(TAMANO_MAXIMO_IMAGEN / 1024 / 1024)} MB. Se sube a
              Vercel Blob al guardar. La imagen anterior se conserva hasta que la nueva se guarde
              bien.
            </p>
            {errorImagen || error("imagen") ? (
              <p role="alert" className="text-sm font-medium text-[#9B3B1F]">
                {errorImagen ?? error("imagen")}
              </p>
            ) : null}
          </div>
        </div>

        <Field
          id="imageAlt"
          label="Texto alternativo"
          hint="Describe la foto para quien no puede verla. Si lo dejás vacío se usa el nombre."
          error={error("imageAlt")}
        >
          <input
            id="imageAlt"
            name="imageAlt"
            defaultValue={valor("imageAlt", producto?.imageAlt ?? "")}
            className={inputClass}
          />
        </Field>
      </section>

      {estado.mensaje ? (
        <p role="alert" className="rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 px-4 py-3 text-sm font-medium text-ink">
          {estado.mensaje}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={pendiente} className="sm:w-auto">
          {pendiente ? (
            <>
              <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
              Guardando…
            </>
          ) : esEdicion ? (
            "Guardar cambios"
          ) : (
            "Crear producto"
          )}
        </Button>
        <Link href="/admin" className={buttonStyles("ghost", "lg")}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
