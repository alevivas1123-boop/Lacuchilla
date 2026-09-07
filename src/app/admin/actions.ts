"use server";

import { put } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  actualizarProducto,
  cambiarEstado,
  crearProducto,
  obtenerProductoPorId,
  slugDisponible,
} from "@/db/queries";
import { cerrarSesion, credencialesValidas, iniciarSesion, requerirSesion } from "@/lib/admin-session";
import { TAG_CATALOGO } from "@/lib/catalogo.server";
import { credencialesBlob, type CredencialesBlob } from "@/lib/env";
import { rutaEnBlob, validarImagen } from "@/lib/imagenes";
import { productoSchema } from "@/lib/product-schema";
import type { EstadoFormulario } from "@/lib/admin-form-state";
import { limpiarIntentos, registrarFallo, revisarIntentos } from "@/lib/rate-limit";

/** Identifica al cliente para el freno de intentos, sin guardar nada de él. */
async function claveDelCliente(): Promise<string> {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for");
  return reenviada?.split(",")[0]?.trim() || cabeceras.get("x-real-ip") || "desconocido";
}

/**
 * Invalida el catálogo público después de un cambio.
 *
 * `updateTag` es la variante para acciones de servidor: expira la etiqueta de
 * inmediato, así el administrador ve su propio cambio reflejado apenas guarda
 * y no queda esperando a que venza la caché.
 */
function invalidarCatalogo() {
  updateTag(TAG_CATALOGO);
  revalidatePath("/");
  revalidatePath("/admin");
}

/* ── Sesión ──────────────────────────────────────────────────────────────── */

export async function accionIniciarSesion(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const clave = await claveDelCliente();
  const limite = revisarIntentos(clave);
  if (!limite.permitido) {
    return {
      ok: false,
      mensaje: `Demasiados intentos. Probá de nuevo en ${Math.ceil(limite.esperaSegundos / 60)} minutos.`,
    };
  }

  const usuario = String(formData.get("usuario") ?? "");
  const contrasena = String(formData.get("contrasena") ?? "");
  const volver = String(formData.get("volver") ?? "");

  try {
    if (!credencialesValidas(usuario, contrasena)) {
      const tras = registrarFallo(clave);
      // Un único mensaje para los dos casos: no se revela si falló el usuario
      // o la contraseña.
      return {
        ok: false,
        mensaje: tras.permitido
          ? "Usuario o contraseña incorrectos."
          : `Demasiados intentos. Probá de nuevo en ${Math.ceil(tras.esperaSegundos / 60)} minutos.`,
      };
    }
  } catch {
    // Falta alguna variable de entorno: no se puede autenticar a nadie.
    return {
      ok: false,
      mensaje:
        "El panel no está configurado en este entorno. Revisá las variables de administración.",
    };
  }

  limpiarIntentos(clave);
  await iniciarSesion(usuario);

  // Solo se acepta volver a rutas internas del panel.
  const destino = volver.startsWith("/admin/") && !volver.startsWith("/admin//") ? volver : "/admin";
  redirect(destino);
}

export async function accionCerrarSesion(): Promise<void> {
  await cerrarSesion();
  redirect("/admin/login");
}

/* ── Productos ───────────────────────────────────────────────────────────── */

/** Sube la imagen a Vercel Blob y devuelve su URL y su ruta. */
async function subirImagen(
  archivo: File,
  slug: string,
): Promise<{ url: string; path: string } | { error: string }> {
  const bytes = new Uint8Array(await archivo.slice(0, 32).arrayBuffer());
  const revision = validarImagen(archivo.name, archivo.size, bytes);
  if (!revision.ok) return { error: revision.error! };

  let credenciales: CredencialesBlob;
  try {
    credenciales = credencialesBlob();
  } catch {
    return { error: "El almacenamiento de imágenes no está configurado en este entorno." };
  }

  try {
    const ruta = rutaEnBlob(slug, revision.extension!);
    const subida = await put(ruta, archivo, {
      access: "public",
      ...credenciales,
      contentType: revision.tipo,
      // El nombre ya lleva azar propio; no hace falta que Blob agregue más.
      addRandomSuffix: false,
    });
    return { url: subida.url, path: subida.pathname };
  } catch {
    return { error: "No se pudo subir la imagen. Probá de nuevo." };
  }
}

