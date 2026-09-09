import { describe, expect, it } from "vitest";

import { formatearPesos, parsearPesos } from "@/lib/money";
import { generarSlug, productoSchema } from "@/lib/product-schema";
import { ajustarCantidad, opcionesDeCantidad } from "@/lib/types";

describe("dinero", () => {
  it("formatea pesos uruguayos con punto de miles", () => {
    expect(formatearPesos(390)).toBe("$390");
    expect(formatearPesos(1170)).toBe("$1.170");
    expect(formatearPesos(2450)).toBe("$2.450");
    expect(formatearPesos(1000000)).toBe("$1.000.000");
  });

  it("acepta enteros y tolera el punto de miles al escribir", () => {
    expect(parsearPesos("390")).toBe(390);
    expect(parsearPesos(" 1170 ")).toBe(1170);
    expect(parsearPesos("1.170")).toBe(1170);
  });

  it("rechaza decimales: los precios son enteros", () => {
    expect(parsearPesos("390,50")).toBeNull();
    expect(parsearPesos("0,07")).toBeNull();
  });

  it("no confunde un decimal con un separador de miles", () => {
    // Si se borrara el punto sin mirar, "390.5" quedaría en 3905: un precio
    // diez veces mayor cargado sin que nadie lo note.
    expect(parsearPesos("390.5")).toBeNull();
    expect(parsearPesos("1.17")).toBeNull();
    expect(parsearPesos("1.1700")).toBeNull();
    // El punto solo vale separando grupos de tres.
    expect(parsearPesos("1.170")).toBe(1170);
    expect(parsearPesos("12.345.678")).toBe(12345678);
  });

  it("rechaza entradas que no son importes", () => {
    expect(parsearPesos("")).toBeNull();
    expect(parsearPesos("abc")).toBeNull();
    expect(parsearPesos("-5")).toBeNull();
  });

  it("los totales son aritmética entera exacta", () => {
    const linea = (precio: number, cantidad: number) => precio * cantidad;
    expect(linea(390, 3) + linea(120, 2)).toBe(1410);
    expect(formatearPesos(linea(390, 3))).toBe("$1.170");
  });

  it("va y vuelve sin perder valor", () => {
    for (const pesos of [1, 7, 100, 390, 1170, 690]) {
      expect(parsearPesos(String(pesos))).toBe(pesos);
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
    price: "390",
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
    if (resultado.success) expect(resultado.data.price).toBe(390);
  });

  it("rechaza precios con decimales", () => {
    expect(productoSchema.safeParse({ ...base, price: "390,50" }).success).toBe(false);
  });

  it("rechaza precio cero o negativo", () => {
    expect(productoSchema.safeParse({ ...base, price: "0" }).success).toBe(false);
    expect(productoSchema.safeParse({ ...base, price: "-10" }).success).toBe(false);
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
