# Operar la base de datos

Cómo se aplican migraciones y se ejecutan tareas contra Neon sin depender de
que alguien tenga una terminal a mano.

---

## El problema que resuelve

La base vive en Neon. Ni el navegador ni el asistente llegan hasta ahí. Pero
**un runner de GitHub Actions sí**, y tanto vos como el asistente pueden
dispararlo. Por eso las tareas de base viven en un workflow y no en la
computadora de nadie.

Ventaja lateral: cada corrida queda registrada, con el estado de la base antes
y después.

---

## El botón

**Actions → Base de datos → Run workflow.** Funciona desde el celular.

Tres tareas:

| Tarea | Qué hace |
| --- | --- |
| `estado` | Solo mira. Qué migraciones faltan, si la tienda puede vender, cuántos pedidos hay. **No toca nada.** |
| `migrar` | Aplica las migraciones pendientes. |
| `migrar-y-sembrar` | Además carga catálogo y puntos de retiro si faltan. |

Ante la duda, **`estado`**: no modifica nada y te dice exactamente qué pasa.

### Y solo

Cuando entra a `main` un cambio en `drizzle/**` o en `src/db/schema.ts`, el
workflow **aplica las migraciones sin que nadie se acuerde**. Es la red de
seguridad: si mergeás un PR con una migración nueva y te olvidás, se aplica igual.

Vercel despliega en paralelo, así que hay una ventana de más o menos un minuto
en que el código nuevo corre contra la base vieja. **Está comprobado que
degrada bien**: el sitio responde, el catálogo se ve, y el checkout muestra el
mensaje de WhatsApp en vez de romperse. Si querés cerrar esa ventana del todo,
corré `migrar` a mano *antes* de mergear: las migraciones son aditivas, así que
aplicarlas antes nunca molesta al código viejo.

---

## Lo único que hay que configurar (una sola vez)

**Settings → Secrets and variables → Actions → New repository secret**

- Nombre: `DATABASE_URL`
- Valor: la cadena de conexión de Neon (la *pooled*, la misma que está en Vercel)

Sin eso el workflow falla en el primer paso con un mensaje claro. El secreto
nunca se imprime en los registros.

---

## Ver el estado desde una terminal

```bash
DATABASE_URL=... npm run db:estado
```

Devuelve lo mismo que la tarea `estado` del workflow:

```
MIGRACIONES
  ✓ 0000_inicial
  ✗ 0001_pedidos-y-retiros   ← PENDIENTE

  Falta aplicar 1. Corré la tarea "migrar".
```

y, si está al día, si la tienda puede vender y cómo vienen los pedidos.

---

## Agregar una migración nueva

1. Cambiar `src/db/schema.ts`.
2. `npm run db:generate` — Drizzle escribe el `.sql` en `drizzle/`.
3. **Leer el SQL generado.** Es el momento de darse cuenta de que algo borra
   una columna.
4. `npm run db:sql` — regenera `drizzle/setup-completo.sql`, el plan B.
5. Commit y PR. Al mergear, el workflow la aplica.

### La regla que evita los problemas

**Las migraciones tienen que ser aditivas.** Agregar tablas, columnas
opcionales, índices: sí. Borrar o renombrar una columna que el código todavía
usa: no, en un solo paso.

El motivo es que durante el despliegue conviven las dos versiones del código.
Si la migración borra algo, el código viejo —que sigue sirviendo tráfico
mientras Vercel cambia— se rompe.

Para borrar de verdad, en dos entregas:

1. Dejar de usar la columna en el código. Desplegar.
2. Recién ahí, la migración que la borra.

---

## Plan B: sin GitHub Actions

Si hace falta hacerlo a mano, pegar `drizzle/setup-completo.sql` en el editor
SQL de Neon. Aplica solo lo que falte y **se puede ejecutar más de una vez sin
riesgo** — está probado corriéndolo dos veces seguidas contra PostgreSQL.

Deja registradas las migraciones con el mismo hash que usa Drizzle, así que
después un `npm run db:migrate` las reconoce como aplicadas y no intenta
repetirlas. También está probado.

---

## Si un despliegue falla y no es la base

Hay un segundo motivo posible, que no tiene nada que ver: el build de
producción **se corta a propósito** mientras queden fotos de producto
provisorias (ver `IMAGE_REPLACEMENT_TODO.md`). Se destraba reemplazando las
fotos, o con `PERMITIR_IMAGENES_PROVISORIAS=1` en las variables de entorno de
Vercel, a sabiendas.

Si el error del build menciona imágenes y no tablas, es esto.
