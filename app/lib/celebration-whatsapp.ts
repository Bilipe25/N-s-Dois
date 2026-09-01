export type CelebrationWhatsAppContext = "confirmation" | "rsvp_update" | "declined" | "gift_reserved";

export type CelebrationWhatsAppMessageInput = {
  guestName: string;
  rsvpStatus: "pendente" | "confirmado" | "recusado";
  adults: number;
  children: number;
  gifts?: string[];
  context: CelebrationWhatsAppContext;
};

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function uniqueGifts(gifts: string[] = []) {
  const seen = new Set<string>();
  return gifts.flatMap((gift) => {
    const cleanGift = cleanText(gift);
    const key = cleanGift.toLocaleLowerCase("pt-BR");
    if (!cleanGift || seen.has(key)) return [];
    seen.add(key);
    return [cleanGift];
  });
}

export function normalizeWhatsAppPhone(value: string | null | undefined) {
  const digits = (value || "").replace(/\D/g, "");
  const hasCountryCode = digits.startsWith("55") && (digits.length === 12 || digits.length === 13);
  const nationalNumber = hasCountryCode ? digits.slice(2) : digits;
  if (!/^[1-9]\d{9,10}$/.test(nationalNumber)) return null;
  return `55${nationalNumber}`;
}

export function formatWhatsAppPhone(value: string | null | undefined) {
  const normalized = normalizeWhatsAppPhone(value);
  if (!normalized) return null;
  const nationalNumber = normalized.slice(2);
  const areaCode = nationalNumber.slice(0, 2);
  const subscriber = nationalNumber.slice(2);
  const splitAt = subscriber.length - 4;
  return `+55 (${areaCode}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
}

export function formatCelebrationParticipants(adults: number, children: number) {
  const safeAdults = Math.max(0, Math.trunc(adults));
  const safeChildren = Math.max(0, Math.trunc(children));
  const parts: string[] = [];
  if (safeAdults > 0) parts.push(`${safeAdults} ${safeAdults === 1 ? "adulto" : "adultos"}`);
  if (safeChildren > 0) parts.push(`${safeChildren} ${safeChildren === 1 ? "criança" : "crianças"}`);
  if (!parts.length) return "nenhuma pessoa confirmada";
  return parts.join(" e ");
}

function shortName(name: string) {
  return cleanText(name).split(" ")[0] || "Oi";
}

function giftSentence(gifts: string[], mode: "confirmation" | "declined" | "gift") {
  if (!gifts.length) return "";
  if (mode === "declined") {
    return gifts.length === 1
      ? `E agradecemos também pelo carinho com o presente que você escolheu para o nosso novo lar: ${gifts[0]}. ❤️`
      : "E agradecemos também pelo carinho com os presentes que você escolheu para o nosso novo lar. ❤️";
  }

  const intro = mode === "gift"
    ? "Vimos que você escolheu"
    : "E vimos também que você escolheu nos presentear com";
  if (gifts.length === 1) {
    const gratitude = mode === "gift"
      ? "da nossa lista. O item já ficou reservado no seu nome. 🎁"
      : "Muito obrigado pelo carinho! 🥹❤️\n\nO item já ficou reservado no seu nome.";
    return `${intro} ${gifts[0]}${mode === "gift" ? " " : ". "}${gratitude}`;
  }
  if (gifts.length === 2) {
    const joined = `${gifts[0]} e ${gifts[1]}`;
    return mode === "gift"
      ? `${intro} ${joined} da nossa lista. Eles já ficaram reservados no seu nome. 🎁`
      : `${intro} ${joined}. Muito obrigado pelo carinho! 🥹❤️\n\nEles já ficaram reservados no seu nome.`;
  }
  const list = gifts.map((gift) => `• ${gift}`).join("\n");
  return mode === "gift"
    ? `Vimos os presentes que você escolheu na nossa lista:\n\n${list}\n\nEles já ficaram reservados no seu nome. 🎁`
    : `Vimos também os presentes que você escolheu na nossa lista. Muito obrigado pelo carinho! 🥹❤️\n\n${list}\n\nEles já ficaram reservados no seu nome.`;
}

export function buildCelebrationWhatsAppMessage(input: CelebrationWhatsAppMessageInput) {
  const name = shortName(input.guestName);
  const gifts = uniqueGifts(input.gifts);
  const greeting = `Oi, ${name}! 💛`;

  if (input.context === "declined" || input.rsvpStatus === "recusado") {
    return [
      greeting,
      "Recebemos sua resposta direitinho.",
      "Sentiremos sua falta, mas agradecemos muito por ter nos avisado e por todo carinho com a gente. ❤️",
      giftSentence(gifts, "declined"),
      "Que Deus abençoe vocês!",
      "Gabriel e Raabe",
    ].filter(Boolean).join("\n\n");
  }

  if (input.context === "gift_reserved") {
    return [
      greeting,
      giftSentence(gifts, "gift"),
      "Muito obrigado pelo carinho com a gente e com o nosso novo lar. Ficamos muito felizes! 🥹❤️",
      "Gabriel e Raabe",
    ].filter(Boolean).join("\n\n");
  }

  if (input.context === "rsvp_update") {
    if (input.rsvpStatus === "pendente") {
      return [
        greeting,
        "Passando só para falar sobre a nossa celebração.",
        "Sua resposta ainda não ficou confirmada por aqui. Se precisar de ajuda, estamos à disposição. ❤️",
        "Gabriel e Raabe",
      ].join("\n\n");
    }
    return [
      greeting,
      "Recebemos a atualização da sua confirmação.",
      `Agora ficou registrado para ${formatCelebrationParticipants(input.adults, input.children)}.`,
      "Está tudo certinho por aqui. ❤️",
      "Gabriel e Raabe",
    ].join("\n\n");
  }

  return [
    greeting,
    "Recebemos sua confirmação direitinho!",
    `Ficou confirmado para ${formatCelebrationParticipants(input.adults, input.children)}. 😊`,
    giftSentence(gifts, "confirmation"),
    "Para nós, o mais importante é poder ter vocês conosco e compartilhar esse momento.",
    "Que Deus abençoe muito vocês!",
    "Gabriel e Raabe ❤️",
  ].filter(Boolean).join("\n\n");
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  const cleanMessage = message.trim();
  if (!normalized || !cleanMessage) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(cleanMessage)}`;
}
