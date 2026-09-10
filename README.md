# La Cuchilla — Ecommerce (MVP)

Tienda online de la quesería artesanal uruguaya **La Cuchilla**: quesos por
kilo, dulces, mermeladas, pizza y chorizo. Esta es la **fase 1**: una web
completamente navegable y demostrable, pensada primero para el celular, con
catálogo, carrito y checkout sin registro.

> ### ⚠️ Antes de publicar: hay que reemplazar las fotos
>
> Las 18 imágenes del sitio son **material provisorio de Wikimedia Commons**,
> cargado para construir y validar el MVP. Cuatro tienen además un problema de
> contenido. **Ninguna puede quedar publicada como definitiva.**
> El inventario completo, los motivos y el procedimiento están en
> **[`IMAGE_REPLACEMENT_TODO.md`](./IMAGE_REPLACEMENT_TODO.md)**.
>
> El build de producción se corta solo mientras quede material provisorio, así
> que esto no se publica por descuido.

> **Qué hace y qué no hace todavía**
>
> El pedido se guarda en la base, el cliente elige dónde y qué día lo retira, y
> en la confirmación ve los datos para transferir. El dueño confirma el pago a
> mano desde el panel cuando ve la plata en el banco.
>
> **No** hay pago online (ni Mercado Pago), ni cuentas de cliente, ni avisos
> automáticos: los estados del pedido son internos y el cliente no recibe
> ninguna notificación. Es el flujo que hoy usa el negocio, puesto en una web.

## Qué incluye

- **Home / tienda**: hero, franja de beneficios, catálogo completo, cómo
  comprar y contacto.
- **Catálogo** con filtros por categoría (Todos · Quesos · Mermeladas y dulces
  · Otros) y compra directa desde la tarjeta, sin entrar a una página de
  producto.
- **Selector de kilos** (1 a 5 kg) en los productos que se venden por peso y
  **selector de cantidad** en los que se venden por unidad, con el total
  actualizándose en vivo.
- **Carrito lateral** siempre accesible desde el header, con badge de
  cantidad, y **página `/carrito`** completa.
- **Checkout sin registro** (`/checkout`) validado con Zod + React Hook Form:
  se elige un punto de retiro y una de sus próximas fechas concretas.
- **Confirmación** (`/pedido-confirmado`) con el número de pedido, los **datos
  bancarios para transferir**, dónde y cuándo retirar, y el detalle de lo
  pedido. El pedido queda guardado en PostgreSQL.
- **Panel de pedidos** con el botón **Confirmar pago**, pensado para usarse en
  el celular con el banco abierto al lado, y **hoja de carga por entrega**:
  cuánto hay que llevar de cada producto y qué bolsa es de quién. Ver
  [`docs/pedidos-y-retiros.md`](./docs/pedidos-y-retiros.md).
- Carrito **persistido en `localStorage`**: si el cliente cierra el navegador,
  su pedido sigue ahí.

## Stack

| Pieza | Elección |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript (modo estricto) |
| Estilos | Tailwind CSS v4 (tokens de marca en `src/app/globals.css`) |
| Estado | Zustand + `persist` sobre `localStorage` |
| Formularios | React Hook Form + Zod |
| Iconos | lucide-react |
| Tipografías | Fraunces (títulos) e Inter (texto), vía `next/font` |
| Base de datos | PostgreSQL (Neon) con Drizzle ORM |
| Imágenes nuevas | Vercel Blob |

Sin pasarelas de pago todavía: se cobra por transferencia. El catálogo, los
pedidos y los puntos de retiro viven en PostgreSQL y se administran desde
**[`/admin`](./docs/admin-productos.md)**.

## Puesta en marcha

Requisitos: **Node.js 20 o superior** y npm.

```bash
npm install               # instalar dependencias
npm run db:local          # PostgreSQL local para desarrollo (otra terminal)
npm run db:migrate        # aplicar migraciones
npm run db:seed           # sembrar el catálogo inicial
npm run dev               # desarrollo -> http://localhost:3000
npm test                  # pruebas
npm run lint              # ESLint
npm run build             # build de producción
npm start                 # servir el build de producción
npm run verificar:imagenes  # estado de las imágenes provisorias
```

## Estructura

