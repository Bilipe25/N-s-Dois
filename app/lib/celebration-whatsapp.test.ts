import { describe, expect, it } from "vitest";
import {
  buildCelebrationWhatsAppMessage,
  buildWhatsAppUrl,
  formatCelebrationParticipants,
  normalizeWhatsAppPhone,
} from "./celebration-whatsapp";

describe("celebration whatsapp", () => {
  it.each([
    ["82999999999", "5582999999999"],
    ["5582999999999", "5582999999999"],
    ["(82) 99999-9999", "5582999999999"],
    ["+55 (82) 99999-9999", "5582999999999"],
    ["(55) 99999-9999", "5555999999999"],
    ["123", null],
    ["", null],
  ])("normaliza %s", (input, expected) => {
    expect(normalizeWhatsAppPhone(input)).toBe(expected);
  });

  it.each([
    [1, 0, "1 adulto"],
    [2, 0, "2 adultos"],
    [1, 1, "1 adulto e 1 criança"],
    [2, 3, "2 adultos e 3 crianças"],
    [0, 2, "2 crianças"],
  ])("formata participantes", (adults, children, expected) => {
    expect(formatCelebrationParticipants(adults, children)).toBe(expected);
  });

  it("cria confirmação humana com um presente e dados limpos", () => {
    const message = buildCelebrationWhatsAppMessage({
      guestName: "  Maria   da Silva  ",
      rsvpStatus: "confirmado",
      adults: 2,
      children: 1,
      gifts: ["  Air Fryer  "],
      context: "confirmation",
    });
    expect(message).toContain("Oi, Maria! 💛");
    expect(message).toContain("2 adultos e 1 criança");
    expect(message).toContain("Air Fryer");
    expect(message).toContain("reservado no seu nome");
    expect(message).not.toMatch(/comprar|pagamento confirmado/i);
  });

  it("não menciona presente quando não existe reserva", () => {
    const message = buildCelebrationWhatsAppMessage({ guestName: "Maria", rsvpStatus: "confirmado", adults: 1, children: 0, context: "confirmation" });
    expect(message).not.toMatch(/presente|reservad/i);
  });

  it("usa união natural para dois presentes", () => {
    const message = buildCelebrationWhatsAppMessage({ guestName: "Maria", rsvpStatus: "confirmado", adults: 2, children: 0, gifts: ["Air Fryer", "Kit de Mesa"], context: "confirmation" });
    expect(message).toContain("Air Fryer e Kit de Mesa");
  });

  it("lista três ou mais presentes sem duplicar nomes", () => {
    const message = buildCelebrationWhatsAppMessage({ guestName: "Maria", rsvpStatus: "confirmado", adults: 2, children: 0, gifts: ["Air Fryer", "Jogo de Panelas", "Air Fryer", "Faqueiro"], context: "confirmation" });
    expect(message).toContain("• Air Fryer\n• Jogo de Panelas\n• Faqueiro");
    expect(message.match(/• Air Fryer/g)).toHaveLength(1);
  });

  it("gera agradecimento curto no contexto do presente", () => {
    const message = buildCelebrationWhatsAppMessage({ guestName: "Maria", rsvpStatus: "confirmado", adults: 2, children: 1, gifts: ["Air Fryer"], context: "gift_reserved" });
    expect(message).toContain("Vimos que você escolheu Air Fryer");
    expect(message).not.toContain("Ficou confirmado para");
  });

  it("gera atualização sem agradecer novamente pelos presentes", () => {
    const message = buildCelebrationWhatsAppMessage({ guestName: "Maria", rsvpStatus: "confirmado", adults: 3, children: 1, gifts: ["Air Fryer"], context: "rsvp_update" });
    expect(message).toContain("Agora ficou registrado para 3 adultos e 1 criança");
    expect(message).not.toContain("Air Fryer");
  });

  it("gera recusa sem afirmar presença e cita presente discretamente", () => {
    const message = buildCelebrationWhatsAppMessage({ guestName: "Maria", rsvpStatus: "recusado", adults: 0, children: 0, gifts: ["Air Fryer"], context: "declined" });
    expect(message).toContain("Sentiremos sua falta");
    expect(message).toContain("carinho com o presente");
    expect(message).not.toMatch(/presença confirmada|ficou confirmado/i);
  });

  it("codifica acentos, emoji, quebras, ampersand e aspas na URL", () => {
    const message = "Olá, Maria! 💛\nGabriel & Raabe disseram: \"obrigado\".";
    const url = buildWhatsAppUrl("(82) 99999-9999", message);
    expect(url).toBe(`https://wa.me/5582999999999?text=${encodeURIComponent(message)}`);
    expect(decodeURIComponent(url!.split("?text=")[1])).toBe(message);
  });

  it("não cria link sem telefone válido", () => {
    expect(buildWhatsAppUrl("sem número", "Mensagem")).toBeNull();
  });
});
