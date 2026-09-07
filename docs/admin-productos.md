# Panel de administración de productos

Primera versión del panel para administrar el catálogo de La Cuchilla, en
`/admin`. Reemplaza la edición manual de `src/data/products.ts`: los productos
viven ahora en PostgreSQL y la tienda los lee de ahí.

> ⚠️ **Antes de abrir la web al público hay que cambiar `admin/admin`.**
> Son credenciales temporales para la demo. Ver
> [Cómo cambiar admin/admin](#cómo-cambiar-adminadmin).

---

## Arquitectura

```
Navegador
   │
   ├── /                     tienda pública  ──┐
   ├── /carrito /checkout                      │  lee productos activos
   └── /admin/*              panel  ───────────┤
                                               ▼
                              PostgreSQL (Neon en Vercel)
                                        ▲
                                        │  imágenes nuevas
                                  Vercel Blob
```

Piezas:

| Ruta / módulo | Qué hace |
| --- | --- |
| `src/proxy.ts` | Protege `/admin` y todo lo que cuelga de ahí. Sin sesión válida redirige a `/admin/login` y agrega `X-Robots-Tag: noindex`. En Next 16 este archivo se llama `proxy`, no `middleware`. |
| `src/app/admin/actions.ts` | Acciones de servidor: login, logout, alta, edición y cambio de estado. Todas verifican sesión y validan con Zod. |
| `src/db/schema.ts` | Tabla `products` con Drizzle. |
| `src/db/queries.ts` | Consultas parametrizadas. Reciben la base como argumento, para poder probarlas. |
| `src/db/seed.ts` | Siembra idempotente del catálogo inicial. |
| `src/lib/catalogo.server.ts` | Lectura cacheada del catálogo público, con etiqueta invalidable. |
| `src/lib/admin-auth.ts` | Firma y verificación del token de sesión (HMAC-SHA256, Web Crypto). |
| `src/lib/rate-limit.ts` | Freno básico a los intentos de login. |

**Por qué el catálogo no se lee de un archivo.** Vercel no permite usar el
sistema de archivos de la aplicación como almacenamiento: cada despliegue parte
de una copia nueva y de solo lectura. Un panel que escribiera
`src/data/products.ts` o dejara imágenes en `public/` perdería todo en el
siguiente deploy. Por eso los productos van a PostgreSQL y las imágenes nuevas
a Vercel Blob.

### Caché y visibilidad de los cambios

El catálogo se lee con `unstable_cache` y la etiqueta `catalogo-productos`.
Cuando el panel guarda un cambio llama a **`updateTag`** —la variante para
acciones de servidor, que expira de inmediato— más `revalidatePath("/")`. El
administrador ve su propio cambio apenas guarda, sin esperar a que venza nada.

Si la base no responde, la tienda **no** cae a un catálogo alternativo: muestra
un aviso de que el catálogo no está disponible y un botón de WhatsApp. Enseñar
precios que quizá no son los vigentes sería peor que avisar que hay un problema.

---

## Modelo de datos

Tabla `products`:

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria, `gen_random_uuid()`. |
| `slug` | `varchar(120)` | Único. Identificador del producto en la web. |
| `name` | `varchar(160)` | |
| `description` | `text` | Opcional. |
| `category` | enum | `quesos`, `dulces`, `otros`. |
| `price` | `integer` | **Precio en pesos enteros.** $390 se guarda como `390`. |
| `currency` | `varchar(3)` | Por ahora siempre `UYU`. |
| `sale_type` | enum | `weight` (por peso) o `unit` (por unidad). |
| `unit_label` | `varchar(24)` | Cómo se nombra: `kg`, `unidad`, `frasco`. |
| `min_quantity` | `integer` | |
| `max_quantity` | `integer` | |
| `quantity_step` | `integer` | Incremento del selector. |
| `presentation` | `varchar(120)` | `Venta por kilo`, `Frasco de 380 g`. |
| `image_url` | `text` | Ruta en `/public` (seed) o URL de Vercel Blob. |
| `image_blob_path` | `text` | Ruta dentro de Blob, para poder administrarla. |
| `image_alt` | `varchar(200)` | Texto alternativo. |
| `active` | `boolean` | Baja lógica: `false` lo saca de la tienda. |
| `sort_order` | `integer` | Orden en el catálogo. Menor primero. |
| `created_at` / `updated_at` | `timestamptz` | |

**El dinero nunca es coma flotante.** El negocio maneja precios en pesos
enteros, así que se guardan como `integer` y los totales del carrito son
multiplicaciones y sumas de enteros. No hay centésimos en ningún punto.

El formulario acepta `390` y `1.170` —con el punto como separador de miles— y
**rechaza cualquier decimal**. En particular rechaza `390.5`: si se borrara el
punto sin mirar quedaría `3905`, un precio diez veces mayor cargado sin que
nadie lo note. El punto solo vale si separa grupos de exactamente tres dígitos.
Ver `src/lib/money.ts`.

Restricciones en la base, además de la validación de Zod:

```sql
CHECK (price > 0)
CHECK (min_quantity > 0)
CHECK (quantity_step > 0)
CHECK (max_quantity >= min_quantity)
UNIQUE (slug)
```

Si algún dato entra por fuera de la aplicación, la base lo rechaza igual.

### Cantidades por producto, sin tope global

Antes había una constante `MAX_QUANTITY = 20` para todo el catálogo. Ya no
existe: cada producto define su rango y su incremento, y el selector de la
tienda se arma con eso. Los quesos por peso quedaron en 1 a 5 kg; los productos
por unidad, de 1 a 20. Cambiarlo es editar el producto en el panel.

---

## Migraciones y seed

```bash
npm run db:generate   # genera SQL a partir de src/db/schema.ts
npm run db:migrate    # aplica las migraciones pendientes a DATABASE_URL
npm run db:seed       # siembra el catálogo inicial (idempotente)
```

El seed copia los 17 productos de `src/data/seed-products.ts` conservando
nombre, slug, categoría, precio, modalidad de venta, cantidades, presentación,
imagen y orden. Usa `ON CONFLICT (slug) DO NOTHING`:

- correrlo dos veces no duplica nada;
- **no pisa cambios hechos desde el panel**. Si cambiaste un precio en `/admin`
  y volvés a correr el seed, tu precio queda.

`src/data/seed-products.ts` dejó de ser la fuente de verdad. Editarlo no cambia
la tienda; sirve solo para sembrar una base vacía.

### Sin terminal a mano

`drizzle/setup-completo.sql` tiene todo en un solo archivo: la estructura, los
17 productos y el registro que Drizzle usa para saber que la migración ya se
aplicó. Se pega entero en el **editor SQL de Neon** y se ejecuta una vez.

Sirve cuando no hay una terminal disponible —por ejemplo, desde el celular— y
es equivalente a correr `db:migrate` + `db:seed`. Se puede ejecutar más de una
vez sin duplicar nada, y después `npm run db:migrate` reconoce la migración
como aplicada en lugar de intentar crear la tabla de nuevo.

Se regenera con `npm run db:sql` cada vez que cambie el esquema o el catálogo
inicial.

### Base local para desarrollo

Sin cuenta de Neon, en dos terminales:

```bash
npm run db:local      # PostgreSQL local (PGlite) en 127.0.0.1:5433
```

```bash
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres
npm run db:migrate && npm run db:seed && npm run dev
```

Atiende una conexión por vez: cerrá la app antes de usar `psql`.

---

## Autenticación

- Usuario y contraseña se comparan contra `ADMIN_USERNAME` y `ADMIN_PASSWORD`,
  en tiempo constante, y el mensaje de error es **el mismo** falle el usuario o
  la contraseña: no se revela cuál de los dos existe.
- La sesión es un token firmado con **HMAC-SHA256** usando
  `ADMIN_SESSION_SECRET`. Contiene a quién pertenece y hasta cuándo vale; **no
  contiene la contraseña**. Sin el secreto no se puede fabricar uno válido.
- Vive en una cookie `lc_admin` **httpOnly**, `sameSite=lax`, `secure` en
  producción, con vencimiento a las **8 horas**.
- Nada se guarda en `localStorage` ni en `sessionStorage`.
- El proxy protege la navegación; **cada acción de servidor vuelve a verificar
  la sesión** por su cuenta, porque se la puede invocar sin pasar por el proxy.
- Cinco intentos fallidos desde un mismo origen bloquean el login 15 minutos.

**Limitación conocida:** el contador de intentos es en memoria del proceso. En
Vercel cada instancia tiene el suyo, así que frena a alguien probando
contraseñas a mano, no un ataque distribuido. Cuando haya usuarios de verdad
conviene moverlo a la base o a un almacén compartido.

**CSRF:** las mutaciones son Server Actions, que en Next 16 verifican el
`Origin` de la petición, y la cookie es `sameSite=lax`. No hay endpoints de
mutación abiertos por fuera de eso.

### Cómo cambiar admin/admin

1. Entrá al proyecto en Vercel → **Settings → Environment Variables**.
2. Cambiá `ADMIN_USERNAME` y `ADMIN_PASSWORD` por los definitivos.
3. Volvé a desplegar (**Deployments → ⋯ → Redeploy**).

Las sesiones abiertas siguen valiendo hasta que venzan. Para cortarlas todas al
instante, cambiá también `ADMIN_SESSION_SECRET`: invalida cualquier token
firmado con el anterior.

Esta versión tiene **un solo usuario administrador**. Varios usuarios, con
contraseñas guardadas con hash en la base, quedan para una etapa siguiente.

---

## Variables de entorno

Ninguna lleva el prefijo `NEXT_PUBLIC_`, así que Next no las expone al
navegador. `.env.example` tiene la lista con valores ficticios.

| Variable | Para qué | Secreta |
| --- | --- | --- |
| `DATABASE_URL` | Conexión a PostgreSQL (Neon). Usá la cadena *pooled*. | Sí |
| `ADMIN_USERNAME` | Usuario del panel. | No, pero no la publiques |
| `ADMIN_PASSWORD` | Contraseña del panel. | **Sí** |
| `ADMIN_SESSION_SECRET` | Firma la cookie de sesión. Generala con `openssl rand -base64 48`. | **Sí** |
| `BLOB_READ_WRITE_TOKEN` | Escritura en Vercel Blob. Solo hace falta en desarrollo local: en Vercel se usa OIDC. | **Sí** |

Si falta alguna, el panel **no** entra en un modo permisivo: la pantalla de
login avisa cuáles faltan (sin mostrar ningún valor) y no deja pasar a nadie.

### Configurar Neon

1. En el proyecto de Vercel: **Storage → Create Database → Neon**.
2. Vercel crea `DATABASE_URL` en el proyecto automáticamente.
3. Con esa URL, desde tu máquina:
   ```bash
   export DATABASE_URL="...la cadena pooled de Neon..."
   npm run db:migrate
   npm run db:seed
   ```
4. Volvé a desplegar para que la aplicación tome la variable.

### Configurar Vercel Blob

1. **Storage → Create → Blob**, conectado al mismo proyecto.
2. Vercel inyecta `BLOB_STORE_ID` y, en cada despliegue, `VERCEL_OIDC_TOKEN`.

La subida acepta dos formas de autenticación y elige la primera disponible:

| Forma | Variables | Dónde sirve |
| --- | --- | --- |
| Token estático | `BLOB_READ_WRITE_TOKEN` | Desarrollo local. |
| OIDC | `VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID` | Despliegues en Vercel. |

Los stores de Blob creados últimamente **ya no emiten un token estático**: usan
OIDC, que Vercel inyecta y rota solo. No hay secreto que guardar ni rotar. El
token estático sigue soportado y tiene prioridad si está definido, porque OIDC
no está habilitado para el entorno `development` y es la única manera de probar
la subida desde la máquina de uno.

Sin ninguna de las dos el panel funciona igual, pero **subir imágenes falla**
con un mensaje claro. Las fotos del seed, que están en `/public`, se siguen
viendo.

---

## Usar el panel

### Entrar

`https://lacuchilla.vercel.app/admin` → redirige a `/admin/login`.

### Listado

Buscador por nombre, filtro por categoría y por estado (activos, inactivos,
todos). En computadora es una tabla; en celular, tarjetas. Los filtros quedan
en la URL, así que un listado filtrado se puede compartir o marcar.

### Crear un producto

**Nuevo producto**. El slug se propone a partir del nombre y se puede editar; la
etiqueta de unidad se propone según el tipo de venta. Validaciones:

- nombre obligatorio;
- slug único, en minúsculas, números y guiones;
- precio entero mayor que cero, sin centésimos;
- cantidad mínima mayor que cero;
- máximo mayor o igual que el mínimo;
- incremento mayor que cero;
- imagen JPG, PNG o WebP de hasta 4 MB.

Si algo no valida, **se conservan los valores que habías escrito**: React 18+
vacía el formulario al terminar una acción, y sin esto un error en un campo te
haría recargar los otros trece.

### Editar

Todos los campos son editables. Al guardar, el cambio se ve en la tienda
enseguida.

Los carritos ya armados se **revalidan contra la base antes de confirmar el
pedido**: si cambió el precio, si el rango se achicó o si el producto se dio de
baja, se avisa y se pide confirmar de nuevo. Nunca se confía en el precio
guardado en el navegador.

### Dar de baja y reactivar

“Dar de baja” pide confirmación, pone `active = false` y saca el producto de la
tienda. **La fila no se borra**: queda disponible para los pedidos que puedan
referenciarla más adelante. Se reactiva desde el filtro “Inactivos”.

No hay borrado físico en esta versión, a propósito.

### Imágenes

- Se aceptan **JPG, PNG y WebP**, hasta 4 MB.
- **No se acepta SVG**: puede llevar scripts adentro.
- Se valida el **tipo real por los bytes del archivo**, no por la extensión ni
  por lo que declare el navegador, y se exige que extensión y contenido
  coincidan.
- El nombre en Blob lleva un sufijo aleatorio: sin colisiones y sin URLs
  adivinables.
- Vista previa antes de guardar.
- La imagen anterior **se conserva** hasta que la nueva se sube bien. Si la
  subida falla, no se toca el producto.
- No se borra automáticamente ninguna imagen anterior: podría estar en uso.
  La limpieza de blobs huérfanos queda pendiente y debe ser explícita.
- Si una imagen no carga, se dibuja un placeholder de marca.

Las fotos actuales en `public/products` siguen funcionando como URLs iniciales
del seed. Las nuevas y los reemplazos van a Blob.

> Estas fotos son **provisorias** y hay que reemplazarlas antes de publicar.
> Ver [`IMAGE_REPLACEMENT_TODO.md`](../IMAGE_REPLACEMENT_TODO.md).

---

## Limitaciones de esta versión

- **Un solo usuario administrador**, con la contraseña en una variable de
  entorno. No hay tabla de usuarios, ni roles, ni recuperación de contraseña.
- **El freno a los intentos de login es por instancia**, no compartido.
- **No hay historial de cambios**: no queda registro de quién modificó qué.
- **No hay borrado físico** de productos ni limpieza automática de imágenes
  huérfanas en Blob.
- **No se optimiza la imagen al subirla**: se guarda tal cual, validada y con
  tope de tamaño. La conversión a WebP en el servidor queda pendiente.
- **No hay stock**: el panel administra el catálogo, no existencias.
- El catálogo se renderiza por petición (`force-dynamic`) con la consulta
  cacheada. Si el tráfico crece, conviene revisar esta estrategia.

---

## Despliegue y vuelta atrás

### Primera puesta en marcha

1. Conectar **Neon** y **Blob** al proyecto (arriba).
2. Cargar `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`.
3. Correr `npm run db:migrate` y `npm run db:seed` apuntando a `DATABASE_URL`.
4. Desplegar y verificar `/admin`.

### Vuelta atrás

- **De la aplicación:** en Vercel, **Deployments → despliegue anterior →
  Promote to Production**. La migración de esta versión solo *agrega* la tabla
  `products`; una versión anterior no la usa y no se rompe.
- **De la base:** las migraciones de Drizzle no traen `down`. Para deshacer:
  ```sql
  DROP TABLE IF EXISTS products;
  DROP TYPE IF EXISTS product_category;
  DROP TYPE IF EXISTS sale_type;
  DROP TABLE IF EXISTS "drizzle"."__drizzle_migrations";
  ```
  **Esto borra los productos y los cambios hechos desde el panel.** Sacá un
  respaldo antes: Neon tiene *branching* y *point-in-time restore*.
- **Solo cortar el acceso al panel:** borrá `ADMIN_SESSION_SECRET` y volvé a
  desplegar. Nadie entra y la tienda sigue funcionando.