```
public/
├── brand/                   # logo oficial y sus derivados
└── products/                # 17 fotos de producto en WebP
src/
├── app/                     # rutas del App Router
│   ├── page.tsx             # / (home = tienda)
│   ├── carrito/             # /carrito
│   ├── checkout/            # /checkout
│   ├── pedido-confirmado/   # /pedido-confirmado
│   ├── icon.svg             # favicon derivado del logo
│   ├── opengraph-image.tsx  # imagen para compartir en WhatsApp/redes
│   └── globals.css          # paleta, tipografías y utilidades
├── components/
│   ├── cart/                # carrito lateral, líneas, página de carrito
│   ├── checkout/            # formulario, campos, resumen del pedido
│   ├── home/                # hero, beneficios, catálogo, cómo comprar, contacto
│   ├── layout/              # header y footer
│   ├── order/               # confirmación del pedido
│   ├── product/             # tarjeta, imagen, selectores
│   └── ui/                  # botón, logo, toasts
├── config/site.ts           # datos de contacto y textos globales
├── data/products.ts         # catálogo (única fuente de verdad)
└── lib/                     # store del carrito, formato de precios, validación
```

## Editar el contenido

### Productos y precios

Se administran desde el panel en **`/admin`**, sin tocar código. Ver
[`docs/admin-productos.md`](./docs/admin-productos.md).

`src/data/seed-products.ts` conserva el catálogo original, pero **solo se usa
para sembrar una base vacía**: editarlo ya no cambia la tienda. Cada producto
del seed se ve así:

```ts
{
  slug: "queso-colonia",       // único; también es el nombre de la foto
  image: "/products/queso-colonia.webp",
  alt: "Queso Colonia de La Cuchilla",
  name: "Queso Colonia",
  category: "quesos",          // "quesos" | "dulces" | "otros"
  saleUnit: "kg",              // "kg" (precio por kilo) | "unit" (por unidad)
  price: 390,                  // pesos uruguayos, sin decimales
  presentation: "Venta por kilo",
  description: "…",
  weightOptions: WEIGHT_OPTIONS, // solo para saleUnit "kg": [1,2,3,4,5]
}
```

- **Cambiar un precio**: editá `price`. Los totales, el carrito y el checkout
  se recalculan solos.
- **Agregar un producto**: copiá un objeto, poné un `slug` nuevo y sumá la foto
  (ver `PRODUCT_IMAGES.md`).
- **Sacar un producto de la tienda**: borrá el objeto o comentálo.
- Los precios se muestran en pesos uruguayos, sin decimales y con punto de
  miles (`$1.170`), desde `src/lib/format.ts`.

### Datos de contacto

Están centralizados en **`src/config/site.ts`**: WhatsApp, Instagram,
dirección, horarios, email y el aviso de pago por transferencia.

El WhatsApp ya es el real (**+598 99 617 718**). Instagram, dirección y email
están **vacíos a propósito**: la web omite del contacto y del pie cualquier
dato en blanco, así no se muestra información inventada. Completalos cuando el
negocio los confirme y aparecen solos. Los horarios son genéricos y conviene
confirmarlos.

### Logo

El sello oficial de La Cuchilla está integrado. Los archivos son:

| Archivo | Para qué |
| --- | --- |
| `public/brand/logo-la-cuchilla.jpeg` | **Original oficial**, tal cual lo entregó el negocio. Es la fuente de verdad de la marca. |
| `public/brand/logo-la-cuchilla.png` | Derivado del anterior con **fondo transparente** y tinta en `#4A2E1E`. Es el que se ve en el header. |
| `public/brand/logo-la-cuchilla-mono.png` | Misma silueta a 320 px. Se usa como máscara CSS para pintar el sello de crema sobre el marrón del footer. |
| `src/app/icon.svg` | Favicon: versión plana y simplificada del sello (cuña y cuchilla), pensada para leerse a 16 y 32 px. |

Por qué hay derivados y no se usa el JPEG directo: el original está sobre papel
texturado, así que sobre el crema del sitio se le nota el recuadro y sobre el
marrón del footer aparece como un bloque claro. Los derivados se generan del
**mismo archivo** pasando la luminancia del papel a canal alfa: el papel queda
transparente y la tinta conserva su trama. El sello no se deforma ni se recorta
—se mantiene cuadrado y completo—, solo se le quita el margen de papel en
blanco que lo rodeaba.

El sello incluye dibujado "Quesería La Cuchilla · Quesos con carácter", pero a
48 px ese texto no se lee: por eso el header y el footer lo acompañan con el
nombre en tipografía. Si preferís mostrar solo la insignia, poné
`LOGO_INCLUDES_WORDMARK = true` en `src/components/ui/Logo.tsx`.

**Si cambia el logo**, reemplazá `public/brand/logo-la-cuchilla.jpeg` y volvé a
generar los dos PNG derivados a partir de él.

### Fotografías

Los 17 productos ya tienen su foto en `public/products/`, en WebP.

