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
  /** Lo inyecta Vercel Blob automáticamente al conectar el almacenamiento. */
  blobToken: () => requerida("BLOB_READ_WRITE_TOKEN"),
};

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
