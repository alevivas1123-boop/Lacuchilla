# Plan de integración de Mercado Pago — MVP La Cuchilla

> Documento de investigación y handoff. No implementa pagos ni contiene credenciales.

## Decisión recomendada

Para el MVP se recomienda **Mercado Pago Checkout Pro** para Uruguay.

Flujo esperado:

1. El comprador arma su pedido en La Cuchilla.
2. El backend crea y guarda el pedido.
3. El backend crea una preferencia de Mercado Pago.
4. El comprador es redirigido al checkout seguro de Mercado Pago.
5. Paga con crédito, débito, saldo de Mercado Pago u otros medios habilitados.
6. Mercado Pago envía un webhook al backend.
7. El backend consulta el pago a Mercado Pago, valida importe, moneda y pedido, y actualiza su estado.
8. El comprador vuelve a La Cuchilla y ve el estado real almacenado.

Checkout Pro es preferible a Checkout Bricks o Checkout API para esta primera versión porque reduce desarrollo, QA y alcance de seguridad. Su principal desventaja es que el usuario sale momentáneamente de La Cuchilla para pagar.

## Decisión pendiente sobre entregas

El costo de envío actualmente queda “a coordinar”. No conviene cobrar con tarjeta un total que pueda cambiar después.

Propuesta inicial:

- **Retiro en el local:** Mercado Pago o transferencia bancaria.
- **Envío:** transferencia y coordinación manual.
- Habilitar Mercado Pago para envíos cuando exista una tarifa fija o una tabla por zona.

## Estado actual del repositorio

- Next.js 16 App Router, React 19, TypeScript estricto y Tailwind CSS 4.
- Catálogo local en `src/data/products.ts`.
- Carrito Zustand persistido en `localStorage`.
- Checkout actual ejecutado en cliente.
- El pedido se guarda solamente en `sessionStorage`.
- No existe base de datos, API de pedidos ni autenticación.
- La confirmación actual no sirve como fuente confiable para un pago real.

Antes de cobrar se debe persistir el pedido en servidor y recalcular allí todos los precios. Nunca se debe confiar en precios, nombres o totales enviados por el navegador.

## Arquitectura propuesta

- Mercado Pago Checkout Pro.
- SDK oficial `mercadopago`.
- PostgreSQL administrado, por ejemplo Neon desde Vercel.
- Drizzle ORM.
- API Routes de Next.js para crear preferencias y recibir webhooks.

### Tablas mínimas

- `orders`: comprador, entrega, método de pago, importes, estados e identificadores de Mercado Pago.
- `order_items`: snapshot del producto, precio y cantidad comprada.
- `payment_events`: eventos procesados para deduplicar webhooks.

### Estados sugeridos

- `pending_payment`
- `pending_transfer`
- `payment_in_process`
- `paid`
- `payment_rejected`
- `cancelled`
- `refunded`

El estado de entrega debe almacenarse por separado del estado del pago.

### Endpoints mínimos

#### `POST /api/checkout/mercadopago`

- Acepta datos del comprador y líneas `slug + cantidad`.
- Valida con Zod.
- Busca los productos en el catálogo del servidor.
- Recalcula subtotal y total.
- Guarda el pedido como `pending_payment`.
- Crea una preferencia en UYU.
- Usa un ID de pedido como `external_reference`.
- Configura `notification_url`, `back_urls` y `auto_return: "approved"`.
- Guarda `preference_id`.
- Devuelve `init_point` y el ID público del pedido.
- Debe ser idempotente.

#### `POST /api/webhooks/mercadopago`

- Valida `x-signature` usando la clave del webhook.
- Rechaza firmas inválidas sin modificar pedidos.
- Deduplica eventos.
- Consulta el pago directamente a Mercado Pago.
- Comprueba `external_reference`, moneda e importe.
- Actualiza el estado idempotentemente.
- Responde rápidamente.

El redirect del navegador nunca debe marcar por sí solo un pedido como pagado.

## Variables de entorno

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-REEMPLAZAR
MERCADOPAGO_WEBHOOK_SECRET=REEMPLAZAR
DATABASE_URL=postgresql://REEMPLAZAR
APP_URL=http://localhost:3000
```

En producción, `APP_URL=https://lacuchilla.vercel.app`.

El Access Token, la clave del webhook y `DATABASE_URL` deben cargarse directamente como secretos de Vercel. Nunca deben enviarse por chat, incluirse en prompts, usar el prefijo `NEXT_PUBLIC_`, registrarse en logs ni subirse a GitHub.

Checkout Pro por redirección no requiere inicialmente una Public Key en el frontend.

## Configuración que debe realizar el propietario

