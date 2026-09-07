import "server-only";

/**
 * Variables de entorno del servidor.
 *
 * Ninguna lleva el prefijo NEXT_PUBLIC_, así que Next nunca las incluye en el
 * paquete que descarga el navegador. Se leen a través de estas funciones para
 * que el error, cuando falta una, diga exactamente qué falta y no se descubra
 * a mitad de una operación.
 */

export class ConfiguracionFaltante extends Error {
  constructor(public readonly variable: string) {
    super(
      `Falta la variable de entorno ${variable}. ` +
        `Configurala en Vercel (Settings → Environment Variables) o en .env.local. ` +
        `Ver docs/admin-productos.md.`,
    );
    this.name = "ConfiguracionFaltante";
  }
}

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === "") throw new ConfiguracionFaltante(nombre);
  return valor;
}

export const env = {
  databaseUrl: () => requerida("DATABASE_URL"),
  adminUsername: () => requerida("ADMIN_USERNAME"),
  adminPassword: () => requerida("ADMIN_PASSWORD"),
  adminSessionSecret: () => requerida("ADMIN_SESSION_SECRET"),
};

/**
 * Credenciales para escribir en Vercel Blob.
 *
 * Se aceptan las dos formas que existen hoy, en este orden:
 *
 * 1. `BLOB_READ_WRITE_TOKEN`: el token estático. Es el único que sirve para
 *    desarrollo local.
 * 2. OIDC (`VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`): lo que usan los stores
 *    creados últimamente, que ya no emiten token estático. Vercel inyecta el
 *    token OIDC en cada despliegue y lo rota solo, así que no hay ningún
 *    secreto que guardar ni que rotar a mano.
 */
export type CredencialesBlob = { token: string } | { oidcToken: string; storeId: string };

export function credencialesBlob(): CredencialesBlob {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token && token.trim() !== "") return { token };

  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;
  if (oidcToken?.trim() && storeId?.trim()) return { oidcToken, storeId };

  throw new ConfiguracionFaltante("BLOB_READ_WRITE_TOKEN");
}

export const esProduccion = process.env.NODE_ENV === "production";

/** Qué falta configurar, para poder avisarlo sin filtrar ningún valor. */
export function variablesFaltantes(): string[] {
  const necesarias = [
    "DATABASE_URL",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
  ];
  return necesarias.filter((nombre) => {
    const valor = process.env[nombre];
    return !valor || valor.trim() === "";
  });
}
