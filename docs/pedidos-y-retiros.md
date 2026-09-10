# Pedidos, puntos de retiro y confirmación de pago

Cómo funciona la venta de punta a punta, qué hace el dueño cada semana y qué
decisiones técnicas están detrás.

El plan que originó esto está en
[`pedidos-y-retiros-plan.md`](./pedidos-y-retiros-plan.md); acá está lo que
quedó implementado.

---

## El flujo, en una frase

El cliente elige **dónde y qué día** retira, deja su nombre y teléfono, y ve
**los datos para transferir**. El dueño mira el banco, aprieta **Confirmar
pago**, y el día de la entrega abre la **hoja de carga** para saber qué llevar.

**El cliente no recibe ningún aviso.** Los estados del pedido son internos.

---

## Lo que hace el dueño

### Antes de vender (una sola vez)

1. **`/admin/puntos`** — cargar los puntos de retiro: nombre, dirección, día,
   horario y cuántas horas antes se cierran los pedidos.
2. **`/admin/configuracion`** — cargar los datos bancarios. Sin titular y
   número de cuenta, la confirmación no puede decirle a nadie dónde transferir
   y le pide que escriba por WhatsApp.

### Cada día

**`/admin/pedidos`** — arriba, las próximas entregas con cuántos pedidos hay y
cuántos faltan cobrar. Abajo, la lista.

Cuando entra plata al banco: buscar el pedido por nombre, teléfono o número y
apretar **Confirmar pago**. Es una tarjeta con el monto grande y un botón
grande porque esto se hace parado, con el banco abierto en otra app.

### El día de la entrega

**Hoja de carga** (el botón en cada entrega, o `/admin/tandas/<punto>/<fecha>`).
Dos bloques:

- **Qué llevar** — el total por producto sumando todos los pedidos pagos.
  *Colonia: 14 kg · Dambo: 6 kg.* Es la pregunta que ningún ecommerce
  responde, porque los ecommerce despachan de a uno.
- **Qué es de quién** — una tarjeta por pedido para ir armando bolsa por bolsa,
  con botones para marcar preparado y entregado.

Los pedidos **sin cobrar no se suman** a lo que hay que llevar, y la pantalla
avisa cuántos son. La hoja se puede imprimir: la barra del panel y los botones
no salen.

---

## Estados del pedido

```
pendiente_pago ──► pagado ──► preparado ──► entregado
      │              │            │
      └──────────────┴────────────┴──────► cancelado
```

| Estado | Significado | Quién lo dispara |
| --- | --- | --- |
| `pendiente_pago` | Recibido, esperando ver la transferencia | Automático al comprar |
| `pagado` | Se vio la plata en el banco | Botón **Confirmar pago** |
| `preparado` | Armado y embolsado | Botón, desde la hoja de carga |
| `entregado` | El cliente lo levantó | Botón |
| `cancelado` | No pagó, se arrepintió o no retiró | Botón, con motivo |

`preparado` es opcional: de `pagado` se puede ir directo a `entregado`.

Las transiciones válidas están en `src/lib/estados-pedido.ts` y **las verifica
el servidor**, no la pantalla. Los botones son una comodidad; un formulario
armado a mano no puede devolver a "pagado" un pedido ya cancelado.

---

## Decisiones que conviene conocer

### El pedido copia los datos, no los referencia

`orders` guarda el nombre, la dirección y el horario del punto, y `order_items`
guarda el nombre y el precio del producto. Si mañana sube el precio del Colonia
o se da de baja Carrasco, **el pedido de la semana pasada sigue diciendo lo que
se acordó**. Un pedido es un documento, no una vista de la configuración de hoy.

### La fecha es concreta, no un patrón

El punto define *"jueves de 17 a 19"*, pero el pedido guarda *"2026-09-17"*.
Sin fecha concreta, todos los pedidos de Carrasco caen en la misma bolsa y la
hoja de carga no sirve para nada.

### Un punto por día

