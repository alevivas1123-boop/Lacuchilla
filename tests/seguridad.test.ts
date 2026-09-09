import { describe, expect, it } from "vitest";

import {
  COOKIE_SESION,
  crearToken,
  igualdadConstante,
  opcionesCookie,
  verificarToken,
} from "@/lib/admin-auth";
import { validarImagen, detectarTipoReal, rutaEnBlob } from "@/lib/imagenes";
import { limpiarIntentos, registrarFallo, reiniciarLimites, revisarIntentos } from "@/lib/rate-limit";

const SECRETO = "un-secreto-de-prueba-suficientemente-largo-0123456789";

describe("token de sesión", () => {
  it("acepta un token propio y válido", async () => {
    const token = await crearToken("admin", SECRETO);
    const payload = await verificarToken(token, SECRETO);
    expect(payload?.sub).toBe("admin");
  });

  it("rechaza un token sin firma o con firma alterada", async () => {
    const token = await crearToken("admin", SECRETO);
    const [cuerpo, firma] = token.split(".");

    expect(await verificarToken(cuerpo, SECRETO)).toBeNull();
    expect(await verificarToken(`${cuerpo}.${firma}x`, SECRETO)).toBeNull();
    expect(await verificarToken(`${cuerpo}.`, SECRETO)).toBeNull();
  });

  it("rechaza un payload manipulado aunque parezca válido", async () => {
    const token = await crearToken("admin", SECRETO);
    const firma = token.split(".")[1];
    // Alguien intenta extender su sesión reescribiendo el vencimiento.
    const falso = btoa(JSON.stringify({ sub: "admin", iat: 0, exp: 9_999_999_999 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verificarToken(`${falso}.${firma}`, SECRETO)).toBeNull();
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const token = await crearToken("admin", "otro-secreto-distinto-igual-de-largo-0123456789");
    expect(await verificarToken(token, SECRETO)).toBeNull();
  });

  it("rechaza un token vencido", async () => {
    const hace10Horas = Date.now() - 10 * 60 * 60 * 1000;
    const token = await crearToken("admin", SECRETO, hace10Horas);
    expect(await verificarToken(token, SECRETO)).toBeNull();
  });

  it("sin token no hay sesión", async () => {
    expect(await verificarToken(undefined, SECRETO)).toBeNull();
    expect(await verificarToken("", SECRETO)).toBeNull();
    expect(await verificarToken("cualquier-cosa", SECRETO)).toBeNull();
  });

  it("la cookie es httpOnly, sameSite lax y secure en producción", () => {
    expect(COOKIE_SESION).toBe("lc_admin");
    expect(opcionesCookie(true)).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax" });
    expect(opcionesCookie(false).secure).toBe(false);
  });

  it("la comparación de credenciales no se corta en el primer byte distinto", () => {
    expect(igualdadConstante("admin", "admin")).toBe(true);
    expect(igualdadConstante("admin", "admix")).toBe(false);
    expect(igualdadConstante("admin", "admin ")).toBe(false);
    expect(igualdadConstante("", "")).toBe(true);
  });
});

describe("validación de imágenes", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = new Uint8Array([
    ...[0x52, 0x49, 0x46, 0x46], ...[0, 0, 0, 0], ...[0x57, 0x45, 0x42, 0x50],
  ]);
  const svg = new Uint8Array([...'<svg xmlns="'].map((c) => c.charCodeAt(0)));

  it("reconoce los formatos permitidos por sus bytes", () => {
    expect(detectarTipoReal(jpeg)).toBe("image/jpeg");
    expect(detectarTipoReal(png)).toBe("image/png");
    expect(detectarTipoReal(webp)).toBe("image/webp");
  });

  it("rechaza SVG aunque venga con otro nombre", () => {
    expect(detectarTipoReal(svg)).toBeNull();
    const resultado = validarImagen("logo.png", svg.length, svg);
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toMatch(/no es una imagen/i);
  });

  it("rechaza un archivo cuya extensión no coincide con su contenido", () => {
    const resultado = validarImagen("foto.png", jpeg.length, jpeg);
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toMatch(/extensión/i);
  });

  it("acepta una imagen coherente", () => {
    expect(validarImagen("foto.jpg", jpeg.length, jpeg)).toMatchObject({
      ok: true,
      tipo: "image/jpeg",
      extension: "jpg",
    });
    expect(validarImagen("foto.webp", webp.length, webp).ok).toBe(true);
  });

  it("rechaza archivos vacíos o demasiado grandes", () => {
    expect(validarImagen("foto.jpg", 0, jpeg).ok).toBe(false);
    expect(validarImagen("foto.jpg", 50 * 1024 * 1024, jpeg).error).toMatch(/supera/i);
  });

  it("genera rutas impredecibles y sin colisión", () => {
    const a = rutaEnBlob("queso-colonia", "webp");
    const b = rutaEnBlob("queso-colonia", "webp");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^productos\/queso-colonia-[a-f0-9]{16}\.webp$/);
  });
});

describe("freno a los intentos de login", () => {
  it("bloquea después de varios fallos seguidos", () => {
    reiniciarLimites();
    const clave = "1.2.3.4";
    expect(revisarIntentos(clave).permitido).toBe(true);

    for (let i = 0; i < 4; i += 1) registrarFallo(clave);
    expect(revisarIntentos(clave).permitido).toBe(true);

    const quinto = registrarFallo(clave);
    expect(quinto.permitido).toBe(false);
    expect(revisarIntentos(clave).permitido).toBe(false);
    expect(revisarIntentos(clave).esperaSegundos).toBeGreaterThan(0);
  });

  it("un login exitoso limpia el contador", () => {
    reiniciarLimites();
    const clave = "5.6.7.8";
    registrarFallo(clave);
    registrarFallo(clave);
    limpiarIntentos(clave);
    for (let i = 0; i < 4; i += 1) registrarFallo(clave);
    expect(revisarIntentos(clave).permitido).toBe(true);
  });

  it("cada origen tiene su propio contador", () => {
    reiniciarLimites();
    for (let i = 0; i < 5; i += 1) registrarFallo("9.9.9.9");
    expect(revisarIntentos("9.9.9.9").permitido).toBe(false);
    expect(revisarIntentos("10.10.10.10").permitido).toBe(true);
  });
});
