import { describe, expect, it } from "vitest";

import { puntoSchema } from "@/lib/pickup-schema";
import { configuracionSchema, datosBancariosCompletos } from "@/lib/settings-schema";
import { esEstado, transicionesDe } from "@/lib/estados-pedido";

const PUNTO_VALIDO = {
  name: "Carrasco",
  address: "Av. Bolivia 1234",
  weekday: "4",
  timeFrom: "17:00",
  timeTo: "19:00",
  cutoffHours: "24",
  sortOrder: "10",
  active: true,
};

describe("validación del punto de retiro", () => {
  it("acepta un punto bien cargado y convierte los números", () => {
    const resultado = puntoSchema.safeParse(PUNTO_VALIDO);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.weekday).toBe(4);
    expect(resultado.data.cutoffHours).toBe(24);
    expect(resultado.data.sortOrder).toBe(10);
  });

  it("rechaza un horario que cierra antes de abrir", () => {
    const resultado = puntoSchema.safeParse({ ...PUNTO_VALIDO, timeFrom: "19:00", timeTo: "17:00" });
    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(resultado.error.issues[0].path).toEqual(["timeTo"]);
  });

  it("rechaza un día fuera del rango", () => {
    for (const weekday of ["7", "-1", "jueves", ""]) {
      expect(puntoSchema.safeParse({ ...PUNTO_VALIDO, weekday }).success, weekday).toBe(false);
    }
  });

  it("rechaza horas que no son horas", () => {
    for (const timeFrom of ["25:00", "17:60", "5pm", "17", ""]) {
      expect(puntoSchema.safeParse({ ...PUNTO_VALIDO, timeFrom }).success, timeFrom).toBe(false);
    }
  });

  it("rechaza un corte negativo", () => {
    expect(puntoSchema.safeParse({ ...PUNTO_VALIDO, cutoffHours: "-1" }).success).toBe(false);
  });

  it("acepta corte cero: se puede pedir hasta la hora del retiro", () => {
    expect(puntoSchema.safeParse({ ...PUNTO_VALIDO, cutoffHours: "0" }).success).toBe(true);
  });
});

describe("validación de la configuración", () => {
  const VACIA = {
    bankHolder: "",
    bankName: "",
    bankAccount: "",
    bankAccountType: "",
    bankDocument: "",
    bankInstructions: "",
    minimumOrder: "",
  };

  it("acepta la configuración vacía: se puede empezar sin datos bancarios", () => {
    const resultado = configuracionSchema.safeParse(VACIA);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.bankHolder).toBeNull();
    expect(resultado.data.minimumOrder).toBeNull();
  });

  it("exige titular y cuenta si se empezó a cargar el banco", () => {
    const resultado = configuracionSchema.safeParse({ ...VACIA, bankName: "BROU" });
    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    const campos = resultado.error.issues.map((i) => i.path[0]);
    expect(campos).toContain("bankHolder");
    expect(campos).toContain("bankAccount");
  });

  it("el mínimo va en pesos enteros", () => {
    expect(configuracionSchema.safeParse({ ...VACIA, minimumOrder: "500" })).toMatchObject({
      success: true,
      data: { minimumOrder: 500 },
    });
    expect(configuracionSchema.safeParse({ ...VACIA, minimumOrder: "1.500" })).toMatchObject({
      success: true,
      data: { minimumOrder: 1500 },
    });
    // "390.5" no es mil quinientos ni trescientos noventa: es un decimal, y
    // borrarle el punto lo convertiría en un precio diez veces mayor.
    for (const valor of ["390.5", "500,50", "-100", "0", "gratis"]) {
      expect(configuracionSchema.safeParse({ ...VACIA, minimumOrder: valor }).success, valor).toBe(
        false,
      );
    }
  });

  it("sabe si se puede cobrar con lo que hay cargado", () => {
    expect(datosBancariosCompletos({ bankHolder: "María", bankAccount: "001-2" })).toBe(true);
    expect(datosBancariosCompletos({ bankHolder: "María", bankAccount: null })).toBe(false);
    expect(datosBancariosCompletos({ bankHolder: "  ", bankAccount: "001-2" })).toBe(false);
  });
});

describe("máquina de estados del pedido", () => {
  it("permite el camino normal de la operación", () => {
    expect(transicionesDe("pendiente_pago")).toContain("pagado");
    expect(transicionesDe("pagado")).toContain("preparado");
    expect(transicionesDe("preparado")).toContain("entregado");
    // Preparar es opcional: se puede entregar directo desde pagado.
    expect(transicionesDe("pagado")).toContain("entregado");
  });

  it("no deja volver atrás un pedido cerrado", () => {
    expect(transicionesDe("entregado")).toEqual([]);
    expect(transicionesDe("cancelado")).toEqual([]);
  });

  it("no deja saltear el cobro", () => {
    expect(transicionesDe("pendiente_pago")).not.toContain("preparado");
    expect(transicionesDe("pendiente_pago")).not.toContain("entregado");
  });

  it("reconoce solo los estados que existen", () => {
    expect(esEstado("pagado")).toBe(true);
    expect(esEstado("PAGADO")).toBe(false);
    expect(esEstado("enviado")).toBe(false);
  });
});
