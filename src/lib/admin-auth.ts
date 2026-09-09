/**
 * Sesión del administrador.
 *
 * La cookie guarda un token firmado con HMAC-SHA256 usando
 * ADMIN_SESSION_SECRET: no contiene la contraseña ni ningún dato sensible,
 * solo a quién pertenece y hasta cuándo vale. Sin el secreto no se puede
 * fabricar un token válido.
 *
 * Se usa Web Crypto (no `node:crypto`) para que el mismo código sirva en el
 * middleware —que corre en el runtime Edge— y en las acciones de servidor.
 */

export const COOKIE_SESION = "lc_admin";
/** Ocho horas: una jornada de trabajo, sin dejar la sesión abierta para siempre. */
export const DURACION_SESION_SEGUNDOS = 8 * 60 * 60;

interface Payload {
  sub: string;
  iat: number;
  exp: number;
}

const codificador = new TextEncoder();

function aBase64Url(bytes: Uint8Array): string {
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeBase64Url(texto: string): Uint8Array {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binario = atob(relleno);
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

async function clave(secreto: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    codificador.encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function firmar(datos: string, secreto: string): Promise<string> {
  const firma = await crypto.subtle.sign("HMAC", await clave(secreto), codificador.encode(datos));
  return aBase64Url(new Uint8Array(firma));
}

/** Comparación en tiempo constante: no revela dónde difieren dos cadenas. */
export function igualdadConstante(a: string, b: string): boolean {
  const bytesA = codificador.encode(a);
  const bytesB = codificador.encode(b);
  // Se comparan siempre todos los bytes del mayor, para no filtrar la longitud
  // a través del tiempo de ejecución.
  const largo = Math.max(bytesA.length, bytesB.length);
  let diferencia = bytesA.length ^ bytesB.length;
  for (let i = 0; i < largo; i += 1) {
    diferencia |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diferencia === 0;
}

/** Crea un token firmado para el administrador. */
export async function crearToken(
  usuario: string,
  secreto: string,
  ahora = Date.now(),
): Promise<string> {
  const payload: Payload = {
    sub: usuario,
    iat: Math.floor(ahora / 1000),
    exp: Math.floor(ahora / 1000) + DURACION_SESION_SEGUNDOS,
  };
  const cuerpo = aBase64Url(codificador.encode(JSON.stringify(payload)));
  return `${cuerpo}.${await firmar(cuerpo, secreto)}`;
}

/**
 * Verifica un token. Devuelve el payload si la firma es válida y no venció;
 * en cualquier otro caso devuelve null, sin decir por qué.
 */
export async function verificarToken(
  token: string | undefined,
  secreto: string,
  ahora = Date.now(),
): Promise<Payload | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;

  const [cuerpo, firma] = partes;
  const esperada = await firmar(cuerpo, secreto);
  if (!igualdadConstante(firma, esperada)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(desdeBase64Url(cuerpo))) as Payload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= ahora) return null;
    if (typeof payload.sub !== "string" || payload.sub === "") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Opciones de la cookie de sesión. */
export function opcionesCookie(enProduccion: boolean) {
  return {
    httpOnly: true,
    secure: enProduccion,
    sameSite: "lax" as const,
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  };
}
