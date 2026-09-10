# Plan: pedidos, puntos de retiro y confirmación de pago

Estado: **Fase 1 implementada**. Este documento es el plan original, que se
conserva porque explica *por qué* el modelo es así.
Cómo funciona lo que quedó construido está en
[`pedidos-y-retiros.md`](./pedidos-y-retiros.md).

## El problema

Hoy el pedido **no existe**. El checkout arma un resumen, lo guarda en
`sessionStorage` del navegador y muestra la pantalla de confirmación. Si el
cliente cierra la pestaña, no queda rastro: lo único que llega al negocio es
que la persona escriba por WhatsApp.

Además el checkout pregunta "envío o retiro" y pide dirección y localidad, pero
la operación real son **dos puntos fijos con día fijo**: Carrasco los jueves y
Cuchilla Alta los fines de semana. El formulario no describe el negocio.

## La idea central

Con puntos fijos y días fijos, la unidad de operación no es el pedido: es la
**tanda** — la combinación de un punto y una fecha concreta.

El dueño no se pregunta "mostrame los pedidos". Se pregunta:

1. ¿Qué cargo en el auto el jueves? → **un total por producto**
2. ¿Quién pagó y quién no?
3. ¿Qué bolsa es de quién?

La pregunta 1 es la que ningún ecommerce estándar responde, porque los
ecommerce despachan de a uno. Es la que evita llegar a Carrasco sin el queso de
alguien, y por eso la hoja de carga es una pantalla de primera clase, no un
reporte escondido.

**Consecuencia de diseño:** el ABM define el patrón recurrente (*Carrasco,
jueves, 17 a 19 h*), pero el pedido guarda una **fecha concreta**
(*jueves 18/9*). Sin fecha en el pedido, todos los pedidos de Carrasco caen en
la misma bolsa y la hoja de carga no sirve.

---

## Modelo de datos

Cinco tablas nuevas. Sigue las convenciones ya establecidas en `products`:
precios enteros en pesos, baja lógica, `CHECK` en la base además de Zod.

### `pickup_points` — puntos de retiro (ABM del admin)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | |
| `name` | varchar(80) | "Carrasco" |
| `address` | varchar(200) | "Av. Bolivia 1234" |
| `weekday` | smallint | 0 = domingo … 6 = sábado |
| `time_from` / `time_to` | time | 17:00 / 19:00 |
| `cutoff_hours` | integer | Horas antes del retiro en que se cierran los pedidos. Default 24. |
| `instructions` | text | "Frente a la plaza, auto blanco". Se le muestra al cliente. |
| `active` | boolean | Baja lógica |
| `sort_order` | integer | |
| `created_at` / `updated_at` | timestamptz | |

Un punto con varios días (por ejemplo Cuchilla Alta sábado **y** domingo) se
carga como dos filas. Es más simple que un array de días y permite horarios
distintos por día.

### `orders` — pedidos

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | |
| `order_number` | varchar(24) | Único. `LC-260918-4821` |
| `status` | enum | Ver máquina de estados |
| `customer_id` | uuid FK | |
| `customer_name` / `customer_phone` / `customer_email` | varchar | Copia al momento del pedido |
| `pickup_point_id` | uuid FK | `ON DELETE RESTRICT` |
| `pickup_date` | date | **Fecha concreta**, derivada del patrón |
| `pickup_point_name` / `pickup_address` / `pickup_time_from` / `pickup_time_to` | | **Copia** al momento del pedido |
| `notes` | text | Comentarios del cliente |
| `total` | integer | Pesos enteros. Recalculado en el servidor. |
| `payment_method` | enum | `transferencia`. Preparado para `mercadopago`. |
| `paid_at` | timestamptz | Cuándo el admin confirmó el pago |
| `prepared_at` / `delivered_at` / `cancelled_at` | timestamptz | |
| `cancel_reason` | varchar(200) | |
| `created_at` / `updated_at` | timestamptz | |

