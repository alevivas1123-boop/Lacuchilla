import { describe, expect, it } from "vitest";

import { armarMensajeDePedido } from "@/lib/email/plantilla-pedido";
import type { OrderItemRow, OrderRow, StoreSettingsRow } from "@/db/schema";

/*
 * El email es lo único que el cliente se lleva: si no dice cuánto transferir,
 * a qué cuenta y dónde retirar, no sirve de nada. Y como lo arma con texto que
 * escribió el cliente, tiene que escaparlo.
 */

const PEDIDO = {
  id: "3f2b1a90-0000-4000-8000-000000000001",
  orderNumber: "LC-260910-3426",
  status: "pendiente_pago",
  customerName: "Ana Rodríguez",
  customerPhone: "59899123456",
  customerEmail: "ana@ejemplo.com",
  pickupPointName: "Carrasco",
  pickupAddress: "Av. Bolivia 1234",
  pickupDate: "2026-09-17",
  pickupTimeFrom: "17:00",
  pickupTimeTo: "19:00",
  notes: null,
  total: 1170,
} as unknown as OrderRow;

const LINEAS = [
  {
    id: "l1",
    productName: "Queso Colonia",
    presentation: "Horma entera",
    unitLabel: "kg",
    saleType: "weight",
    unitPrice: 390,
    quantity: 3,
    lineTotal: 1170,
  },
] as unknown as OrderItemRow[];

const BANCO = {
  bankHolder: "La Cuchilla",
  bankName: "BROU",
  bankAccountType: "Caja de ahorro en pesos",
  bankAccount: "001234567-00001",
  bankDocument: "1.234.567-8",
  bankInstructions: "Poné tu número de pedido en la referencia.",
} as unknown as StoreSettingsRow;

const SIN_BANCO = {
  bankHolder: null,
  bankName: null,
  bankAccountType: null,
  bankAccount: null,
  bankDocument: null,
  bankInstructions: null,
} as unknown as StoreSettingsRow;

const armar = (configuracion: StoreSettingsRow, pedido: OrderRow = PEDIDO) =>
  armarMensajeDePedido({
    pedido,
    lineas: LINEAS,
    configuracion,
    whatsapp: "https://wa.me/59899617718",
    urlDelPedido: "https://lacuchilla.uy/pedido-confirmado?id=3f2b1a90-0000-4000-8000-000000000001",
  });

describe("email de confirmación", () => {
  it("lleva el número de pedido en el asunto, para poder buscarlo después", () => {
    expect(armar(BANCO).asunto).toContain("LC-260910-3426");
  });

  it("dice cuánto transferir y a qué cuenta, en las dos versiones", () => {
    const { html, texto } = armar(BANCO);
    for (const cuerpo of [html, texto]) {
      expect(cuerpo).toContain("$1.170");
      expect(cuerpo).toContain("001234567-00001");
      expect(cuerpo).toContain("La Cuchilla");
      // El número de pedido va como referencia de la transferencia.
      expect(cuerpo).toContain("LC-260910-3426");
    }
  });

  it("dice dónde y cuándo retirar", () => {
    const { html, texto } = armar(BANCO);
    for (const cuerpo of [html, texto]) {
      expect(cuerpo).toContain("Carrasco");
      expect(cuerpo).toContain("Av. Bolivia 1234");
      expect(cuerpo).toContain("jueves 17 de setiembre");
      expect(cuerpo).toContain("17:00");
    }
  });

  it("detalla lo que se pidió con el precio que se cobró", () => {
    const { texto } = armar(BANCO);
    expect(texto).toContain("Queso Colonia");
    expect(texto).toContain("3 kg");
    expect(texto).toContain("$390 por kg");
  });

  it("siempre trae versión en texto plano además del HTML", () => {
    // Hay clientes que no muestran HTML, y el solo-HTML cae más en spam.
    const { texto, html } = armar(BANCO);
    expect(texto.length).toBeGreaterThan(100);
    expect(texto).not.toContain("<table");
    expect(html).toContain("<!doctype html>");
  });

  it("sin datos bancarios ofrece WhatsApp en vez de una cuenta a medias", () => {
    const { html, texto } = armar(SIN_BANCO);
    expect(html).toContain("wa.me");
    expect(texto).toContain("wa.me");
    expect(html).not.toContain("Transferí para confirmar");
  });

  it("escapa lo que escribió el cliente", () => {
    // El nombre y el comentario los escribe cualquiera: no pueden inyectar
    // etiquetas en el HTML del correo.
    const conHtml = {
      ...PEDIDO,
      customerName: '<script>alert("x")</script>',
      notes: 'Cortado fino <img src=x onerror="robar()">',
    } as OrderRow;
    const { html } = armar(BANCO, conHtml);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("incluye el comentario del cliente cuando lo dejó", () => {
    const conNota = { ...PEDIDO, notes: "Cortado fino, por favor." } as OrderRow;
    expect(armar(BANCO, conNota).html).toContain("Cortado fino, por favor.");
    expect(armar(BANCO).html).not.toContain("Tu comentario");
  });
});