export async function accionGuardarProducto(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await requerirSesion();
  } catch {
    return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };
  }

  const id = String(formData.get("id") ?? "").trim() || undefined;

  // Se conserva lo escrito para poder devolverlo si algo no valida: React
  // vacía el formulario al terminar la acción.
  const valores: Record<string, string> = {};
  for (const campo of [
    "name", "slug", "description", "category", "price", "saleType", "unitLabel",
    "minQuantity", "maxQuantity", "quantityStep", "presentation", "sortOrder", "imageAlt",
  ]) {
    valores[campo] = String(formData.get(campo) ?? "");
  }
  valores.active = formData.get("active") ? "true" : "";

  const analisis = productoSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    price: formData.get("price"),
    saleType: formData.get("saleType"),
    unitLabel: formData.get("unitLabel"),
    minQuantity: formData.get("minQuantity"),
    maxQuantity: formData.get("maxQuantity"),
    quantityStep: formData.get("quantityStep"),
    presentation: formData.get("presentation"),
    sortOrder: formData.get("sortOrder"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
    imageAlt: formData.get("imageAlt") || undefined,
  });

  if (!analisis.success) {
    const errores: Record<string, string> = {};
    for (const problema of analisis.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !errores[campo]) errores[campo] = problema.message;
    }
    return { ok: false, mensaje: "Revisá los campos marcados.", errores, valores };
  }

  const datos = analisis.data;

  if (!(await slugDisponible(datos.slug, id))) {
    return {
      ok: false,
      mensaje: "Revisá los campos marcados.",
      errores: { slug: "Ya hay otro producto con ese slug." },
      valores,
    };
  }

  // La imagen se sube antes de tocar la fila. Si falla, no se guarda nada y el
  // producto conserva la foto que ya tenía.
  let imagen: { url: string; path: string } | undefined;
  const archivo = formData.get("imagen");
  if (archivo instanceof File && archivo.size > 0) {
    const resultado = await subirImagen(archivo, datos.slug);
    if ("error" in resultado) {
      return { ok: false, mensaje: resultado.error, errores: { imagen: resultado.error }, valores };
    }
    imagen = resultado;
  }

  const fila = {
    slug: datos.slug,
    name: datos.name,
    description: datos.description ?? null,
    category: datos.category,
    price: datos.price,
    currency: "UYU",
    saleType: datos.saleType,
    unitLabel: datos.unitLabel,
    minQuantity: datos.minQuantity,
    maxQuantity: datos.maxQuantity,
    quantityStep: datos.quantityStep,
    presentation: datos.presentation,
    sortOrder: datos.sortOrder,
    active: datos.active,
    imageAlt: datos.imageAlt ?? datos.name,
    ...(imagen ? { imageUrl: imagen.url, imageBlobPath: imagen.path } : {}),
  };

  try {
    if (id) {
      const existente = await obtenerProductoPorId(id);
      if (!existente) return { ok: false, mensaje: "Ese producto ya no existe.", valores };
      await actualizarProducto(id, fila);
    } else {
      await crearProducto(fila);
    }
  } catch {
    // Nunca se devuelve el error de la base tal cual: puede contener detalles
    // internos o parte de la cadena de conexión.
    return { ok: false, mensaje: "No se pudo guardar el producto. Probá de nuevo.", valores };
  }

  invalidarCatalogo();
  redirect("/admin?guardado=1");
}

export async function accionCambiarEstado(formData: FormData): Promise<void> {
  await requerirSesion();

  const id = String(formData.get("id") ?? "");
  const activar = String(formData.get("activar") ?? "") === "true";
  if (!id) return;

  await cambiarEstado(id, activar);
  invalidarCatalogo();
}
