import { describe, expect, it } from "vitest";

import { centesimosAPesos, formatearPesos, pesosACentesimos } from "@/lib/money";
import { generarSlug, productoSchema } from "@/lib/product-schema";
import { ajustarCantidad, opcionesDeCantidad } from "@/lib/types";

describe("dinero", () => {
  it("formatea pesos uruguayos sin decimales y con punto de miles", () => {
    expect(formatearPesos(39000)).toBe("$390");
    expect(formatearPesos(117000)).toBe("$1.170");
    expect(formatearPesos(245000)).toBe("$2.450");
    expect(formatearPesos(100000000)).toBe("$1.000.000");
  });

  it("muestra los centésimos solo cuando existen", () => {
    expect(formatearPesos(39050)).toBe("$390,50");
    expect(formatearPesos(39005)).toBe("$390,05");
  });

  it("convierte a centésimos sin errores de coma flotante", () => {
    expect(pesosACentesimos("390")).toBe(39000);
    expect(pesosACentesimos("390,50")).toBe(39050);
    expect(pesosACentesimos("390.5")).toBe(39050);
    expect(pesosACentesimos("0.07")).toBe(7);
    // El caso clásico: 0.1 + 0.2 en binario no da 0.3.
    expect(pesosACentesimos("1.10")! + pesosACentesimos("2.20")!).toBe(330);
  });

  it("rechaza entradas que no son importes", () => {
    expect(pesosACentesimos("")).toBeNull();
    expect(pesosACentesimos("abc")).toBeNull();
    expect(pesosACentesimos("-5")).toBeNull();
    expect(pesosACentesimos("1.234")).toBeNull();
  });

  it("va y vuelve sin perder valor", () => {
    for (const centesimos of [1, 7, 100, 39000, 117000, 69000]) {
      expect(pesosACentesimos(centesimosAPesos(centesimos))).toBe(centesimos);
    }
  });
});

describe("cantidades por producto", () => {
  const queso = { minQuantity: 1, maxQuantity: 5, quantityStep: 1 };
  const cajon = { minQuantity: 2, maxQuantity: 12, quantityStep: 2 };

  it("un queso por peso ofrece de 1 a 5 kg", () => {
    expect(opcionesDeCantidad(queso)).toEqual([1, 2, 3, 4, 5]);
  });

  it("respeta el incremento configurado", () => {
    expect(opcionesDeCantidad(cajon)).toEqual([2, 4, 6, 8, 10, 12]);
  });

  it("ajusta al rango, sin tope global", () => {
    expect(ajustarCantidad(0, queso)).toBe(1);
    expect(ajustarCantidad(99, queso)).toBe(5);
    // Un producto puede pasar de 20 si así está configurado.
    expect(ajustarCantidad(50, { minQuantity: 1, maxQuantity: 40, quantityStep: 1 })).toBe(40);
  });

  it("alinea al incremento", () => {
    expect(ajustarCantidad(4, cajon)).toBe(4);
    expect(ajustarCantidad(6, cajon)).toBe(6);
    expect(ajustarCantidad(1, cajon)).toBe(2);
    // 5 queda justo entre 4 y 6: se resuelve hacia arriba, que en una compra
    // es el lado amable.
    expect(ajustarCantidad(5, cajon)).toBe(6);
    expect(ajustarCantidad(7, cajon)).toBe(8);
  });

  it("no se cuelga con una configuración imposible", () => {
    expect(opcionesDeCantidad({ minQuantity: 5, maxQuantity: 1, quantityStep: 1 })).toEqual([5]);
    expect(opcionesDeCantidad({ minQuantity: 1, maxQuantity: 5, quantityStep: 0 })).toEqual([1]);
  });
});

describe("slug", () => {
  it("se arma a partir del nombre", () => {
    expect(generarSlug("Queso Colonia")).toBe("queso-colonia");
    expect(generarSlug("  Dulce de Leche  ")).toBe("dulce-de-leche");
    expect(generarSlug("Pizza 4 quesos!!")).toBe("pizza-4-quesos");
  });

  it("saca los acentos y la eñe", () => {
    expect(generarSlug("Jamón Serrano")).toBe("jamon-serrano");
    expect(generarSlug("Piña")).toBe("pina");
  });
});

describe("validación del producto", () => {
  const base = {
    name: "Queso de prueba",
    slug: "queso-de-prueba",
    category: "quesos",
    priceCents: "390",
    saleType: "weight",
    unitLabel: "kg",
    minQuantity: "1",
    maxQuantity: "5",
    quantityStep: "1",
    presentation: "Venta por kilo",
    sortOrder: "10",
    active: true,
  };

  it("acepta un producto correcto y convierte el precio a centésimos", () => {
    const resultado = productoSchema.safeParse(base);
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.priceCents).toBe(39000);
  });

  it("rechaza precio cero o negativo", () => {
    expect(productoSchema.safeParse({ ...base, priceCents: "0" }).success).toBe(false);
    expect(productoSchema.safeParse({ ...base, priceCents: "-10" }).success).toBe(false);
  });

  it("rechaza un rango de cantidades imposible", () => {
    const r = productoSchema.safeParse({ ...base, minQuantity: "5", maxQuantity: "2" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "maxQuantity")).toBe(true);
    }
  });

  it("rechaza cantidad mínima o incremento en cero", () => {
    expect(productoSchema.safeParse({ ...base, minQuantity: "0" }).success).toBe(false);
    expect(productoSchema.safeParse({ ...base, quantityStep: "0" }).success).toBe(false);
  });

  it("rechaza slugs con formato inválido", () => {
    for (const slug of ["Queso Colonia", "queso_colonia", "queso--", "-queso", "QUESO"]) {
      expect(productoSchema.safeParse({ ...base, slug }).success).toBe(false);
    }
  });

  it("exige nombre y presentación", () => {
    expect(productoSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(productoSchema.safeParse({ ...base, presentation: "" }).success).toBe(false);
  });
});
