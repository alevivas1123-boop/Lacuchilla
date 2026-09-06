import type { Metadata } from "next";

import { OrderConfirmation } from "@/components/order/OrderConfirmation";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  description: "Recibimos tu pedido. Te escribimos para coordinar el pago y la entrega.",
  robots: { index: false, follow: false },
};

export default function PedidoConfirmadoPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <OrderConfirmation />
    </div>
  );
}
