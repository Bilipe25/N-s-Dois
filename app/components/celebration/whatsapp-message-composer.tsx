import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Gift, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCelebrationWhatsAppMessage,
  buildWhatsAppUrl,
  formatCelebrationParticipants,
  formatWhatsAppPhone,
  type CelebrationWhatsAppContext,
} from "@/lib/celebration-whatsapp";

export type CelebrationWhatsAppComposerData = {
  guestName: string;
  phone: string | null | undefined;
  rsvpStatus: "pendente" | "confirmado" | "recusado";
  adults: number;
  children: number;
  gifts?: string[];
  context: CelebrationWhatsAppContext;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CelebrationWhatsAppComposerData | null;
};

export function CelebrationWhatsAppComposer({ open, onOpenChange, data }: Props) {
  const [context, setContext] = useState<CelebrationWhatsAppContext>(data?.context || "confirmation");
  const suggestedMessage = useMemo(() => data ? buildCelebrationWhatsAppMessage({ ...data, context }) : "", [context, data]);
  const [message, setMessage] = useState(suggestedMessage);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    setContext(data?.context || "confirmation");
  }, [data, open]);

  useEffect(() => {
    if (!open) return;
    setMessage(suggestedMessage);
    setCopyState("idle");
  }, [open, suggestedMessage]);

  if (!data) return null;

  const phone = formatWhatsAppPhone(data.phone);
  const whatsappUrl = buildWhatsAppUrl(data.phone, message);
  const gifts = (data.gifts || []).map((gift) => gift.trim()).filter(Boolean);
  const rsvpText = data.rsvpStatus === "recusado"
    ? "Não poderá comparecer"
    : data.rsvpStatus === "pendente"
      ? "Resposta pendente"
      : formatCelebrationParticipants(data.adults, data.children);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message.trim());
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bottom-0 left-0 top-auto max-h-[92svh] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-t-[20px] border-stone-200 bg-white p-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <DialogHeader className="border-b border-stone-100 px-5 pb-4 pt-6 pr-14 text-left sm:px-6">
          <DialogTitle className="font-serif text-2xl text-stone-900">Mensagem para {data.guestName.trim()}</DialogTitle>
          <DialogDescription className="leading-relaxed text-stone-600">
            Revise e personalize. O WhatsApp só será aberto quando você decidir continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section aria-labelledby="whatsapp-summary-title" className="space-y-3 rounded-2xl bg-stone-50 p-4">
            <h3 id="whatsapp-summary-title" className="text-sm font-semibold text-stone-900">Resumo</h3>
            <dl className="space-y-2 text-sm text-stone-700">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
                <div><dt className="sr-only">WhatsApp</dt><dd>{phone || "WhatsApp não informado"}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
                <div><dt className="sr-only">RSVP</dt><dd>{rsvpText}</dd></div>
              </div>
              {gifts.length > 0 && (
                <div className="flex items-start gap-3">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                  <div><dt className="sr-only">Presentes reservados</dt><dd>{gifts.join(" · ")}</dd></div>
                </div>
              )}
            </dl>
          </section>

          {data.rsvpStatus === "confirmado" && data.context !== "gift_reserved" && (
            <label className="block space-y-2 text-sm font-semibold text-stone-800">
              Tipo de mensagem
              <select
                value={context}
                onChange={(event) => setContext(event.target.value as CelebrationWhatsAppContext)}
                className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-base font-normal text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <option value="confirmation">Confirmação recebida</option>
                <option value="rsvp_update">Confirmação atualizada</option>
              </select>
            </label>
          )}

          <label className="block space-y-2 text-sm font-semibold text-stone-800">
            Editar mensagem
            <Textarea
              value={message}
              onChange={(event) => { setMessage(event.target.value); setCopyState("idle"); }}
              rows={12}
              maxLength={4000}
              className="min-h-64 resize-y rounded-xl border-stone-200 bg-white text-base font-normal leading-relaxed text-stone-800 focus-visible:ring-2 focus-visible:ring-rose-500 sm:min-h-72"
            />
          </label>

          {copyState === "error" && <p className="text-sm text-rose-700" role="alert">Não foi possível copiar. Selecione o texto e tente novamente.</p>}
          {!phone && <p className="rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">WhatsApp não informado. Adicione o número no cadastro do convidado para abrir a conversa.</p>}
        </div>

        <div className="grid gap-2 border-t border-stone-100 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:grid-cols-2 sm:px-6">
          <Button type="button" variant="outline" onClick={() => void copyMessage()} disabled={!message.trim()} className="min-h-12 rounded-full border-stone-300">
            {copyState === "copied" ? <Check className="mr-2 h-4 w-4 text-green-700" aria-hidden="true" /> : <Copy className="mr-2 h-4 w-4" aria-hidden="true" />}
            {copyState === "copied" ? "Mensagem copiada ✓" : "Copiar mensagem"}
          </Button>
          <Button asChild={Boolean(whatsappUrl)} disabled={!whatsappUrl} className="min-h-12 rounded-full bg-green-700 text-white hover:bg-green-800">
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />Abrir no WhatsApp
              </a>
            ) : (
              <span><MessageCircle className="mr-2 inline h-4 w-4" aria-hidden="true" />WhatsApp não informado</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