**Por qué se copian los datos del punto:** si mañana se cambia el horario de
Carrasco o se da de baja el punto, el pedido histórico tiene que seguir
diciendo dónde y cuándo era. Un pedido es un documento, no una vista.

### `order_items` — líneas del pedido

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | |
| `order_id` | uuid FK | `ON DELETE CASCADE` |
| `product_id` | uuid FK | `ON DELETE RESTRICT` |
| `product_name` / `slug` / `presentation` / `unit_label` / `sale_type` | | **Copia** |
| `unit_price` | integer | **Copia**: lo que se cobró, no lo que vale hoy |
| `quantity` | integer | |
| `line_total` | integer | `unit_price * quantity`, guardado |

La copia es obligatoria. Si se sube el precio del Colonia, el pedido de la
semana pasada tiene que seguir diciendo lo que se cobró.

### `customers` — clientes

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | |
| `phone` | varchar(24) | **Único**, normalizado. Es la identidad en Uruguay. |
| `name` | varchar(160) | El último usado |
| `email` | varchar(160) | Opcional |
| `created_at` / `updated_at` | timestamptz | |

Sin contadores desnormalizados: la cantidad de pedidos y el total gastado se
calculan con una consulta. Son pocos datos y evita mantener nada sincronizado.

**Normalización del teléfono:** guardar solo dígitos, con prefijo país. `099
123 456`, `099123456` y `+598 99 123 456` tienen que caer en el mismo cliente.

### `store_settings` — configuración del negocio (una sola fila)

Datos bancarios editables desde el admin: titular, banco, número de cuenta,
tipo, RUT o CI, e instrucciones libres.

**Por qué en la base y no en `site.ts`:** son la única forma de cobrar. Si
están mal o cambia la cuenta, el dueño no puede cobrar hasta que alguien
despliegue. Eso no puede depender de un deploy.

---

## Máquina de estados

```
pendiente_pago ──► pagado ──► preparado ──► entregado
      │              │            │
      └──────────────┴────────────┴──────► cancelado
```

| Estado | Significado | Quién lo dispara |
| --- | --- | --- |
| `pendiente_pago` | Pedido recibido, esperando ver la transferencia | Automático al confirmar la compra |
| `pagado` | El admin vio la plata en el banco | Botón **Confirmar pago** |
| `preparado` | Armado y embolsado para la tanda | Botón, al usar la hoja de carga |
| `entregado` | El cliente lo levantó | Botón |
| `cancelado` | No pagó, se arrepintió o no retiró | Botón, con motivo |

`preparado` es opcional: se puede ir de `pagado` a `entregado` directo.

**Nada de esto le llega al cliente.** Los estados son internos, como se definió.

---

## Qué cambia del lado del cliente

El checkout reemplaza "envío o retiro + dirección + localidad" por:

1. **Punto de retiro** — tarjetas con nombre, dirección, día y horario
2. **Fecha** — las próximas 3 ocurrencias de ese punto, respetando el corte
3. **Datos** — nombre y teléfono obligatorios, email opcional, comentarios
4. **Pago** — transferencia bancaria (único medio por ahora)

Al confirmar, la pantalla de confirmación muestra:

- Número de pedido
- **Datos bancarios para transferir** (desde `store_settings`)
- Dónde y cuándo retirar, con las instrucciones del punto
- El detalle del pedido

**Riesgo asumido:** el cliente transfiere y no recibe ninguna confirmación de
que la plata llegó. Es probable que escriba por WhatsApp preguntando. La
mitigación barata, sin construir notificaciones, es que la pantalla de
confirmación diga con claridad qué pasa después: *"Cuando veamos la
transferencia queda confirmado. Te esperamos el jueves 18 en Carrasco de 17 a
19."* El botón de WhatsApp que ya existe cubre el resto.

---

## Pantallas del admin

### 1. Pedidos (listado)

Filtros por estado, punto, fecha de retiro. Búsqueda por nombre, teléfono o
número de pedido. Por defecto: **los de la próxima tanda**.

