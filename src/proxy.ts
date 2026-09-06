import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESION, verificarToken } from "@/lib/admin-auth";

/**
 * Protege /admin y todo lo que cuelgue de ahí.
 *
 * En Next 16 el archivo `middleware` pasó a llamarse `proxy`; esta es la
 * convención vigente.
 *
 * Sin sesión válida se redirige a /admin/login. Si falta
 * ADMIN_SESSION_SECRET no se puede verificar nada, así que se falla cerrado:
 * nadie entra.
 *
 * Esto cubre la navegación. Las acciones de servidor verifican la sesión otra
 * vez por su cuenta, porque se las puede invocar sin pasar por acá.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const respuestaSinIndexar = (respuesta: NextResponse) => {
    respuesta.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return respuesta;
  };

  if (pathname === "/admin/login") {
    return respuestaSinIndexar(NextResponse.next());
  }

  const secreto = process.env.ADMIN_SESSION_SECRET;
  const token = request.cookies.get(COOKIE_SESION)?.value;
  const sesion = secreto ? await verificarToken(token, secreto) : null;

  if (!sesion) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/login";
    destino.search = "";
    // Adónde volver después de entrar, solo si es una ruta interna del panel.
    if (pathname.startsWith("/admin/")) destino.searchParams.set("volver", pathname);
    return respuestaSinIndexar(NextResponse.redirect(destino));
  }

  return respuestaSinIndexar(NextResponse.next());
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
