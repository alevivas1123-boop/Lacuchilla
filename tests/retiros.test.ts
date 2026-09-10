import { describe, expect, it } from "vitest";

import {
  cierreDePedidos,
  diaDeLaSemana,
  fechaCorta,
  fechaDeRetiroValida,
  fechaLegible,
  fechaUruguaya,
  inicioDelRetiro,
  normalizarTelefono,
  terminoTelefonico,
  proximasFechas,
  sumarDias,
} from "@/lib/retiros";

// Carrasco: jueves de 17 a 19, se cierra 24 horas antes.
const CARRASCO = { weekday: 4, timeFrom: "17:00", timeTo: "19:00", cutoffHours: 24 };
// Cuchilla Alta: sábado de 10 a 13, se cierra 12 horas antes.
const CUCHILLA = { weekday: 6, timeFrom: "10:00", timeTo: "13:00", cutoffHours: 12 };

/** Un instante en hora uruguaya, expresado sin ambigüedad. */
const enUruguay = (texto: string) => new Date(`${texto}-03:00`);

describe("la zona horaria no corre el día", () => {
  it("a las 22 de Uruguay sigue siendo el mismo día, aunque en UTC ya sea el siguiente", () => {
    // 2026-09-17 22:00 en Uruguay son las 01:00 UTC del 18.
    const instante = enUruguay("2026-09-17T22:00:00");
    expect(instante.toISOString().slice(0, 10)).toBe("2026-09-18");
    expect(fechaUruguaya(instante)).toBe("2026-09-17");
  });

  it("el inicio del retiro se ancla a la hora uruguaya", () => {
    expect(inicioDelRetiro("2026-09-17", "17:00").toISOString()).toBe("2026-09-17T20:00:00.000Z");
  });

  it("el día de la semana no depende de la hora", () => {
    expect(diaDeLaSemana("2026-09-17")).toBe(4); // jueves
    expect(diaDeLaSemana("2026-09-19")).toBe(6); // sábado
  });
});

describe("próximas fechas", () => {
  it("ofrece los jueves siguientes", () => {
    // Lunes 14 de setiembre de 2026.
    const fechas = proximasFechas(CARRASCO, 3, enUruguay("2026-09-14T10:00:00"));
    expect(fechas).toEqual(["2026-09-17", "2026-09-24", "2026-10-01"]);
  });

  it("incluye hoy si el corte todavía no pasó", () => {
    // Jueves a las 10: el retiro es a las 17 y el corte era 24 h antes…
    // ya pasó, así que hoy NO se ofrece.
    const fechas = proximasFechas(CARRASCO, 2, enUruguay("2026-09-17T10:00:00"));
    expect(fechas[0]).toBe("2026-09-24");
  });

  it("con un corte corto, el mismo día sigue disponible", () => {
    // Sábado a las 6 de la mañana, retiro 10, corte 12 h antes -> ya pasó.
    expect(proximasFechas(CUCHILLA, 1, enUruguay("2026-09-19T06:00:00"))[0]).toBe("2026-09-26");
    // Viernes a las 20: faltan 14 h para el retiro del sábado -> entra.
    expect(proximasFechas(CUCHILLA, 1, enUruguay("2026-09-18T20:00:00"))[0]).toBe("2026-09-19");
  });

  it("respeta exactamente el momento del corte", () => {
    const patron = CARRASCO;
    const corte = cierreDePedidos("2026-09-17", patron);
    const unMinutoAntes = new Date(corte.getTime() - 60_000);
    const unMinutoDespues = new Date(corte.getTime() + 60_000);

    expect(proximasFechas(patron, 1, unMinutoAntes)[0]).toBe("2026-09-17");
    expect(proximasFechas(patron, 1, unMinutoDespues)[0]).toBe("2026-09-24");
  });

  it("cruza el fin de mes y el fin de año sin romperse", () => {
    expect(proximasFechas(CARRASCO, 2, enUruguay("2026-12-28T10:00:00"))).toEqual([
      "2026-12-31",
      "2027-01-07",
    ]);
  });

  it("devuelve la cantidad pedida", () => {
    expect(proximasFechas(CARRASCO, 5, enUruguay("2026-09-14T10:00:00"))).toHaveLength(5);
    expect(proximasFechas(CARRASCO, 1, enUruguay("2026-09-14T10:00:00"))).toHaveLength(1);
  });
});

describe("validación en el servidor", () => {
  const ahora = enUruguay("2026-09-14T10:00:00");

  it("acepta una fecha que corresponde al patrón", () => {
    expect(fechaDeRetiroValida("2026-09-17", CARRASCO, ahora)).toBe(true);
  });

  it("rechaza un día que no es el del punto", () => {
    // 18 de setiembre de 2026 es viernes, no jueves.
    expect(fechaDeRetiroValida("2026-09-18", CARRASCO, ahora)).toBe(false);
  });

  it("rechaza fechas pasadas", () => {
    expect(fechaDeRetiroValida("2026-09-10", CARRASCO, ahora)).toBe(false);
  });

  it("rechaza una fecha cuyo corte ya venció", () => {
    const despuesDelCorte = enUruguay("2026-09-17T10:00:00");
    expect(fechaDeRetiroValida("2026-09-17", CARRASCO, despuesDelCorte)).toBe(false);
  });

  it("rechaza basura", () => {
    for (const entrada of ["", "mañana", "2026-13-45", "17/09/2026", "2026-09-17T17:00"]) {
      expect(fechaDeRetiroValida(entrada, CARRASCO, ahora), entrada).toBe(false);
    }
  });
});

describe("utilidades", () => {
  it("suma días cruzando meses", () => {
    expect(sumarDias("2026-09-30", 1)).toBe("2026-10-01");
    expect(sumarDias("2026-12-31", 7)).toBe("2027-01-07");
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29"); // bisiesto
  });

  it("escribe las fechas en castellano", () => {
    expect(fechaLegible("2026-09-17")).toBe("jueves 17 de setiembre");
    expect(fechaCorta("2026-09-17")).toBe("jueves 17/9");
  });

  it("normaliza teléfonos uruguayos a una sola forma", () => {
    const esperado = "59899617718";
    for (const entrada of ["099617718", "099 617 718", "+598 99 617 718", "59899617718", "(099) 617-718"]) {
      expect(normalizarTelefono(entrada), entrada).toBe(esperado);
    }
  });

  it("no convierte un nombre en un fragmento de teléfono", () => {
    // Sin esta guarda, buscar "maría" degeneraba en `%598%` y devolvía todos
    // los clientes del país.
    expect(terminoTelefonico("maría")).toBeNull();
    expect(terminoTelefonico("")).toBeNull();
    expect(terminoTelefonico("   ")).toBeNull();
  });

  it("compara teléfonos sin prefijo país ni cero inicial", () => {
    const esperado = "99617718";
    for (const entrada of ["099617718", "+598 99 617 718", "59899617718", "99617718"]) {
      expect(terminoTelefonico(entrada), entrada).toBe(esperado);
    }
    expect(terminoTelefonico("9961")).toBe("9961");
    expect(terminoTelefonico("Ana 099")).toBe("99");
  });
});
