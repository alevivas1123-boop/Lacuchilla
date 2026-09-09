# ⚠️ IMÁGENES A REEMPLAZAR ANTES DE PRODUCCIÓN

> **REQUISITO OBLIGATORIO. NO PUBLICAR LA TIENDA CON ESTAS IMÁGENES.**
>
> Las **18 imágenes** listadas acá son material provisorio, cargado para poder
> construir y validar el MVP: sirven para revisar el catálogo, el carrito y el
> checkout, y para mostrarle la tienda al negocio. **Ninguna puede quedar
> publicada como definitiva.**

Todas provienen de **Wikimedia Commons**. Buena parte de ese material se publica
bajo licencias CC BY o CC BY-SA, que **exigen atribuir al autor incluso en uso
comercial**. Una tienda que vende con esas fotos sin el crédito correspondiente
queda expuesta. Además, cuatro de ellas tienen un problema de contenido que las
hace inutilizables aun con la licencia resuelta.

---

## Qué hay que hacer, sí o sí, antes de publicar

1. **Reemplazar las 18 imágenes de Wikimedia Commons** por fotografías propias de
   La Cuchilla o por imágenes con **licencia comercial verificada** (con el
   comprobante guardado).
2. **Reemplazar `queso-semiduro`**: se lee una marca comercial ajena en el envase.
3. **Reemplazar las dos fotos de queso magro** (`queso-magro-con-sal` y
   `queso-magro-sin-sal`): hoy son **el mismo archivo**, idéntico byte a byte.
   Cada variante necesita su propia foto.
4. **Reemplazar `mermelada-durazno`**: aparece una persona identificable en el
   encuadre.
5. **Impedir que cualquiera de estas imágenes quede publicada por accidente.**
   Esto ya está implementado; ver "Cómo está protegido" más abajo.

---

## Las 4 bloqueantes

No alcanza con resolver la licencia: estas cuatro tienen un problema de
contenido y **no deberían mostrarse ni en una demo pública**.

### 🔴 `queso-semiduro`

- **Archivo:** `public/products/queso-semiduro.webp` (684 × 800, 27 KB)
- **Problema:** Se lee una marca comercial ajena en el envase. No puede aparecer en la tienda de La Cuchilla.

### 🔴 `queso-magro-con-sal`

- **Archivo:** `public/products/queso-magro-con-sal.webp` (1200 × 799, 85 KB)
- **Problema:** Es el mismo archivo que queso-magro-sin-sal (idéntico byte a byte) y además es una foto de góndola con envases de terceros. Cada variante necesita su propia foto.

### 🔴 `queso-magro-sin-sal`

- **Archivo:** `public/products/queso-magro-sin-sal.webp` (1200 × 799, 85 KB)
- **Problema:** Es el mismo archivo que queso-magro-con-sal (idéntico byte a byte) y además es una foto de góndola con envases de terceros. Cada variante necesita su propia foto.

### 🔴 `mermelada-durazno`

- **Archivo:** `public/products/mermelada-durazno.webp` (1200 × 675, 57 KB)
- **Problema:** Aparece una persona identificable en el encuadre. Publicar su imagen requiere su consentimiento, y además es una escena de feria, no una foto de producto.

---

## Inventario completo

| Archivo | Producto | Dimensiones | Peso | md5 | Estado |
| --- | --- | --- | --- | --- | --- |
| `/products/queso-semiduro.webp` | Queso semiduro | 684 × 800 | 20 KB | `c3fba89d` | 🔴 Bloqueante |
| `/products/queso-magro-con-sal.webp` | Queso magro con sal | 1280 × 852 | 74 KB | `e131eb6b` | 🔴 Bloqueante |
| `/products/queso-magro-sin-sal.webp` | Queso magro sin sal | 1280 × 852 | 74 KB | `e131eb6b` | 🔴 Bloqueante |
| `/products/mermelada-durazno.webp` | Mermelada de durazno | 1280 × 720 | 49 KB | `a4bbb225` | 🔴 Bloqueante |
| `/products/queso-colonia.webp` | Queso Colonia | 1050 × 1400 | 23 KB | `5bc47dd2` | 🟡 Licencia |
| `/products/queso-dambo.webp` | Queso Dambo | 1024 × 768 | 31 KB | `7262448a` | 🟡 Licencia |
| `/products/queso-mozzarella.webp` | Queso mozzarella | 1024 × 768 | 22 KB | `2630d58b` | 🟡 Licencia |
| `/products/queso-parmesano.webp` | Queso parmesano | 1280 × 1006 | 97 KB | `a94718e0` | 🟡 Licencia |
| `/products/queso-provolone.webp` | Queso provolone | 800 × 600 | 19 KB | `b3c0bc8f` | 🟡 Licencia |
| `/products/queso-rallado.webp` | Queso rallado | 1280 × 853 | 150 KB | `0a23ba09` | 🟡 Licencia |
| `/products/queso-untable.webp` | Queso untable | 1280 × 960 | 68 KB | `ab22c812` | 🟡 Licencia |
| `/products/mermelada-frutilla.webp` | Mermelada de frutilla | 1280 × 542 | 57 KB | `05392cd3` | 🟡 Licencia |
| `/products/mermelada-higo.webp` | Mermelada de higo | 684 × 1066 | 47 KB | `5d1ec649` | 🟡 Licencia |
| `/products/dulce-membrillo.webp` | Dulce de membrillo | 1280 × 790 | 56 KB | `7b607812` | 🟡 Licencia |
| `/products/dulce-de-leche.webp` | Dulce de leche | 940 × 609 | 20 KB | `f0ed3cab` | 🟡 Licencia |
| `/products/pizza-cuatro-quesos.webp` | Pizza cuatro quesos | 1280 × 720 | 97 KB | `d3a1c6e1` | 🟡 Licencia |
| `/products/chorizo-chacarero.webp` | Chorizo chacarero | 1280 × 960 | 85 KB | `8615653c` | 🟡 Licencia |
| `/hero.webp` | Portada (hero) | 1600 × 1200 | 131 KB | `ddea56b0` | 🟡 Licencia |

