# Fotografías de productos

La web funciona sin fotos: mientras falte una imagen se dibuja un placeholder
con la paleta de La Cuchilla y el nombre del producto. **No hay imágenes
rotas ni errores 404**, porque la existencia de cada archivo se verifica en el
servidor al construir el sitio.

## Cómo reemplazar un placeholder

1. Preparar la foto (ver especificaciones más abajo).
2. Guardarla en `public/products/` con el nombre exacto de la tabla.
3. Volver a construir o desplegar (`npm run build`). En desarrollo
   (`npm run dev`) alcanza con recargar la página.

No hay que tocar código: el componente `ProductImage` detecta el archivo y
usa la foto en lugar del placeholder.

## Especificaciones recomendadas

| Item | Valor |
| --- | --- |
| Formato | **WebP** (`.webp`) |
| Tamaño | **1200 × 900 px** |
| Relación de aspecto | **4:3** (la web recorta a 4:3 y a 1:1 en el carrito) |
| Peso objetivo | menos de 150 KB por foto |
| Fondo | claro y parejo; combina con el crema `#F5EEDF` |
| Encuadre | producto centrado, con aire alrededor (el carrito recorta a cuadrado) |

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

### Imagen del hero (opcional)

Si dejás una foto en `public/hero.webp`, la portada la usa en lugar de la
ilustración de marca. Recomendado: **1600 × 1200 px**, 4:3, una tabla de
quesos y dulces bien iluminada.

## Cómo optimizar antes de subir

Con [`cwebp`](https://developers.google.com/speed/webp/download) (recomendado):

```bash
cwebp -q 80 -resize 1200 0 foto-original.jpg -o queso-colonia.webp
```

Con ImageMagick:

```bash
magick foto-original.jpg -resize 1200x900^ -gravity center -extent 1200x900 \
  -quality 80 queso-colonia.webp
```

Con [Squoosh](https://squoosh.app) (sin instalar nada): subí la foto, elegí
WebP, calidad 75–80, ancho 1200 px y descargá.

Verificá el peso final:

```bash
ls -lh public/products
```

Si alguna foto pasa los 200 KB, bajá la calidad a 70 antes de subirla: en el
celular se nota más la demora que la diferencia de nitidez.

## Agregar un producto nuevo

1. Sumá el objeto en `src/data/products.ts` con un `slug` único.
2. Guardá `public/products/<slug>.webp`.
3. Listo: aparece en el catálogo y en los filtros.
