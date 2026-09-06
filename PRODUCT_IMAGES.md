# Fotografías de productos

## Estado actual: fotos provisorias incorporadas

Los 17 productos ya tienen su fotografía en `public/products/`, en WebP.

> ⚠️ **Son imágenes provisorias para construir y demostrar el MVP.**
> Según el archivo `LEEME-FUENTES.txt` que acompañaba al material, provienen de
> **Wikimedia Commons** y *no representan necesariamente el producto real de
> La Cuchilla*. Antes de publicar la tienda definitiva hay que reemplazarlas
> por fotografías propias, o confirmar individualmente la licencia y la
> atribución de cada archivo.

Esto último no es un trámite menor: buena parte del material de Wikimedia
Commons se publica bajo licencias CC BY o CC BY-SA, que **exigen atribuir al
autor** aun en uso comercial. Una tienda que vende con esas fotos sin el
crédito correspondiente queda expuesta. Lo sano es tratarlas como andamio:
sirven para mostrar y validar la web, y salen antes de abrir al público.

### Qué revisar de cada foto antes de publicar

| Foto | Observación |
| --- | --- |
| `queso-semiduro.webp` | Se lee una **marca de terceros** en el envase. No conviene mostrarla en una tienda propia. |
| `queso-magro-con-sal.webp` y `queso-magro-sin-sal.webp` | Son **el mismo archivo** (así venía el material: una única referencia genérica para ambos) y es una foto de góndola con envases de terceros. |
| `mermelada-durazno.webp` | Hay **una persona** en el encuadre; es una escena de feria, no una foto de producto. |
| El resto | Encuadre razonable, producto centrado y reconocible. |

## Cómo reemplazar una foto

1. Preparar la foto (ver especificaciones más abajo).
2. Guardarla en `public/products/` con el nombre exacto de la tabla.
3. Volver a construir o desplegar (`npm run build`). En desarrollo
   (`npm run dev`) alcanza con recargar la página.

No hay que tocar código. Si en algún momento falta una foto, la web no se
rompe: se dibuja un placeholder de marca con el nombre del producto, sin
imágenes rotas ni errores 404, porque la existencia de cada archivo se
verifica en el servidor al construir el sitio.

## Especificaciones recomendadas

| Item | Valor |
| --- | --- |
| Formato | **WebP** (`.webp`) |
| Tamaño | lado largo de **1200 px** |
| Relación de aspecto | libre: la tarjeta recorta a **4:3** con `object-fit` |
| Calidad | 80–85 |
| Peso objetivo | menos de 150 KB por foto |
| Fondo | claro y parejo; combina con el crema `#F5EEDF` |
| Encuadre | producto centrado, con aire alrededor (el carrito recorta a cuadrado) |

Las fotos actuales tienen proporciones muy distintas entre sí (desde 1280 × 542
hasta 1280 × 1707) y aun así la grilla se ve pareja: el recuadro de la tarjeta
mantiene 4:3 y la foto se ajusta con `object-fit: cover` sobre fondo crema.
**Nunca se deforma la imagen.** Si alguna foto quedara mal recortada, se le
pone `imageFit: "contain"` en `src/data/products.ts` y se muestra entera sobre
el fondo crema, sin recortar nada.

Consejo: fotografiá todos los productos con la misma luz, el mismo fondo y la
misma distancia. La grilla se ve mucho mejor cuando las fotos son consistentes
entre sí que cuando cada una es "linda" por separado.

## Lista de archivos

| Archivo en `public/products/` | Producto | Venta |
| --- | --- | --- |
| `queso-colonia.webp` | Queso Colonia | por kilo |
| `queso-dambo.webp` | Queso Dambo | por kilo |
| `queso-magro-con-sal.webp` | Queso magro con sal | por kilo |
| `queso-magro-sin-sal.webp` | Queso magro sin sal | por kilo |
| `queso-mozzarella.webp` | Queso mozzarella | por kilo |
| `queso-semiduro.webp` | Queso semiduro | por kilo |
| `queso-parmesano.webp` | Queso parmesano | por kilo |
| `queso-provolone.webp` | Queso provolone | por kilo |
| `queso-rallado.webp` | Queso rallado | por kilo |
| `queso-untable.webp` | Queso untable (385 g) | por unidad |
| `mermelada-frutilla.webp` | Mermelada de frutilla (380 g) | por unidad |
| `mermelada-higo.webp` | Mermelada de higo (380 g) | por unidad |
| `mermelada-durazno.webp` | Mermelada de durazno (380 g) | por unidad |
| `dulce-membrillo.webp` | Dulce de membrillo (1 kg) | por unidad |
| `dulce-de-leche.webp` | Dulce de leche (1 kg) | por unidad |
| `pizza-cuatro-quesos.webp` | Pizza cuatro quesos | por unidad |
| `chorizo-chacarero.webp` | Chorizo chacarero | por kilo |

Cada producto declara su foto y su texto alternativo en
`src/data/products.ts`:

```ts
image: "/products/queso-colonia.webp",
alt: "Queso Colonia de La Cuchilla",
```

### Imagen del hero

`public/hero.webp` (1600 × 1200, 4:3) es una **composición armada con tres de
las fotos de producto** —la tabla de quesos, la mermelada de frutilla y el
queso untable— recortadas al centro sin deformar y separadas por franjas
crema. Arrastra la misma advertencia de licencia que el resto del material
provisorio.

Para reemplazarla alcanza con dejar otra foto en `public/hero.webp`. Si el
archivo no existe, la portada vuelve sola a la ilustración de marca.

## Cómo optimizar antes de subir

Las fotos actuales se convirtieron sin recortar ni deformar: se limitó el lado
largo a 1200 px conservando la proporción y se guardaron en WebP con calidad
82. El resultado bajó de 2,8 MB a 1,2 MB en total (**57 % menos**).

Con [`cwebp`](https://developers.google.com/speed/webp/download):

```bash
cwebp -q 82 -resize 1200 0 foto-original.jpg -o queso-colonia.webp
```

Con ImageMagick:

```bash
magick foto-original.jpg -resize 1200x1200 -quality 82 queso-colonia.webp
```

Con [Squoosh](https://squoosh.app) (sin instalar nada): subí la foto, elegí
WebP, calidad 82, ancho 1200 px y descargá.

Verificá el peso final:

```bash
ls -lh public/products
```

Si alguna foto pasa los 200 KB, bajá la calidad a 75 antes de subirla: en el
celular se nota más la demora que la diferencia de nitidez.

## Agregar un producto nuevo

1. Sumá el objeto en `src/data/products.ts` con un `slug` único y su `image` y
   `alt`.
2. Guardá `public/products/<slug>.webp`.
3. Listo: aparece en el catálogo y en los filtros.
