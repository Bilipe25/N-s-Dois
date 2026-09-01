import { describe, expect, it } from "vitest";
import { cleanGuestName, normalizeGuestName, normalizeOptionalPhone } from "./guest-name";

describe("normalização privada de nomes", () => {
  it.each([
    ["João da Silva", "joao da silva"],
    ["JOAO   DA SILVA", "joao da silva"],
    ["  Maria\tOliveira  ", "maria oliveira"],
    ["Érica D’Ávila", "erica d avila"],
  ])("normaliza %s sem alterar o valor de exibição", (input, expected) => {
    expect(normalizeGuestName(input)).toBe(expected);
  });

  it("preserva acentos e caixa no nome limpo", () => {
    expect(cleanGuestName("  João   da Silva ")).toBe("João da Silva");
  });

  it("trata hífens e apóstrofos tipográficos como separadores equivalentes", () => {
    expect(normalizeGuestName("Ana-Maria D’Ávila")).toBe("ana maria d avila");
    expect(normalizeGuestName("  ANA MARIA D AVILA ")).toBe("ana maria d avila");
  });

  it("aceita somente telefones opcionais com tamanho plausível", () => {
    expect(normalizeOptionalPhone("(79) 99999-0000")).toBe("79999990000");
    expect(normalizeOptionalPhone("123")).toBeNull();
    expect(normalizeOptionalPhone("")).toBeNull();
  });
});