1. Ingresar en [Mercado Pago Developers Uruguay](https://www.mercadopago.com.uy/developers/es).
2. Usar la cuenta uruguaya verificada donde se recibirán los cobros.
3. Ir a **Tus integraciones → Crear aplicación**.
4. Crear `La Cuchilla Ecommerce` para pagos online con Checkout Pro.
5. Empezar con credenciales de prueba.
6. Configurar las URLs de retorno públicas.
7. Configurar el webhook productivo:
   `https://lacuchilla.vercel.app/api/webhooks/mercadopago`.
8. Seleccionar el evento de pagos y probar la simulación.
9. Cargar personalmente los secretos en Vercel.
10. Completar las pruebas antes de activar credenciales productivas.

El teléfono no se vincula a la API: solamente verifica y protege la cuenta. La integración técnica se vincula mediante la aplicación y sus credenciales.

## Referencias oficiales

- [Primeros pasos](https://www.mercadopago.com.uy/developers/es/docs/getting-started)
- [Checkout Pro](https://www.mercadopago.com.uy/developers/es/docs/checkout-pro/overview)
- [Credenciales y datos de integración](https://www.mercadopago.com.uy/developers/es/docs/checkout-pro/additional-content/your-integrations/application-details)
- [URLs de retorno](https://www.mercadopago.com.uy/developers/es/docs/checkout-pro-preferences/configure-back-urls)
- [Webhooks](https://www.mercadopago.com.uy/developers/es/docs/checkout-pro/additional-content/notifications/webhooks)
- [Salida a producción](https://www.mercadopago.com.uy/developers/es/docs/checkout-pro/go-to-production)
- [Checkout Bricks](https://www.mercadopago.com.uy/developers/es/docs/checkout-bricks/overview)
- [Checkout API](https://www.mercadopago.com.uy/developers/es/docs/checkout-api-payments/overview)
- [Costos de checkout en Uruguay](https://www.mercadopago.com.uy/herramientas-para-vender/check-out)

Al momento de la investigación, Mercado Pago publicaba para Uruguay 5,99% + IVA con disponibilidad inmediata o 4,99% + IVA en 21 días, sin mensualidad. Debe confirmarse nuevamente antes de producción.

## Criterios de aceptación

1. Modificar un precio desde DevTools no cambia el total real.
2. La preferencia coincide con el cálculo del servidor.
3. Solo el webhook verificado y la consulta server-to-server pueden confirmar el pago.
4. Los webhooks duplicados no duplican eventos ni transiciones.
5. Una firma inválida no modifica datos.
6. Los estados aprobado, pendiente y rechazado se muestran correctamente.
7. Abandonar el pago no destruye el pedido ni el carrito.
8. La transferencia sigue funcionando.
9. Ningún secreto aparece en cliente, logs o repositorio.
10. El flujo funciona en móvil y supera lint/build.

## Prompt de implementación para Claude

```text
Trabajá sobre el repositorio existente:
https://github.com/alevivas1123-boop/Lacuchilla

Objetivo: integrar Mercado Pago Checkout Pro para Uruguay manteniendo la transferencia bancaria.

Antes de modificar código:
- Inspeccioná la arquitectura actual.
- Creá `feature/mercadopago-checkout-pro` desde el main actualizado.
- No trabajes directamente sobre main.
- No inventes, solicites ni agregues credenciales reales.
- No escribas secretos en código, documentación, logs o commits.
- Implementá primero el ambiente de prueba.
- Al terminar ejecutá lint, build y pruebas, y creá un PR sin fusionarlo.

Producto:
- Retiro: permitir Mercado Pago o transferencia.
- Envío: mantener transferencia y coordinación manual hasta definir la tarifa.
- Moneda UYU.
- Usar Checkout Pro con redirección; no usar Bricks ni formulario propio.

Persistencia:
- Agregá PostgreSQL compatible con Neon/Vercel y Drizzle ORM.
- Creá tablas `orders`, `order_items` y `payment_events`.
- Separá estado de pago y estado de entrega.
- Estados de pago: pending_payment, pending_transfer, payment_in_process, paid, payment_rejected, cancelled y refunded.

Servidor:
- Instalá el SDK oficial `mercadopago`.
- Creá `src/lib/mercadopago.ts` como módulo server-only.
- Creá un schema Zod compartido.
- El frontend debe enviar solo slug/ID y cantidad.
- Buscá cada producto en `src/data/products.ts` y recalculá precios en servidor.
- Para productos por peso validá entre 1 kg y 5 kg.
- Nunca confíes en nombres, precios o totales del cliente.

Creá `POST /api/checkout/mercadopago` que:
- valide comprador y carrito;
- persista el pedido como pending_payment;
- cree una preferencia en UYU;
- use external_reference con el pedido;
- configure notification_url, back_urls y auto_return approved;
- guarde preference_id;
- devuelva init_point, preferenceId e ID público;
- implemente idempotencia.

Creá `POST /api/webhooks/mercadopago` que:
- valide x-signature con MERCADOPAGO_WEBHOOK_SECRET;
- rechace firmas inválidas;
- deduplique eventos;
- consulte el pago a Mercado Pago;
- valide external_reference, moneda y monto;
- actualice el pedido idempotentemente;
- responda rápido y no almacene datos sensibles innecesarios.

Checkout:
- Agregá selector Mercado Pago / transferencia.
- Mercado Pago solo debe estar disponible para retiro.
- Usá el CTA “Ir a Mercado Pago”.
- No limpies el carrito antes de crear el pedido.
- Evitá doble envío y mostrá carga/errores.
- Conservá el diseño y la experiencia móvil actual.

Confirmación:
- `/pedido-confirmado` debe consultar el pedido mediante un ID público opaco.
- Mostrar aprobado, pendiente, rechazado o transferencia pendiente.
- No confiar en parámetros de retorno para marcar pagado.

Variables en `.env.example`, solo ficticias:
MERCADOPAGO_ACCESS_TOKEN=TEST-REEMPLAZAR
MERCADOPAGO_WEBHOOK_SECRET=REEMPLAZAR
DATABASE_URL=postgresql://REEMPLAZAR
APP_URL=http://localhost:3000

No uses NEXT_PUBLIC_ para secretos.
Producción: https://lacuchilla.vercel.app
Webhook: https://lacuchilla.vercel.app/api/webhooks/mercadopago

Validá los diez criterios de aceptación documentados en `docs/mercadopago-mvp-plan.md`.

Al terminar entregá:
- resumen de arquitectura;
- migraciones;
- variables requeridas en Vercel;
- configuración exacta de Mercado Pago;
- pruebas manuales;
- URL del PR;
- no fusiones sin aprobación.
```

