export type PublicRsvpStatus = "pendente" | "confirmado" | "recusado";
export type PublicRsvpState = "unidentified" | "pending" | "confirmed" | "declined" | "mixed" | "partial";

type RsvpStateInput = {
  active: boolean;
  responses: Array<{ status: PublicRsvpStatus }>;
  general: { status: PublicRsvpStatus } | null;
};

export function derivePublicRsvpState({ active, responses, general }: RsvpStateInput): PublicRsvpState {
  if (!active) return "unidentified";
  const statuses = responses.length ? responses.map((response) => response.status) : general ? [general.status] : [];
  if (!statuses.length || statuses.every((status) => status === "pendente")) return "pending";

  const hasPending = statuses.includes("pendente");
  const hasConfirmed = statuses.includes("confirmado");
  const hasDeclined = statuses.includes("recusado");
  if (hasPending && (hasConfirmed || hasDeclined)) return "partial";
  if (hasConfirmed && hasDeclined) return "mixed";
  return hasConfirmed ? "confirmed" : "declined";
}
export function rsvpCtaLabel(state: PublicRsvpState) {
  switch (state) {
    case "confirmed": return "Ver minha confirmação";
    case "declined": return "Ver minha resposta";
    case "mixed": return "Ver minhas respostas";
    case "partial": return "Concluir confirmação";
    default: return "Confirmar presença";
  }
}

export function rsvpBlockCopy(state: PublicRsvpState, displayName: string | null) {
  const name = displayName?.trim();
  if (state === "confirmed") return {
    title: name ? `Tudo certo, ${name}!` : "Tudo certo!",
    description: "Sua presença está confirmada.",
    action: "Ver ou alterar resposta",
  };
  if (state === "declined") return {
    title: name ? `Resposta recebida, ${name}` : "Resposta recebida",
    description: "Obrigado por nos avisar com carinho. Vamos sentir sua falta.",
    action: "Alterar resposta",
  };
  if (state === "mixed") return {
    title: name ? `Respostas recebidas, ${name}` : "Respostas recebidas",
    description: "Suas respostas para cada evento estão guardadas com carinho.",
    action: "Ver minhas respostas",
  };
  if (state === "partial") return {
    title: name ? `Falta só um detalhe, ${name}` : "Falta só um detalhe",
    description: "Conclua as respostas pendentes do seu convite.",
    action: "Concluir confirmação",
  };
  return {
    title: "Sua presença é o melhor presente",
    description: name
      ? `Que bom ter você por aqui, ${name}. Conte pra gente se você vem celebrar conosco.`
      : "Conte pra gente seu nome completo para responder de forma privada.",
    action: "Confirmar presença",
  };
}