> ⚠️ **Son provisorias.** Vienen de Wikimedia Commons y no representan
> necesariamente el producto real de La Cuchilla. Antes de abrir la tienda al
> público hay que reemplazarlas por fotografías propias, o confirmar la
> licencia y la atribución de cada archivo: buena parte del material de
> Wikimedia exige atribuir al autor incluso en uso comercial.
>
> Requisito obligatorio, inventario y procedimiento:
> **[`IMAGE_REPLACEMENT_TODO.md`](./IMAGE_REPLACEMENT_TODO.md)**.

Ver **[`PRODUCT_IMAGES.md`](./PRODUCT_IMAGES.md)**: nombres exactos de archivo,
qué revisar de cada foto antes de publicar, especificaciones y cómo optimizar.
Si en algún momento falta una foto, la web no se rompe: muestra un placeholder
de marca y **sigue funcionando sin imágenes rotas**.

Las fotos tienen proporciones muy distintas entre sí y aun así la grilla se ve
pareja: el recuadro de la tarjeta mantiene 4:3 y la foto se ajusta con
`object-fit: cover` sobre fondo crema, sin deformarse nunca. Si alguna quedara
mal recortada, se le pone `imageFit: "contain"` en `src/data/products.ts`.

## Desplegar en Vercel

El proyecto no necesita variables de entorno ni servicios externos **salvo
una**, mientras las fotos sigan siendo provisorias: el build de producción se
corta a propósito para que este material no se publique por descuido. Para una
demo pública hay que definir `PERMITIR_IMAGENES_PROVISORIAS=1` en
**Settings → Environment Variables**, y quitarla en cuanto se reemplacen las
fotos. Ver [`IMAGE_REPLACEMENT_TODO.md`](./IMAGE_REPLACEMENT_TODO.md).

1. Subí el repositorio a GitHub (ya está).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importá el
   repo `Lacuchilla`.
3. Vercel detecta Next.js solo. Framework preset: *Next.js*. Build command:
   `next build`. Output: por defecto.
4. **Deploy**. En cada push a la rama principal se despliega de nuevo.
5. Cuando haya dominio propio: **Settings → Domains**, y actualizá `url` en
   `src/config/site.ts` para que los metadatos de Open Graph apunten bien.

## Accesibilidad y calidad

- HTML semántico, navegación por teclado y foco visible en todos los
  controles.
- Etiquetas asociadas a cada campo del formulario y errores anunciados con
  `role="alert"`.
- Áreas táctiles de 44 px como mínimo en botones y selectores.
- Sin errores de TypeScript, sin advertencias de ESLint y sin errores de
  consola en el navegador.
- Ningún texto por debajo de 12 px y ningún campo por debajo de 16 px: a menos
  de 16 px, iOS hace zoom automático al enfocar un input y descoloca la página.

### Auditoría responsive

El recorrido completo se verificó en **14 anchos**, de 320 px a 1920 px, más
apaisado (844 × 390), sobre las cuatro rutas y con el carrito lateral y el menú
móvil abiertos. En cada combinación se midió:

- desborde horizontal del documento y elementos que se salen del viewport;
- áreas táctiles por debajo de 44 px;
- texto por debajo de 12 px y campos por debajo de 16 px;
- texto recortado, errores de consola y respuestas HTTP 4xx/5xx.

Resultado: sin desbordes, sin errores de consola y sin peticiones fallidas en
ningún ancho. El flujo de compra completo (filtrar, elegir kilos, agregar,
modificar el carrito, validar el checkout y confirmar) se probó de punta a
punta en 320, 390, 768 y 1440 px.

Puntos de quiebre del catálogo: una columna hasta 379 px, dos desde 380 px,
tres desde 1024 px y cuatro desde 1280 px. El selector de kilos es un
desplegable nativo por debajo de 640 px y un control segmentado de cinco
pastillas a partir de ahí.

## Fase 2 — qué queda pendiente

La arquitectura está preparada para sumar esto sin rehacer el front:

- **Pantalla de clientes** con su historial de pedidos.
- **Exportar la entrega** para imprimir o mandar por WhatsApp.
- **Disponibilidad por entrega**, para cuando alguien pida 5 kg que no hay.
- **Reportes** de ventas por entrega y por producto.
- **Mercado Pago** (rama aparte, ver
  [`docs/mercadopago-mvp-plan.md`](./docs/mercadopago-mvp-plan.md)).
- **Avisos por WhatsApp** al confirmar el pago.
- Página individual de producto y buscador, si el catálogo crece.

---

**La Cuchilla — Quesos con carácter**
