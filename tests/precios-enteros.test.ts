import { describe, expect, it } from "vitest";
import { productoSchema } from "@/lib/product-schema";
import { formatearPesos, parsearPesos } from "@/lib/money";

const base = {
  name: "Prueba", slug: "prueba", category: "quesos", saleType: "weight",
  unitLabel: "kg", minQuantity: "1", maxQuantity: "5", quantityStep: "1",
  presentation: "Venta por kilo", sortOrder: "10", active: true,
};

describe("los precios son siempre enteros", () => {
  it("acepta enteros", () => {
    for (const entrada of ["390", "1.170", "115", "690"]) {
      const r = productoSchema.safeParse({ ...base, price: entrada });
      expect(r.success, `debería aceptar ${entrada}`).toBe(true);
      if (r.success) expect(Number.isInteger(r.data.price)).toBe(true);
    }
  });

  it("rechaza cualquier decimal", () => {
    for (const entrada of ["390,50", "390.5", "390.50", "0,5", "1.170,25", "390,00", "390.00"]) {
      const r = productoSchema.safeParse({ ...base, price: entrada });
      expect(r.success, `NO debería aceptar ${entrada}`).toBe(false);
    }
  });

  it("nunca muestra decimales", () => {
    for (const pesos of [390, 1170, 115, 690, 999999]) {
      expect(formatearPesos(pesos)).not.toMatch(/[.,]\d{1,2}$/);
    }
    expect(formatearPesos(390)).toBe("$390");
    expect(formatearPesos(1170)).toBe("$1.170");
  });

  it("parsearPesos solo devuelve enteros o null", () => {
    for (const entrada of ["390", "1.170", "390,5", "abc", "", "-1", "3.9"]) {
      const r = parsearPesos(entrada);
      expect(r === null || Number.isInteger(r), `${entrada} -> ${r}`).toBe(true);
    }
  });
});
