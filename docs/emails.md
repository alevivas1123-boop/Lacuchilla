# Correo al cliente

Estado: **el contenido está hecho, el envío no.** El pedido arma su email de
confirmación y llama a `enviarEmail`, pero todavía no hay proveedor conectado,
así que hoy no sale nada. Falta elegir por dónde mandarlo.

---

## Qué ya funciona

`src/lib/email/plantilla-pedido.ts` arma el mensaje de confirmación: asunto,
HTML y texto plano. Incluye el número de pedido, **los datos para transferir
con el monto**, dónde y cuándo retirar, el detalle y el comentario del cliente.

Se arma con los datos **copiados en el pedido**, no con la configuración de hoy:
si mañana cambia el horario del punto, el email que ya salió sigue diciendo lo
que se le prometió a esa persona.

Va en HTML **y** en texto plano. El texto no es un adorno: hay clientes de
correo que no muestran HTML, y un mensaje solo-HTML tiene más chance de caer en
spam.

## Qué falta

Elegir proveedor y agregar un caso en `src/lib/email/enviar.ts`. El resto del
código no se toca: arma el mensaje y llama a `enviarEmail`.

### Cómo probarlo hoy sin dar de alta nada

```bash
EMAIL_PROVEEDOR=consola npm run dev
```

Con eso el mensaje se escribe en los registros del servidor tal cual saldría.

### Opciones para cuando lo decidamos

| Proveedor | A favor | En contra |
| --- | --- | --- |
| **Resend** | Alta en minutos, SDK simple, buen plan gratis | Servicio joven |
| **Postmark** | La mejor entrega en correo transaccional | Más caro, sin plan gratis |
| **Amazon SES** | El más barato a volumen | Alta engorrosa, hay que salir del *sandbox* |
| **SMTP (Gmail)** | Ya tenemos la cuenta | Límite bajo, y Gmail no es para transaccional |

Para este volumen —unos pocos pedidos por tanda— **Resend** es el que menos
fricción tiene. Sea cual sea, hace falta:

1. Un dominio propio para el remitente. Mandar desde `@gmail.com` a través de
   un proveedor cae en spam: el SPF no valida.
2. Registros **SPF, DKIM y DMARC** en el DNS de ese dominio.

Sin dominio propio no vale la pena conectar nada, porque los correos no van a
llegar.

## Reglas que ya están puestas

**El correo nunca hace fallar un pedido.** `enviarEmail` no lanza, y el
checkout lo llama envuelto en su propio manejo de errores. Si el proveedor está
caído, el pedido igual se guarda y el cliente igual ve los datos bancarios en
pantalla. Es lo correcto: la pantalla es la vía principal, el email es la copia.

**Solo se le escribe a quien dejó su correo.** El email es opcional en el
checkout, y la mayoría compra dejando solo el teléfono.

**Nada de esto le avisa al cliente cuando el pedido cambia de estado.** Los
estados son internos, como se definió. El único correo es el de confirmación.
