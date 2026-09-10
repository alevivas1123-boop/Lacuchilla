"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { crearPedidoDesdeElCheckout } from "@/app/(tienda)/checkout/crear-pedido";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { Field, inputClass } from "@/components/checkout/Field";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { SelectorDeRetiro } from "@/components/checkout/SelectorDeRetiro";
import { Button } from "@/components/ui/Button";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/checkout-schema";
import { cartTotal, useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import type { PuntoParaElegir } from "@/lib/retiros";

export function CheckoutForm({ puntos }: { puntos: PuntoParaElegir[] }) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const clear = useCartStore((state) => state.clear);
  const replaceAll = useCartStore((state) => state.replaceAll);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const total = cartTotal(items);

  // Con un solo punto no hay nada que elegir: viene marcado. Con varios, la
  // persona decide, porque el día de retiro depende de cuál.
  const unicoPunto = puntos.length === 1 ? puntos[0] : undefined;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      pickupPointId: unicoPunto?.id ?? "",
      pickupDate: unicoPunto?.fechas[0] ?? "",
      notes: "",
    },
  });

  // `useWatch` y no `watch()`: el compilador de React no puede memoizar la
  // función que devuelve `useForm`, y se saltearía todo el componente.
  const puntoElegido = useWatch({ control, name: "pickupPointId" });
  const fechaElegida = useWatch({ control, name: "pickupDate" });

  function elegirPunto(id: string) {
    setValue("pickupPointId", id, { shouldValidate: true });
    // Las fechas son de cada punto: la que estaba elegida puede no existir en
    // el nuevo. Se propone la primera disponible en vez de dejarla en blanco.
    const punto = puntos.find((candidato) => candidato.id === id);
    setValue("pickupDate", punto?.fechas[0] ?? "", { shouldValidate: true });
  }

  async function alEnviar(valores: CheckoutFormValues) {
    setErrorGeneral(null);
    setAvisos([]);

    // El servidor recalcula precios, total, punto y fecha. Lo que se manda de
    // acá es una propuesta, no un pedido.
    const resultado = await crearPedidoDesdeElCheckout(valores, items);

    if (resultado.ok) {
      setEnviado(true);
      clear();
      router.push(`/pedido-confirmado?id=${resultado.id}`);
      return;
    }

    if (resultado.items) replaceAll(resultado.items);
    if (resultado.avisos?.length) {
      setAvisos([...resultado.avisos, "Revisá el pedido actualizado y confirmá otra vez."]);
    }
    for (const [campo, mensaje] of Object.entries(resultado.errores ?? {})) {
      setError(campo as keyof CheckoutFormValues, { message: mensaje });
    }
    if (!resultado.avisos?.length) setErrorGeneral(resultado.mensaje);
  }

  if (!hydrated) {
    return (
      <div className="max-w-2xl">
        <CartSkeleton rows={3} />
      </div>
    );
  }

  if (items.length === 0 && !enviado) {
    return (
      <div className="rounded-card border border-ink/10 bg-card">
        <EmptyCart />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(alEnviar)}
      noValidate
      className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start"
    >
      <div className="space-y-6 rounded-card border border-ink/10 bg-card p-5 sm:p-7">
        <fieldset className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">Retiro</legend>

          <input type="hidden" {...register("pickupPointId")} />
          <input type="hidden" {...register("pickupDate")} />

          <SelectorDeRetiro
            puntos={puntos}
            puntoElegido={puntoElegido}
            fechaElegida={fechaElegida}
            onElegirPunto={elegirPunto}
            onElegirFecha={(fecha) => setValue("pickupDate", fecha, { shouldValidate: true })}
            errorPunto={errors.pickupPointId?.message}
            errorFecha={errors.pickupDate?.message}
          />
        </fieldset>

        <fieldset className="space-y-5 border-t border-ink/10 pt-6">
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
              hint="Por si necesitamos coordinar algo del pedido."
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

          <Field
            id="notes"
            label="Comentarios sobre el pedido"
            hint="Cortes, presentación, algo para tener en cuenta."
            error={errors.notes?.message}
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
          <BotonConfirmar enviando={isSubmitting} />
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

        {errorGeneral ? (
          <p
            role="alert"
            className="rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 p-4 text-sm font-medium leading-relaxed text-ink"
          >
            {errorGeneral}
          </p>
        ) : null}

        <OrderSummary items={items} total={total} />

        <div className="lg:hidden">
          <BotonConfirmar enviando={isSubmitting} />
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

function BotonConfirmar({ enviando }: { enviando: boolean }) {
  return (
    // `disabled` mientras se envía: dos clics no pueden crear dos pedidos.
    <Button type="submit" size="lg" className="w-full" disabled={enviando}>
      {enviando ? (
        <>
          <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
          Confirmando…
        </>
      ) : (
        "Confirmar pedido"
      )}
    </Button>
  );
}
