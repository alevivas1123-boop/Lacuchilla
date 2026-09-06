"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { revalidarCarrito } from "@/app/(tienda)/checkout/validar";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { Field, inputClass } from "@/components/checkout/Field";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/checkout-schema";
import { cartTotal, useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { generateOrderNumber, saveLastOrder } from "@/lib/order-storage";
import type { Order } from "@/lib/types";

const fulfillmentOptions = [
  {
    value: "envio" as const,
    title: "Envío a domicilio",
    description: "Coordinamos día y costo por WhatsApp.",
  },
  {
    value: "retiro" as const,
    title: "Retiro en el local",
    description: "Pasás a buscarlo cuando te quede cómodo.",
  },
];

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const clear = useCartStore((state) => state.clear);
  const replaceAll = useCartStore((state) => state.replaceAll);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const total = cartTotal(items);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      fulfillment: "envio",
      address: "",
      locality: "",
      preferredTime: "",
      notes: "",
    },
  });

  const fulfillment = useWatch({ control, name: "fulfillment" });
  const needsAddress = fulfillment === "envio";

  async function onSubmit(values: CheckoutFormValues) {
    // Antes de confirmar se revalida el carrito contra la base: el precio, el
    // rango de cantidades o la disponibilidad pudieron cambiar desde que la
    // persona armó el pedido. No se confía en lo guardado en el navegador.
    const revision = await revalidarCarrito(items);

    if (revision.sinConexion) {
      setAvisos([
        "No pudimos confirmar los precios en este momento. Probá de nuevo en unos minutos.",
      ]);
      return;
    }

    if (revision.avisos.length > 0) {
      // Se actualiza el carrito y se pide confirmar de nuevo, para que nadie
      // termine comprando a un precio distinto del que vio.
      replaceAll(revision.items);
      setAvisos([...revision.avisos, "Revisá el pedido actualizado y confirmá otra vez."]);
      return;
    }

    if (!revision.ok) {
      setAvisos(["Los productos de tu pedido ya no están disponibles."]);
      replaceAll([]);
      return;
    }

    const order: Order = {
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      items: revision.items,
      totalCents: revision.totalCents,
      customer: {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        fulfillment: values.fulfillment,
        address: values.fulfillment === "envio" ? values.address : undefined,
        locality: values.locality || undefined,
        preferredTime: values.preferredTime || undefined,
        notes: values.notes || undefined,
      },
    };

    // Fase 1: el pedido se guarda solo en el navegador para mostrar la
    // confirmación. En la fase 2 acá va el POST al backend.
    setSubmitted(true);
    saveLastOrder(order);
    clear();
    router.push("/pedido-confirmado");
  }

  if (!hydrated) {
    return (
      <div className="max-w-2xl">
        <CartSkeleton rows={3} />
      </div>
    );
  }

  if (items.length === 0 && !submitted) {
    return (
      <div className="rounded-card border border-ink/10 bg-card">
        <EmptyCart />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start"
    >
      <div className="space-y-6 rounded-card border border-ink/10 bg-card p-5 sm:p-7">
        <fieldset className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">Tus datos</legend>

          <Field id="fullName" label="Nombre y apellido" required error={errors.fullName?.message}>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              className={inputClass}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              {...register("fullName")}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="phone"
              label="Teléfono / WhatsApp"
              required
              hint="Por acá te escribimos para coordinar."
              error={errors.phone?.message}
            >
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="099 123 456"
                className={inputClass}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={cn("phone-hint", errors.phone && "phone-error")}
                {...register("phone")}
              />
            </Field>

            <Field id="email" label="Email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                className={inputClass}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-ink/10 pt-6">
          <legend className="font-display text-xl font-semibold text-ink">Entrega</legend>

          <div className="grid gap-3 sm:grid-cols-2">
            {fulfillmentOptions.map((option) => {
              const selected = fulfillment === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors",
                    "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
                    selected
                      ? "border-ink bg-cream"
                      : "border-ink/15 bg-cream/60 hover:border-ink/40",
                  )}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="mt-1 size-4.5 shrink-0 accent-[#4A2E1E]"
                    {...register("fulfillment")}
                  />
                  <span>
                    <span className="block font-semibold text-ink">{option.title}</span>
                    <span className="mt-0.5 block text-sm text-bark">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {needsAddress ? (
            <Field
              id="address"
              label="Dirección"
              required
              hint="Calle, número, apartamento y alguna referencia."
              error={errors.address?.message}
              className="pt-2"
            >
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                className={inputClass}
                aria-invalid={Boolean(errors.address)}
                aria-describedby={cn("address-hint", errors.address && "address-error")}
                {...register("address")}
              />
            </Field>
          ) : null}

          <div className="grid gap-5 pt-2 sm:grid-cols-2">
            <Field
              id="locality"
              label="Localidad o departamento"
              required={needsAddress}
              error={errors.locality?.message}
            >
              <input
                id="locality"
                type="text"
                autoComplete="address-level2"
                placeholder="Montevideo, Canelones…"
                className={inputClass}
                aria-invalid={Boolean(errors.locality)}
                aria-describedby={errors.locality ? "locality-error" : undefined}
                {...register("locality")}
              />
            </Field>

            <Field id="preferredTime" label="Día u horario preferido" error={errors.preferredTime?.message}>
              <input
                id="preferredTime"
                type="text"
                placeholder="Jueves de tarde, por ejemplo"
                className={inputClass}
                {...register("preferredTime")}
              />
            </Field>
          </div>

          <Field
            id="notes"
            label="Comentarios sobre el pedido"
            hint="Cortes, presentación, algo para tener en cuenta."
            error={errors.notes?.message}
            className="pt-2"
          >
            <textarea
              id="notes"
              rows={3}
              className={cn(inputClass, "min-h-24 py-3 leading-relaxed")}
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={cn("notes-hint", errors.notes && "notes-error")}
              {...register("notes")}
            />
          </Field>
        </fieldset>

        <div className="hidden lg:block">
          <ConfirmButton isSubmitting={isSubmitting} />
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24">
        {avisos.length > 0 ? (
          <div
            role="alert"
            className="rounded-card border-2 border-cheese/60 bg-cheese/10 p-4 text-sm leading-relaxed text-ink"
          >
            <p className="font-semibold">Tu pedido cambió</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              {avisos.map((aviso) => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <OrderSummary items={items} total={total} />

        <div className="lg:hidden">
          <ConfirmButton isSubmitting={isSubmitting} />
        </div>

        <Link
          href="/carrito"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-bark transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver al carrito
        </Link>
      </div>
    </form>
  );
}

function ConfirmButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
          Enviando…
        </>
      ) : (
        "Confirmar pedido"
      )}
    </Button>
  );
}
