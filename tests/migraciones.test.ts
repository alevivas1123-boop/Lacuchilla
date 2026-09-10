import { describe, expect, it } from "vitest";

import { contar, revisarMigraciones, type MigracionRegistrada } from "@/lib/migraciones";

/*
 * El informe de estado existe para que nadie tenga que adivinar si falta
 * migrar. Un falso "PENDIENTE" manda a alguien a arreglar algo que no está
 * roto, y un falso "al día" deja la base sin las tablas que el código espera.
 * Las dos equivocaciones son caras, así que este criterio va cubierto.
 */

const INICIAL = { tag: "0000_inicial", hash: "hash-0000", cuando: 1_000 };
const SEGUNDA = { tag: "0001_pedidos", hash: "hash-0001", cuando: 2_000 };
const TERCERA = { tag: "0002_futura", hash: "hash-0002", cuando: 3_000 };

const registrada = (hash: string, created_at: number): MigracionRegistrada => ({ hash, created_at });

describe("revisar migraciones", () => {
  it("una base sin nada tiene todo pendiente", () => {
    const revisadas = revisarMigraciones([INICIAL, SEGUNDA], []);
    expect(revisadas.map((m) => m.estado)).toEqual(["pendiente", "pendiente"]);
    expect(contar(revisadas).pendientes).toBe(2);
  });

  it("reconoce por hash lo que ya se aplicó", () => {
    const revisadas = revisarMigraciones(
      [INICIAL, SEGUNDA],
      [registrada("hash-0000", 1_000)],
    );
    expect(revisadas.map((m) => m.estado)).toEqual(["aplicada", "pendiente"]);
  });

  it("está al día cuando están todas", () => {
    const revisadas = revisarMigraciones(
      [INICIAL, SEGUNDA],
      [registrada("hash-0000", 1_000), registrada("hash-0001", 2_000)],
    );
    expect(contar(revisadas)).toEqual({ pendientes: 0, conOtroContenido: 0 });
  });

  it("no marca pendiente una migración cuyo .sql cambió después de aplicarse", () => {
    // El caso real: la migración inicial se regeneró al pasar a precios
    // enteros, así que el hash guardado en producción no coincide con el
    // archivo. Drizzle decide por fecha y la saltea; el informe tiene que
    // decir lo mismo, o manda a "arreglar" una base que está bien.
    const revisadas = revisarMigraciones(
      [INICIAL, SEGUNDA],
      [registrada("hash-de-una-version-vieja", 1_000), registrada("hash-0001", 2_000)],
    );
    expect(revisadas[0].estado).toBe("aplicada-con-otro-contenido");
    expect(contar(revisadas)).toEqual({ pendientes: 0, conOtroContenido: 1 });
  });

  it("una migración nueva sigue siendo pendiente aunque las viejas no coincidan", () => {
    const revisadas = revisarMigraciones(
      [INICIAL, SEGUNDA, TERCERA],
      [registrada("hash-de-una-version-vieja", 1_000), registrada("hash-0001", 2_000)],
    );
    expect(revisadas.map((m) => m.estado)).toEqual([
      "aplicada-con-otro-contenido",
      "aplicada",
      "pendiente",
    ]);
  });

  it("acepta la marca de tiempo como texto, que es como la devuelve la base", () => {
    // created_at es bigint: el driver lo entrega como string.
    const revisadas = revisarMigraciones([INICIAL, SEGUNDA], [
      { hash: "otro", created_at: "2000" },
    ]);
    expect(revisadas.map((m) => m.estado)).toEqual([
      "aplicada-con-otro-contenido",
      "aplicada-con-otro-contenido",
    ]);
    expect(contar(revisadas).pendientes).toBe(0);
  });

  it("no confunde el orden del diario con el de la tabla", () => {
    // Las filas pueden venir en cualquier orden: manda la marca más alta.
    const revisadas = revisarMigraciones(
      [INICIAL, SEGUNDA, TERCERA],
      [registrada("hash-0001", 2_000), registrada("hash-0000", 1_000)],
    );
    expect(revisadas[2].estado).toBe("pendiente");
  });
});
