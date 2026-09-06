import { Award, PackageCheck, Scale, Truck } from "lucide-react";

const benefits = [
  {
    icon: Award,
    title: "Productos seleccionados",
    description: "Elaboración artesanal y control de cada partida antes de salir.",
  },
  {
    icon: Scale,
    title: "Venta por kilo",
    description: "Elegís los kilos exactos que necesitás, sin paquetes fijos.",
  },
  {
    icon: PackageCheck,
    title: "Pedidos fáciles",
    description: "Armás el pedido en el celular en dos minutos, sin registrarte.",
  },
  {
    icon: Truck,
    title: "Entrega o retiro",
    description: "Coordinamos contigo el día, la hora y el punto de encuentro.",
  },
];

export function Benefits() {
  return (
    <section aria-label="Por qué comprar en La Cuchilla" className="border-b border-ink/10 bg-card">
      <ul className="container-page grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:py-12">
        {benefits.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-bark">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-bark">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
