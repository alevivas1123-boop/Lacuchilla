# La Cuchilla — Ecommerce (MVP)

Tienda online de la quesería artesanal uruguaya **La Cuchilla**: quesos por
kilo, dulces, mermeladas, pizza y chorizo. Esta es la **fase 1**: una web
completamente navegable y demostrable, pensada primero para el celular, con
catálogo, carrito y checkout sin registro.

> **Qué hace y qué no hace todavía**
>
> El pedido se confirma en la web y se muestra un número de pedido, pero
> **no se envía a ningún servidor**: no hay pago online, ni Mercado Pago, ni
> base de datos, ni panel administrativo, ni cuentas de usuario. El pedido se
> coordina después por WhatsApp y se cobra por transferencia bancaria. Es
> exactamente el flujo que hoy usa el negocio, puesto en una web.

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
- **Checkout sin registro** (`/checkout`) validado con Zod + React Hook Form,
  con dirección obligatoria solo si el cliente elige envío.
- **Confirmación** (`/pedido-confirmado`) con número de pedido simulado,
  resumen, datos del cliente y acceso directo a WhatsApp.
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
| Datos | archivo local tipado: `src/data/products.ts` |

Sin base de datos, sin backend, sin autenticación y sin pasarelas de pago.

## Puesta en marcha

Requisitos: **Node.js 20 o superior** y npm.

```bash
npm install       # instalar dependencias
npm run dev       # desarrollo -> http://localhost:3000
npm run lint      # ESLint
npm run build     # build de producción
npm start         # servir el build de producción
```

## Estructura

```
brand/                       # originales de marca (no se publican)
public/                      # logo, máscara y fotos de productos
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

Todo vive en **`src/data/products.ts`**. Cada producto es un objeto tipado:

```ts
{
  slug: "queso-colonia",       // único; también es el nombre de la foto
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
dirección, horarios, email y el aviso de pago por transferencia. Los valores
actuales son **placeholders**: hay que reemplazarlos por los reales antes de
publicar.

### Logo

El sello oficial de La Cuchilla ya está integrado. Los archivos son:

| Archivo | Para qué |
| --- | --- |
| `brand/logo-original.jpg` | Original tal cual llegó, sobre papel. Fuera de `public/`: no se publica, queda como respaldo. |
| `public/logo.png` | Sello recortado, con **fondo transparente** y tinta en `#4A2E1E`. Es el que se ve en el header. |
| `public/logo-mono.png` | Misma silueta a 320 px. Se usa como máscara CSS para pintar el sello de crema sobre el marrón del footer. |
| `src/app/icon.svg` | Favicon: versión plana y simplificada del sello (cuña y cuchilla), pensada para leerse a 16 y 32 px. |

El JPG original venía sobre papel texturado. Se le extrajo el fondo pasando la
luminancia a canal alfa: el papel queda transparente, la tinta conserva su
trama y el sello se puede apoyar sobre cualquier color de la paleta. Por eso
en el footer aparece en crema sobre marrón sin ninguna chapa de fondo.

El sello incluye dibujado "Quesería La Cuchilla · Quesos con carácter", pero a
44 px ese texto no se lee: por eso el header y el footer lo acompañan con el
nombre en tipografía. Si preferís mostrar solo la insignia, poné
`LOGO_INCLUDES_WORDMARK = true` en `src/components/ui/Logo.tsx`.

**Si cambia el logo**, reemplazá `public/logo.png` (PNG con transparencia,
cuadrado, 1024 px) y `public/logo-mono.png` (la misma silueta a 320 px, el
color no importa: solo se usa el canal alfa).

### Fotografías

Ver **[`PRODUCT_IMAGES.md`](./PRODUCT_IMAGES.md)**: nombres exactos de archivo,
tamaño recomendado (1200 × 900 px, WebP, 4:3) y cómo optimizar. Mientras no
existan las fotos, la web muestra placeholders de marca y **sigue funcionando
sin imágenes rotas**.

## Desplegar en Vercel

El proyecto no necesita variables de entorno ni servicios externos.

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

- **Persistencia real de pedidos**: hoy el pedido se arma en
  `CheckoutForm.onSubmit` y se guarda en `sessionStorage`. Ahí va el `POST` a
  una API route y a Supabase/PostgreSQL.
- **Gestión de productos** desde base de datos: `src/data/products.ts` es la
  única fuente de verdad y ya devuelve el tipo `Product`; se reemplaza por una
  consulta sin tocar los componentes.
- **Gestión de imágenes** (subida desde un panel) en lugar de archivos en
  `public/products`.
- **Panel administrativo** y estados de pedido.
- **Pagos**: transferencia bancaria con comprobante y/o Mercado Pago.
- **Notificación por WhatsApp** automática al confirmar el pedido.
- **Zonas y costos de envío** calculados (hoy el envío figura "a coordinar").
- **Registro opcional de clientes** para repetir pedidos.
- Página individual de producto y buscador, si el catálogo crece.

---

**La Cuchilla — Quesos con carácter**