Cuchilla Alta atiende sábado **y** domingo: son **dos filas**, no una. Es más
simple que un arreglo de días, permite horarios distintos por día, y la fecha
del pedido puede ser el sábado o el domingo, no "el fin de semana".

### Las horas son de Uruguay, no del servidor

En Vercel el servidor corre en UTC. Toda la aritmética de fechas usa el desfase
de Uruguay explícito (**UTC−3 todo el año**, sin horario de verano desde 2015).
Está en `src/lib/retiros.ts` y cubierto por `tests/retiros.test.ts`, incluidos
los casos donde las 22:00 de Uruguay ya son del día siguiente en UTC.

### El servidor no se cree nada de lo que manda el navegador

`crearPedidoDesdeElCheckout` vuelve a leer de la base:

- **cada precio y el total**, aunque el carrito diga otra cosa;
- que **el punto exista y esté activo**;
- que **la fecha caiga en el día del punto** y respete el corte.

Si algo cambió mientras la persona completaba sus datos, **no se guarda nada**:
se le muestra qué cambió y se le pide confirmar de nuevo. Nadie termina
comprando a un precio que no vio. El pedido, sus líneas y el cliente se crean
en **una transacción**.

Está cubierto en `tests/checkout.test.ts` contra PostgreSQL de verdad, con los
casos de precio falseado, cantidad fuera de rango, punto dado de baja y fecha
pasada el corte (incluido el minuto justo antes y el justo después).

### El teléfono es la identidad del cliente

Se guarda normalizado a solo dígitos con prefijo país, así `099 123 456`,
`+598 99 123 456` y `099123456` son la misma persona. Uruguay no usa email
para esto.

### La URL de la confirmación lleva el id, no el número de pedido

`/pedido-confirmado?id=<uuid>`. El número visible (`LC-260918-4821`) tiene
cuatro dígitos al azar y se adivina a mano; la página muestra el nombre y el
teléfono de quien compró, así que la URL tiene que ser imposible de tantear.

### Los datos bancarios están en la base y no en el código

Son la única forma de cobrar. Si cambia la cuenta y hay que esperar un deploy
para arreglarlo, el negocio no puede cobrar mientras tanto. El dueño los edita
en `/admin/configuracion` y se ven al instante.

---

## Tablas

| Tabla | Para qué |
| --- | --- |
| `pickup_points` | Los puntos de retiro. Baja lógica, nunca se borran. |
| `orders` | El pedido, con la copia del punto y la fecha concreta. |
| `order_items` | Las líneas, con la copia del producto y el precio cobrado. |
| `customers` | Clientes, únicos por teléfono normalizado. |
| `store_settings` | Una sola fila: datos bancarios y mínimo de compra. |

Los precios son **enteros en pesos**. No hay centésimos en ningún lado, y la
base lo obliga con `CHECK`.

Las bajas son lógicas y las claves foráneas de `orders` son `ON DELETE
RESTRICT`: un pedido no puede quedar apuntando a la nada. `order_items` sí es
`CASCADE`, porque una línea sin su pedido no significa nada.

---

## Poner al día una base existente

Desde **Actions → Base de datos → Run workflow**, tarea `migrar-y-sembrar`.
Funciona desde el celular y no hace falta terminal. El detalle, en
[`base-de-datos.md`](./base-de-datos.md).

Con una terminal, es lo mismo:

```bash
npm run db:estado    # qué falta, sin tocar nada
npm run db:migrate   # crea las tablas nuevas
npm run db:seed      # carga catálogo y puntos si faltan; no pisa nada
```

Después del deploy, en el panel:

1. Revisar **`/admin/puntos`** — los puntos sembrados traen dirección y
   horarios de ejemplo. **Hay que corregirlos antes de vender.**
2. Cargar **`/admin/configuracion`** con los datos bancarios reales.

---

## Qué queda afuera

Notificaciones al cliente, cuentas de cliente, stock real, facturación,
cupones, envíos a domicilio y Mercado Pago (rama aparte).
