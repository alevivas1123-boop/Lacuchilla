import "server-only";
import { cookies } from "next/headers";

import {
  COOKIE_SESION,
  crearToken,
  igualdadConstante,
  opcionesCookie,
  verificarToken,
} from "@/lib/admin-auth";
import { env, esProduccion } from "@/lib/env";

/** ¿Hay una sesión de administrador válida en esta petición? */
export async function haySesion(): Promise<boolean> {
  try {
    const token = (await cookies()).get(COOKIE_SESION)?.value;
    return (await verificarToken(token, env.adminSessionSecret())) !== null;
  } catch {
    // Falta el secreto: se falla cerrado, nunca abierto.
    return false;
  }
}

/**
 * Verifica usuario y contraseña contra las variables de entorno.
 * La comparación es en tiempo constante y no distingue cuál de los dos falló.
 */
export function credencialesValidas(usuario: string, contrasena: string): boolean {
  const usuarioOk = igualdadConstante(usuario, env.adminUsername());
  const contrasenaOk = igualdadConstante(contrasena, env.adminPassword());
  // Se evalúan las dos siempre, para no filtrar por tiempo cuál falló.
  return usuarioOk && contrasenaOk;
}

export async function iniciarSesion(usuario: string): Promise<void> {
  const token = await crearToken(usuario, env.adminSessionSecret());
  (await cookies()).set(COOKIE_SESION, token, opcionesCookie(esProduccion));
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).set(COOKIE_SESION, "", { ...opcionesCookie(esProduccion), maxAge: 0 });
}

/**
 * Corta la ejecución si no hay sesión. Se llama al principio de TODA acción
 * administrativa: el middleware protege la navegación, pero una acción de
 * servidor puede invocarse directamente y no puede confiar en eso.
 */
export class SinAutorizacion extends Error {
  constructor() {
    super("Se requiere iniciar sesión.");
    this.name = "SinAutorizacion";
  }
}

export async function requerirSesion(): Promise<void> {
  if (!(await haySesion())) throw new SinAutorizacion();
}