### 2. Pendientes de pago — pensada para el pulgar

El dueño confirma pagos **desde el celular con el banco abierto en otra app**.
Esa pantalla no es una tabla: es una lista de tarjetas grandes con nombre,
**monto bien visible**, fecha del pedido y un botón `Confirmar pago`. Cuanto
menos haya que apuntar y volver, mejor.

### 3. Detalle del pedido

Items, cliente, punto y fecha, total, historial de estados y los botones.

### 4. Hoja de carga por tanda — `/admin/tandas/[punto]/[fecha]`

Dos bloques:

- **Qué llevar** — total por producto sumando todos los pedidos pagados.
  *Colonia: 14 kg · Dambo: 6 kg · Dulce de leche: 9 frascos.*
- **Qué es de quién** — una tarjeta por cliente con sus items, para tildar
  mientras se arma.

Legible en el celular y en papel. Es la pantalla que se usa el día de la tanda.

### 5. Puntos de retiro (ABM)

Mismo patrón que el ABM de productos: listado, alta, edición, baja lógica.

### 6. Configuración

Datos bancarios. Una pantalla chica.

---

## Reglas del servidor

El pedido se crea en una **acción de servidor con sesión no requerida** (el
cliente no tiene cuenta), pero **nada de lo que manda el cliente se cree**:

- El total y cada precio se **recalculan desde la base**. Ya existe el patrón
  en `revalidarCarrito`.
- El punto tiene que existir y estar activo.
- La fecha tiene que caer en el día correcto del punto, ser futura y respetar
  el corte.
- El pedido se crea en una **transacción** junto con sus items y el cliente.
- Doble clic no crea dos pedidos: bloquear el botón durante el envío.

Los cambios de estado sí exigen sesión de admin, como el resto del panel.

---

## Fases

### Fase 1 — que el pedido exista y se pueda operar ✅

Sin esto no se puede vender el jueves. **Está hecho.**

1. ✅ Migración: `pickup_points`, `customers`, `orders`, `order_items`,
   `store_settings`
2. ✅ ABM de puntos de retiro
3. ✅ Configuración de datos bancarios
4. ✅ Checkout nuevo: punto + fecha, y el pedido persiste
5. ✅ Confirmación con datos bancarios y lugar de retiro
6. ✅ Panel de pedidos + **Confirmar pago**
7. ✅ **Hoja de carga por tanda**

Se adelantaron dos cosas de la Fase 2 porque salían casi gratis con lo
anterior: los estados `preparado` y `entregado` se tildan desde la hoja de
carga, y cancelar pide motivo.

### Fase 2 — que sea cómodo

8. Pantalla de clientes con historial
9. Estados `preparado` y `entregado` con tildado rápido desde la hoja de carga
10. Exportar la tanda (imprimir o CSV)
11. Cancelar con motivo

### Fase 3 — después

12. Disponibilidad por tanda (cuando alguien pida 5 kg que no hay)
13. Reportes de ventas por tanda y por producto
14. Mercado Pago (rama aparte, ya documentada)
15. Avisos por WhatsApp

---

## Supuestos tomados

Ninguno bloquea el arranque, pero conviene confirmarlos:

1. **Si no transfiere antes del corte**, el pedido queda `pendiente_pago` y el
   admin lo cancela a mano. Sin automatismo: cancelar solo podría borrar un
   pedido que sí se pagó.
2. **Se puede pedir para las próximas 3 ocurrencias** de cada punto.
3. **Los dos puntos venden el mismo catálogo.** Si no, hace falta
   disponibilidad por punto y cambia el modelo.
4. **No hay mínimo de compra.** Queda como campo en `store_settings` para
   cuando haga falta.
5. **Si no retiran**, el admin marca `cancelado` con motivo. Es comida fresca
   ya pagada: la decisión de qué hacer con la plata es del negocio, no del
   sistema.

## Fuera de alcance

Notificaciones al cliente, cuentas de cliente con login, stock real,
facturación, cupones, envíos a domicilio.