**Total: 18 imágenes** — 4 bloqueantes, 14 con la licencia sin verificar.

Notá que `queso-magro-con-sal` y `queso-magro-sin-sal` comparten el mismo md5:
es literalmente el mismo archivo duplicado.

La portada (`/hero.webp`) es una composición armada con `queso-colonia`,
`mermelada-frutilla` y `queso-untable`, así que **arrastra la licencia de las
tres**: se reemplaza cuando se reemplacen esas, o antes.

---

## Cómo reemplazar una imagen

1. Preparar la foto: **WebP**, lado largo **1200 px**, calidad 80–85, menos de
   150 KB. No hace falta que sea 4:3 — la tarjeta encuadra con `object-fit`.
   Especificaciones completas en [`PRODUCT_IMAGES.md`](./PRODUCT_IMAGES.md).
2. Guardarla en `public/products/<slug>.webp`, con el **mismo nombre** que tenía.
3. **Borrar su entrada de `src/data/provisional-images.json`.** Este paso es el
   que importa: mientras la entrada siga ahí, el sistema la sigue considerando
   provisoria y el build de producción se sigue cortando.
4. Correr `npm run verificar:imagenes` para confirmar que quedó fuera del
   inventario.

Cuando el inventario quede vacío, el aviso de desarrollo desaparece solo y el
build de producción deja de bloquearse. No hay que tocar nada más.

---

## Cómo está protegido

Que esto no se publique por descuido no depende de que alguien se acuerde de
leer este archivo. Hay tres barreras, todas alimentadas por el mismo
inventario (`src/data/provisional-images.json`):

| Dónde | Qué hace |
| --- | --- |
| **Build de producción** | `scripts/verificar-imagenes.mjs` corre antes de `next build` (script `prebuild`). Si detecta producción (`VERCEL_ENV=production` o `ENTORNO=produccion`) y todavía hay material provisorio, **corta el build con código de salida 1**. |
| **Desarrollo** | Un aviso fijo abajo a la izquierda, con la cuenta y el detalle de las bloqueantes. Se puede plegar, no se puede descartar. No se renderiza en producción. |
| **Cada tarjeta** | Un distintivo "PROVISORIA" sobre la foto de cada producto afectado, solo en desarrollo. |

En builds de desarrollo o de vista previa el script **avisa pero no corta**, así
se puede seguir trabajando y desplegando previews.

### Si necesitás publicar igual, a sabiendas

Para una demo pública con estas fotos, definí la variable de entorno:

```
PERMITIR_IMAGENES_PROVISORIAS=1
```

En Vercel: **Settings → Environment Variables**. Es deliberadamente incómodo:
la idea es que publicar con este material sea una decisión tomada y
registrada, nunca un descuido. **Sacá esa variable en cuanto reemplaces las
fotos.**

---

## Lista de control antes de publicar

- [ ] Las 4 bloqueantes reemplazadas por fotos propias.
- [ ] Las 14 restantes reemplazadas, o su licencia comercial verificada y el
      comprobante guardado.
- [ ] `queso-magro-con-sal` y `queso-magro-sin-sal` con fotos **distintas** entre sí.
- [ ] Portada (`hero.webp`) rehecha con material propio.
- [ ] `src/data/provisional-images.json` vacío (`[]`).
- [ ] `npm run verificar:imagenes` da luz verde.
- [ ] La variable `PERMITIR_IMAGENES_PROVISORIAS` **eliminada** de Vercel.
- [ ] Este archivo eliminado del repositorio.
