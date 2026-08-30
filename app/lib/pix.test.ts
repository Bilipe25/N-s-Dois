import { describe, expect, it } from "vitest";
import { crc16Ccitt, createPixPayload } from "./pix";

describe("BR Code PIX", () => {
  it("gera CRC16-CCITT conhecido", () => {
    expect(crc16Ccitt("123456789")).toBe("29B1");
  });

  it("gera payload livre válido sem campo de valor", () => {
    const payload = createPixPayload({ key: "pix@example.com", recipientName: "Raabe e Gabriel", city: "Fortaleza" });
    expect(payload).toContain("0014BR.GOV.BCB.PIX");
    expect(payload).not.toContain("540");
    expect(payload.slice(-4)).toBe(crc16Ccitt(payload.slice(0, -4)));
  });

  it("inclui valor exato em centavos quando informado", () => {
    const payload = createPixPayload({ key: "pix@example.com", recipientName: "Raabe", city: "Fortaleza", amountCents: 12345 });
    expect(payload).toContain("5406123.45");
  });

  it("rejeita chave com caracteres fora do conjunto EMV seguro", () => {
    expect(() => createPixPayload({ key: "chave🔑", recipientName: "Raabe", city: "Fortaleza" })).toThrow("Chave PIX inválida");
  });
});
