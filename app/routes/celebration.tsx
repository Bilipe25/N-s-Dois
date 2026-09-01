import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, Link, useLoaderData, useRevalidator, useSearchParams } from "react-router";
import {
  CalendarDays, Check, ChevronUp, ExternalLink, Heart, Loader2,
  MapPin, Minus, Navigation, PackageSearch, PartyPopper, Plus, QrCode,
  LogOut, Share2, Sparkles, X,
} from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./+types/celebration";
import { loadCelebration } from "@/services/celebration.server";
import type { CelebrationEvent, InvitationEvent, PublicGift } from "@/schemas/celebration";
import { noStoreHeaders } from "@/lib/security.server";
import { formatCelebrationDate, getCelebrationPhase } from "@/lib/celebration-time";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Countdown } from "@/components/bridal-shower/countdown";
import { GiftProgressBar } from "@/components/bridal-shower/gift-progress-bar";
import { CelebrationGiftFilters } from "@/components/celebration/celebration-gift-filters";
import { PublicGiftCard } from "@/components/celebration/public-gift-card";
import { PixPanel } from "@/components/celebration/pix-panel";
import { GuestIdentification, type IdentificationResult } from "@/components/celebration/guest-identification";
import { cancelGiftReservation, createGiftReservation } from "@/lib/gift-reservations";
import { HttpRequestError, requestJson } from "@/lib/http.client";
import { celebrationSocialImageMeta } from "@/lib/celebration-meta";
import "./celebration.css";

const DIRECTION_CONTRACT = `
THESIS: A experiência afetiva e fotográfica do commit 9cd5beccb70efb51ed94fbbcaef957f8592dfc3d volta a ser a fonte visual da página pública.
OWN-WORLD: Pedra e marfim, branco, rosa queimado e verde funcional; hero imersivo, serifada romântica, cartões ricos e modais focados.
STORY: A página é completa sem identificação; o nome completo abre RSVP, reserva identificada e cancelamento. O link individual permanece como alternativa.
SECURITY: Os componentes antigos são somente referência visual. Dados e escritas continuam nos contratos seguros de celebracao.
SOURCE: app/routes/public.bridal-shower.tsx e app/components/bridal-shower no commit 9cd5beccb70efb51ed94fbbcaef957f8592dfc3d.`;

export const meta: Route.MetaFunction = ({ data }) => {
  const loaderData = data as Awaited<ReturnType<typeof loader>> | undefined;
  const title = "Gabriel & Raabe — Celebrando o Amor";
  const description = loaderData?.config.subtitle || "Celebre o amor e o novo lar de Gabriel e Raabe. Veja os detalhes e confirme sua presença.";
  const canonical = loaderData?.canonical || "/celebracao";
  const socialImageMeta = celebrationSocialImageMeta(loaderData?.config.ogUrl, canonical);
  return [
    { title }, { name: "description", content: description },
    { property: "og:type", content: "website" }, { property: "og:title", content: title },
    { property: "og:description", content: description }, { property: "og:url", content: canonical },
    { property: "og:site_name", content: "Nós Dois" }, { property: "og:locale", content: "pt_BR" },
    ...socialImageMeta,
    { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:url", content: canonical },
    { name: "twitter:title", content: title }, { name: "twitter:description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
  ];
};

export const headers: Route.HeadersFunction = () => Object.fromEntries(noStoreHeaders({
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}).entries());

export async function loader({ request }: Route.LoaderArgs) {
  const data = await loadCelebration(request);
  const siteUrl = process.env.PUBLIC_SITE_URL || new URL(request.url).origin;
  return { ...data, canonical: `${siteUrl.replace(/\/$/, "")}/celebracao`, renderedAt: Date.now() };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function Counter({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (value: number) => void; label: string }) {
  return <div className="celebration-counter"><span>{label}</span><div className="celebration-counter-controls">
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Diminuir ${label.toLowerCase()}`}><Minus /></button>
    <output aria-live="polite">{value}</output>
    <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Aumentar ${label.toLowerCase()}`}><Plus /></button>
  </div></div>;
}

type ResponseDraft = InvitationEvent & { message: string };
type ContactAction = { name: "Gabriel" | "Raabe"; href: string };

function responseDraft(response: InvitationEvent): ResponseDraft {
  return { ...response, confirmed_adults: response.status === "pendente" && response.adult_limit > 0 ? Math.max(1, response.confirmed_adults) : response.confirmed_adults, message: response.private_message || "" };
}

function generalResponseDraft(general: GeneralResponse | null) {
  return general ? { ...general, confirmed_adults: general.status === "pendente" && general.adult_limit > 0 ? Math.max(1, general.confirmed_adults) : general.confirmed_adults, message: general.private_message || "" } : null;
}

function ContactActions({ contacts }: { contacts: ContactAction[] }) {
  if (!contacts.length) return null;
  return <div className="flex w-full flex-col gap-2 sm:flex-row">{contacts.map((contact) => (
    <Button key={contact.name} asChild variant="outline" className="min-h-11 flex-1 rounded-full border-green-200 text-green-800 hover:bg-green-50">
      <a href={contact.href} target="_blank" rel="noopener noreferrer">Falar com {contact.name}<ExternalLink className="ml-2 h-4 w-4" /></a>
    </Button>
  ))}</div>;
}

function DrawerCloseControl() {
  return <DrawerClose asChild><Button type="button" variant="ghost" size="icon" className="celebration-drawer-close" aria-label="Fechar"><X className="h-5 w-5" /></Button></DrawerClose>;
}

type GeneralResponse = NonNullable<Awaited<ReturnType<typeof loader>>["invitation"]["general"]>;

type SavedRsvpSummary = {
  title: string;
  status: "confirmado" | "recusado";
  adults: number;
  children: number;
};

function peopleSummary(adults: number, children: number) {
  const adultLabel = `${adults} ${adults === 1 ? "adulto" : "adultos"}`;
  const childLabel = `${children} ${children === 1 ? "criança" : "crianças"}`;
  return children > 0 ? `${adultLabel} e ${childLabel}` : adultLabel;
}

function RsvpSuccess({ summaries, registered, onViewDetails, onEdit }: { summaries: SavedRsvpSummary[]; registered: boolean; onViewDetails: () => void; onEdit: () => void }) {
  const allDeclined = summaries.length > 0 && summaries.every((summary) => summary.status === "recusado");
  const allConfirmed = summaries.length > 0 && summaries.every((summary) => summary.status === "confirmado");
  const title = allDeclined ? "Resposta registrada" : allConfirmed ? "Presença confirmada" : "Respostas salvas";
  const description = allDeclined
    ? "Obrigado por nos avisar com carinho. Sua resposta pode ser alterada depois."
    : registered
      ? "Que alegria receber sua resposta. Seu cadastro ficou sinalizado para o casal revisar com tranquilidade."
      : "Que alegria saber que você vem celebrar com a gente. Você pode alterar sua resposta depois.";

  return <div className="celebration-rsvp-success-state" role="status" aria-live="polite">
    <div className="celebration-rsvp-success-icon" aria-hidden="true"><Check /></div>
    <div className="text-center"><h3 className="font-serif text-2xl font-semibold text-stone-800">{title}</h3><p className="mt-2 text-sm leading-relaxed text-stone-600">{description}</p></div>
    <div className="w-full space-y-2" aria-label="Resumo da resposta">{summaries.map((summary) => <div key={summary.title} className="flex items-start justify-between gap-4 rounded-xl bg-stone-50 px-4 py-3 text-sm"><span className="font-medium text-stone-800">{summary.title}</span><span className="text-right text-stone-600">{summary.status === "recusado" ? "Não poderei ir" : peopleSummary(summary.adults, summary.children)}</span></div>)}</div>
    <div className="grid w-full gap-2"><Button type="button" onClick={onViewDetails} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">Ver detalhes da celebração</Button><Button type="button" variant="outline" onClick={onEdit} className="min-h-11 w-full rounded-full">Alterar resposta</Button></div>
  </div>;
}

function RsvpContent({ events, responses, general, active, enabled, open, contacts, onRefresh, onViewDetails }: { events: CelebrationEvent[]; responses: InvitationEvent[]; general: GeneralResponse | null; active: boolean; enabled: boolean; open: boolean; contacts: ContactAction[]; onRefresh: () => void; onViewDetails: () => void }) {
  const [drafts, setDrafts] = useState<ResponseDraft[]>(() => responses.map(responseDraft));
  const [generalDraft, setGeneralDraft] = useState(() => generalResponseDraft(general));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [registeredSummary, setRegisteredSummary] = useState<SavedRsvpSummary[] | null>(null);
  const submittingRef = useRef(false);
  const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  useEffect(() => {
    setDrafts(responses.map(responseDraft));
    setGeneralDraft(generalResponseDraft(general));
  }, [responses, general]);
  useEffect(() => {
    if (!open) {
      setState("idle");
      setError("");
      setRegisteredSummary(null);
      submittingRef.current = false;
    }
  }, [open]);

  const handleIdentified = (result: IdentificationResult) => {
    if (result.kind === "registered") {
      setRegisteredSummary([{ title: "Celebração", status: result.response.status, adults: result.response.confirmedAdults, children: result.response.confirmedChildren }]);
      setState("saved");
    }
    onRefresh();
  };

  const savedSummaries: SavedRsvpSummary[] = registeredSummary || (drafts.length
    ? drafts.map((draft) => ({ title: eventById.get(draft.event_id)?.title || "Celebração", status: draft.status === "recusado" ? "recusado" as const : "confirmado" as const, adults: draft.status === "recusado" ? 0 : draft.confirmed_adults, children: draft.status === "recusado" ? 0 : draft.confirmed_children }))
    : generalDraft ? [{ title: "Celebração", status: generalDraft.status === "recusado" ? "recusado" as const : "confirmado" as const, adults: generalDraft.status === "recusado" ? 0 : generalDraft.confirmed_adults, children: generalDraft.status === "recusado" ? 0 : generalDraft.confirmed_children }] : []);

  if (state === "saved" && savedSummaries.length) return <RsvpSuccess summaries={savedSummaries} registered={Boolean(registeredSummary)} onViewDetails={onViewDetails} onEdit={() => { setRegisteredSummary(null); setState("idle"); }} />;
  if (!active) return <GuestIdentification onIdentified={handleIdentified} contacts={<ContactActions contacts={contacts} />} />;
  if (!enabled) return <div className="celebration-panel-empty"><Heart /><p>As confirmações ainda não estão abertas.</p></div>;
  if (!responses.length && !generalDraft) return <div className="celebration-panel-empty"><Heart /><p>Não há uma confirmação disponível agora.</p></div>;

  const update = (id: string, values: Partial<ResponseDraft>) => { setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...values } : draft)); setState("idle"); };
  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setState("saving"); setError("");
    const payload = drafts.length
      ? { eventResponses: drafts.map((draft) => ({ eventId: draft.event_id, status: draft.status === "recusado" ? "recusado" : "confirmado", confirmedAdults: draft.status === "recusado" ? 0 : draft.confirmed_adults, confirmedChildren: draft.status === "recusado" ? 0 : draft.confirmed_children, message: draft.message })) }
      : { generalResponse: { status: generalDraft?.status === "recusado" ? "recusado" : "confirmado", confirmedAdults: generalDraft?.status === "recusado" ? 0 : generalDraft?.confirmed_adults || 0, confirmedChildren: generalDraft?.status === "recusado" ? 0 : generalDraft?.confirmed_children || 0, message: generalDraft?.message || "" } };
    try {
      await requestJson("/api/public/celebracao/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setState("saved");
      onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar. Tente novamente.");
      setState("error");
    } finally {
      submittingRef.current = false;
    }
  };

  return <div className="celebration-rsvp-form">{!drafts.length && generalDraft && <fieldset className="celebration-rsvp-event"><legend>Celebração</legend>
    <div className="celebration-choice" aria-label="Resposta para a celebração">
      <button type="button" aria-pressed={generalDraft.status !== "recusado"} className={generalDraft.status !== "recusado" ? "is-active" : ""} onClick={() => { setGeneralDraft({ ...generalDraft, status: "confirmado", confirmed_adults: Math.max(1, generalDraft.confirmed_adults) }); setState("idle"); }}>Estarei presente</button>
      <button type="button" aria-pressed={generalDraft.status === "recusado"} className={generalDraft.status === "recusado" ? "is-active" : ""} onClick={() => { setGeneralDraft({ ...generalDraft, status: "recusado", confirmed_adults: 0, confirmed_children: 0 }); setState("idle"); }}>Não poderei ir</button>
    </div>
    {generalDraft.status !== "recusado" && <div className="celebration-counters"><Counter label="Adultos" value={generalDraft.confirmed_adults} min={generalDraft.adult_limit > 0 ? 1 : 0} max={generalDraft.adult_limit} onChange={(value) => setGeneralDraft({ ...generalDraft, confirmed_adults: value })} />{generalDraft.child_limit > 0 && <Counter label="Crianças" value={generalDraft.confirmed_children} min={0} max={generalDraft.child_limit} onChange={(value) => setGeneralDraft({ ...generalDraft, confirmed_children: value })} />}</div>}
    <label className="celebration-message"><span>Mensagem para o casal <small>opcional e privada</small></span><textarea value={generalDraft.message} maxLength={1000} rows={3} onChange={(event) => setGeneralDraft({ ...generalDraft, message: event.target.value })} placeholder="Escreva somente se quiser." /></label>
  </fieldset>}{drafts.map((draft) => {
    const event = eventById.get(draft.event_id); if (!event) return null;
    const accepted = draft.status !== "recusado";
    return <fieldset key={draft.id} className="celebration-rsvp-event"><legend>{event.title}</legend>
      <div className="celebration-choice" aria-label={`Resposta para ${event.title}`}>
        <button type="button" aria-pressed={accepted} className={accepted ? "is-active" : ""} onClick={() => update(draft.id, { status: "confirmado", confirmed_adults: Math.max(1, draft.confirmed_adults) })}>Estarei presente</button>
        <button type="button" aria-pressed={!accepted} className={!accepted ? "is-active" : ""} onClick={() => update(draft.id, { status: "recusado", confirmed_adults: 0, confirmed_children: 0 })}>Não poderei ir</button>
      </div>
      {accepted && <div className="celebration-counters"><Counter label="Adultos" value={draft.confirmed_adults} min={draft.adult_limit > 0 ? 1 : 0} max={draft.adult_limit} onChange={(value) => update(draft.id, { confirmed_adults: value })} />{draft.child_limit > 0 && <Counter label="Crianças" value={draft.confirmed_children} min={0} max={draft.child_limit} onChange={(value) => update(draft.id, { confirmed_children: value })} />}</div>}
      <label className="celebration-message"><span>Mensagem para o casal <small>opcional e privada</small></span><textarea value={draft.message} maxLength={1000} rows={3} onChange={(event) => update(draft.id, { message: event.target.value })} placeholder="Escreva somente se quiser." /></label>
    </fieldset>;
  })}
    {error && <p className="celebration-form-error" role="alert">{error}</p>}
    <Button type="button" onClick={submit} disabled={state === "saving"} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">{state === "saving" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando…</> : "Salvar minha resposta"}</Button>
  </div>;
}

function RsvpPanel({ open, onOpenChange, children, isMobile, active }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; isMobile: boolean; active: boolean }) {
  const description = active ? "Sua resposta é privada e pode ser alterada depois." : "Digite seu nome completo para começar.";
  const heading = <><DialogTitle className="font-serif text-2xl text-stone-800">Confirmação de presença</DialogTitle><DialogDescription>{description}</DialogDescription></>;
  if (isMobile) return <Drawer open={open} onOpenChange={onOpenChange}><DrawerContent className="celebration-drawer"><DrawerHeader className="relative pr-16 text-left"><DrawerTitle className="font-serif text-2xl">Confirmação de presença</DrawerTitle><DrawerDescription>{description}</DrawerDescription><DrawerCloseControl /></DrawerHeader><div className="celebration-drawer-scroll px-4">{children}</div></DrawerContent></Drawer>;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader>{heading}</DialogHeader>{children}</DialogContent></Dialog>;
}

function GiftSection({ initialGifts, initialCursor, categories, stats, canReserve, reservationsAvailable, invitationActive, pixEnabled, contacts, onIdentified }: { initialGifts: PublicGift[]; initialCursor: string | null; categories: string[]; stats: { total: number; reserved: number }; canReserve: boolean; reservationsAvailable: boolean; invitationActive: boolean; pixEnabled: boolean; contacts: ContactAction[]; onIdentified: () => void | Promise<void> }) {
  const [gifts, setGifts] = useState(initialGifts); const [cursor, setCursor] = useState(initialCursor);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState<string | null>(null); const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false); const [loadingMore, setLoadingMore] = useState(false); const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicGift | null>(null); const [message, setMessage] = useState("");
  const [filterError, setFilterError] = useState(""); const [resultCount, setResultCount] = useState(stats.total);
  const [reservationFeedback, setReservationFeedback] = useState<"reserved" | "cancelled" | "conflict" | null>(null);
  const [pixGift, setPixGift] = useState<PublicGift | null>(null); const [pixOpen, setPixOpen] = useState(false);
  const [reservedCount, setReservedCount] = useState(stats.reserved);
  const didInitializeFilters = useRef(false);
  const giftSectionEndRef = useRef<HTMLDivElement>(null);
  const wasInvitationActive = useRef(invitationActive);
  const availabilityByGift = useRef(new Map(initialGifts.map((gift) => [gift.id, gift.available])));
  const isMobile = useIsMobile();

  const updateGift = useCallback((giftId: string, patch: Pick<PublicGift, "available" | "reservation_id">) => {
    const previousAvailability = availabilityByGift.current.get(giftId);
    if (previousAvailability !== undefined && previousAvailability !== patch.available) {
      setReservedCount((current) => Math.max(0, current + (patch.available ? -1 : 1)));
    }
    availabilityByGift.current.set(giftId, patch.available);
    const applyPatch = (gift: PublicGift) => gift.id === giftId ? { ...gift, ...patch } : gift;
    setGifts((current) => current.map(applyPatch));
    setSelected((current) => current ? applyPatch(current) : current);
    setPixGift((current) => current ? applyPatch(current) : current);
  }, []);

  const requestPage = useCallback(async (nextCursor?: string | null, signal?: AbortSignal) => {
    const params = new URLSearchParams(); if (query.trim()) params.set("q", query.trim()); if (category) params.set("category", category); if (price) params.set("price", price); if (nextCursor) params.set("cursor", nextCursor);
    return requestJson<{ gifts: PublicGift[]; nextCursor: string | null; resultCount: number }>(`/api/public/celebracao/gifts?${params}`, { signal });
  }, [query, category, price]);

  const rememberAvailability = useCallback((items: PublicGift[]) => {
    for (const gift of items) availabilityByGift.current.set(gift.id, gift.available);
  }, []);

  useEffect(() => {
    if (!wasInvitationActive.current && invitationActive) {
      rememberAvailability(initialGifts);
      setGifts(initialGifts);
      setCursor(initialCursor);
      setReservedCount(stats.reserved);
      setResultCount(stats.total);
      setPixGift((current) => current ? initialGifts.find((gift) => gift.id === current.id) || current : current);
    }
    wasInvitationActive.current = invitationActive;
  }, [initialCursor, initialGifts, invitationActive, rememberAvailability, stats.reserved, stats.total]);

  useEffect(() => {
    if (!didInitializeFilters.current) { didInitializeFilters.current = true; return; }
    setLoading(true); setFilterError(""); setMessage("");
    const controller = new AbortController(); const timer = window.setTimeout(async () => {
      try { const body = await requestPage(null, controller.signal); rememberAvailability(body.gifts); setGifts(body.gifts); setCursor(body.nextCursor); setResultCount(body.resultCount); } catch (error) { if ((error as Error).name !== "AbortError") { const errorMessage = (error as Error).message; setFilterError(errorMessage); setMessage(errorMessage); } } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [rememberAvailability, requestPage]);

  const loadMore = async () => { if (!cursor) return; setLoadingMore(true); try { const body = await requestPage(cursor); rememberAvailability(body.gifts); setGifts((current) => [...current, ...body.gifts]); setCursor(body.nextCursor); setResultCount(body.resultCount); } catch (error) { setMessage((error as Error).message); } finally { setLoadingMore(false); } };
  const applyReservation = async () => {
    if (!selected || !canReserve) return;
    setBusy(selected.id); setMessage(""); setReservationFeedback(null); const cancelling = Boolean(selected.reservation_id);
    try {
      if (cancelling) {
        await cancelGiftReservation(selected.reservation_id!);
        updateGift(selected.id, { available: true, reservation_id: null });
      } else {
        const response = await createGiftReservation(selected.id);
        updateGift(selected.id, { available: false, reservation_id: response.reservationId });
      }
      setReservationFeedback(cancelling ? "cancelled" : "reserved");
    } catch (requestError) {
      if (requestError instanceof HttpRequestError && requestError.status === 409) {
        updateGift(selected.id, { available: false, reservation_id: null });
        setReservationFeedback("conflict");
        return;
      }
      setMessage(requestError instanceof Error ? requestError.message : "Não foi possível atualizar a reserva.");
    } finally {
      setBusy(null);
    }
  };
  const closeReservationPanel = () => { setSelected(null); setReservationFeedback(null); };
  const panel = <div className="space-y-5 py-2">
    {selected && <div className="rounded-xl bg-rose-50 p-4 text-center"><PartyPopper className="mx-auto mb-2 h-7 w-7 text-rose-500" /><p className="font-serif text-lg text-stone-800">{selected.item_name}</p></div>}
    {reservationFeedback === "conflict" ? <div className="space-y-4 text-center" role="alert"><h3 className="font-serif text-xl font-semibold text-stone-800">Este presente acabou de ser escolhido</h3><p className="text-sm leading-relaxed text-stone-600">Outra pessoa concluiu a reserva primeiro. A lista já foi atualizada para você.</p><Button type="button" onClick={closeReservationPanel} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">Ver outros presentes</Button></div>
      : reservationFeedback && selected ? <div className="space-y-4 text-center" role="status" aria-live="polite"><div className="celebration-rsvp-success-icon mx-auto" aria-hidden="true"><Check /></div><div><h3 className="font-serif text-xl font-semibold text-stone-800">{reservationFeedback === "reserved" ? "Presente escolhido com carinho" : "Reserva cancelada"}</h3><p className="mt-2 text-sm leading-relaxed text-stone-600">{reservationFeedback === "reserved" ? "Guardamos este item como a sua escolha. A reserva não confirma compra, pagamento nem presença." : "O presente voltou a ficar disponível para outra pessoa escolher. Isso não cancela nenhum PIX já realizado."}</p></div><Button type="button" onClick={closeReservationPanel} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">Continuar vendo presentes</Button>{reservationFeedback === "reserved" && <Button type="button" variant="outline" onClick={() => void applyReservation()} disabled={busy === selected.id} className="min-h-11 w-full rounded-full">{busy ? "Atualizando…" : "Cancelar minha reserva"}</Button>}</div>
        : canReserve ? <><p className="text-sm leading-relaxed text-stone-600">{selected?.reservation_id ? "Você pode desfazer esta escolha. O presente voltará a aparecer como disponível. Isso não cancela nenhuma transferência." : "Vamos marcar este presente como a sua escolha para evitar itens repetidos. Reservar não confirma compra, pagamento ou presença."}</p><Button onClick={applyReservation} disabled={busy === selected?.id} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">{busy ? "Atualizando…" : selected?.reservation_id ? "Cancelar minha reserva" : "Confirmar escolha"}</Button></>
          : !invitationActive ? <GuestIdentification context="gift" onIdentified={() => onIdentified()} contacts={<ContactActions contacts={contacts} />} />
            : <p className="text-sm leading-relaxed text-stone-600">As reservas não estão disponíveis agora. A lista e o PIX continuam públicos quando habilitados.</p>}
  </div>;

  return <div className="space-y-7">
    <GiftProgressBar total={stats.total} reserved={reservedCount} />
    <CelebrationGiftFilters categories={categories} query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} price={price} onPriceChange={setPrice} resultCount={resultCount} loading={loading} error={filterError} endSentinelRef={giftSectionEndRef} />
    {message && <p className="rounded-xl bg-white p-3 text-center text-sm text-stone-700 shadow-sm" role="status">{message}</p>}
    {loading ? <div className="grid gap-3 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-stone-200" /><div className="h-36 animate-pulse rounded-2xl bg-stone-200" /></div> : gifts.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{gifts.map((gift) => <PublicGiftCard key={gift.id} gift={gift} busy={busy === gift.id} onReserve={(chosenGift) => { setReservationFeedback(null); setSelected(chosenGift); }} onPix={pixEnabled ? (chosenGift) => { setPixGift(chosenGift); setPixOpen(true); } : undefined} />)}</div> : <div className="rounded-2xl border border-stone-100 bg-white px-4 py-14 text-center shadow-sm"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50"><PackageSearch className="h-10 w-10 text-rose-300" /></div><h3 className="font-serif text-xl text-stone-800">Nenhum presente encontrado</h3><p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{query || category || price ? "Tente outro termo ou limpe os filtros." : "A lista de presentes está sendo preparada."}</p>{(query || category || price) && <Button variant="outline" className="mt-5 min-h-11 rounded-full" onClick={() => { setQuery(""); setCategory(null); setPrice(""); }}>Limpar filtros</Button>}</div>}
    {cursor && <div className="text-center"><Button variant="outline" className="min-h-11 rounded-full bg-white" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Carregando…" : "Ver mais presentes"}</Button></div>}
    <div ref={giftSectionEndRef} className="h-px" aria-hidden="true" />
    {isMobile ? <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && closeReservationPanel()}><DrawerContent className="celebration-drawer"><DrawerHeader className="relative pr-16 text-left"><DrawerTitle className="font-serif text-2xl">{reservationFeedback ? "Sua escolha" : selected?.reservation_id ? "Cancelar reserva" : "Confirmar presente"}</DrawerTitle><DrawerDescription>Uma escolha feita com carinho.</DrawerDescription><DrawerCloseControl /></DrawerHeader><div className="celebration-drawer-scroll px-4">{panel}</div></DrawerContent></Drawer> : <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && closeReservationPanel()}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-serif text-2xl">{reservationFeedback ? "Sua escolha" : selected?.reservation_id ? "Cancelar reserva" : "Confirmar presente"}</DialogTitle><DialogDescription>Uma escolha feita com carinho.</DialogDescription></DialogHeader>{panel}</DialogContent></Dialog>}
    <PixPanel open={pixOpen} onOpenChange={(open) => { setPixOpen(open); if (!open) setPixGift(null); }} gift={pixGift} isMobile={isMobile} invitationActive={invitationActive} reservationAvailable={reservationsAvailable} identificationContacts={<ContactActions contacts={contacts} />} onIdentified={onIdentified} onGiftChange={updateGift} />
  </div>;
}

export default function CelebrationPage() {
  const data = useLoaderData<typeof loader>(); const [searchParams] = useSearchParams(); const isMobile = useIsMobile();
  const revalidator = useRevalidator();
  const phase = getCelebrationPhase(data.events, data.renderedAt); const nextEvent = data.events.find((event) => event.starts_at && new Date(event.starts_at).getTime() >= data.renderedAt);
  const [rsvpOpen, setRsvpOpen] = useState(false); const [generalPixOpen, setGeneralPixOpen] = useState(false); const [showScrollTop, setShowScrollTop] = useState(false); const [heroFailed, setHeroFailed] = useState(false);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const refreshIdentity = useCallback(() => revalidator.revalidate(), [revalidator]);
  const contactNumbers = [data.config.contactGabriel, data.config.contactRaabe].filter((value): value is string => Boolean(value));
  const contactActions: ContactAction[] = [
    data.config.contactGabriel ? { name: "Gabriel" as const, href: `https://wa.me/${data.config.contactGabriel.replace(/\D/g, "")}` } : null,
    data.config.contactRaabe ? { name: "Raabe" as const, href: `https://wa.me/${data.config.contactRaabe.replace(/\D/g, "")}` } : null,
  ].filter((value): value is ContactAction => Boolean(value));
  const guidance = data.events.filter((event) => event.dress_code || event.schedule_note);

  useEffect(() => { document.documentElement.dataset.celebration = "active"; const onScroll = () => setShowScrollTop(window.scrollY > 500); window.addEventListener("scroll", onScroll, { passive: true }); return () => { delete document.documentElement.dataset.celebration; window.removeEventListener("scroll", onScroll); }; }, []);
  useEffect(() => { setHeroFailed(false); const image = heroImageRef.current; if (image?.complete && image.naturalWidth === 0) setHeroFailed(true); }, [data.config.heroUrl]);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const share = async () => {
    const shareData = { title: "Gabriel & Raabe — Celebrando o Amor", text: "Celebrando o amor e o novo lar com Gabriel e Raabe. Veja os detalhes e confirme sua presença.", url: data.canonical };
    try {
      if (navigator.share) { await navigator.share(shareData); return; }
      await navigator.clipboard.writeText(data.canonical);
      toast.success("Link da celebração copiado!");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(data.canonical);
        toast.success("Não foi possível abrir o compartilhamento. O link foi copiado.");
      } catch {
        toast.error("Não foi possível compartilhar agora. Copie o endereço da página no navegador.");
      }
    }
  };
  const closeRsvpAndViewDetails = () => {
    setRsvpOpen(false);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    window.setTimeout(() => scrollTo("locais"), delay);
  };

  return <main className="celebration-page min-h-screen bg-stone-50 pb-20 font-sans text-stone-800 selection:bg-rose-100 selection:text-rose-900">
    <span dangerouslySetInnerHTML={{ __html: `<!-- ${DIRECTION_CONTRACT.replace(/--/g, "—")} -->` }} />
    {showScrollTop && <Button variant="outline" size="icon" className="celebration-scroll-top fixed right-5 z-50 h-12 w-12 rounded-full border-stone-200 bg-white/95 shadow-lg" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} aria-label="Voltar ao topo"><ChevronUp className="h-5 w-5" /></Button>}

    <header className={`celebration-romantic-hero ${data.config.heroUrl && !heroFailed ? "has-photo" : ""}`}>
      {data.config.heroUrl && !heroFailed && <img ref={heroImageRef} src={data.config.heroUrl} alt="" width={1600} height={900} sizes="100vw" fetchPriority="high" decoding="async" className="celebration-hero-photo" style={{ objectPosition: `${data.config.heroFocalX}% ${data.config.heroFocalY}%` }} onLoad={(event) => { event.currentTarget.style.opacity = "1"; }} onError={() => setHeroFailed(true)} />}
      <div className="celebration-hero-overlay" />
      <div className="celebration-hero-content relative z-10 mx-auto flex min-h-[82svh] max-w-4xl flex-col items-center justify-center space-y-7 px-5 py-12 text-center text-white">
        <span className="rounded-full border border-white/30 bg-black/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-sm">Celebrando o amor e o novo lar</span>
        <h1 className="celebration-hero-title font-serif font-semibold leading-[0.92] tracking-[-0.03em] drop-shadow-xl">Gabriel <span className="font-normal text-rose-300">&amp;</span> Raabe</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-100 drop-shadow sm:text-lg">{data.config.story || "Estamos construindo nosso lar com muito amor. Sua presença é o nosso maior presente."}</p>
        <div className="w-full max-w-2xl space-y-3 pt-2">
          {data.invitation.active && data.invitation.displayName && <div className="mx-auto flex max-w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm"><Heart className="h-4 w-4 shrink-0 fill-rose-300 text-rose-300" /><span className="max-w-full break-words font-medium">Que bom ter você por aqui, {data.invitation.displayName}.</span></div>}
          <Button onClick={() => setRsvpOpen(true)} className="min-h-14 w-full rounded-full bg-rose-500 px-8 text-base font-semibold text-white shadow-lg hover:-translate-y-0.5 hover:bg-rose-600"><Heart className="mr-2 h-5 w-5 fill-current" />Confirmar presença</Button>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {data.config.pixEnabled && <Button variant="outline" onClick={() => setGeneralPixOpen(true)} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><QrCode className="mr-1.5 h-4 w-4" />PIX</Button>}
            <Button variant="outline" onClick={() => scrollTo("locais")} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><MapPin className="mr-1.5 h-4 w-4" />Locais</Button>
            {guidance.length > 0 && <Button variant="outline" onClick={() => scrollTo("orientacoes")} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><Sparkles className="mr-1.5 h-4 w-4" />Detalhes</Button>}
            {data.config.giftsEnabled && <Button variant="outline" onClick={() => scrollTo("lista-presentes")} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><PartyPopper className="mr-1.5 h-4 w-4" />Presentes</Button>}
            <Button variant="outline" onClick={share} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><Share2 className="mr-1.5 h-4 w-4" />Compartilhar</Button>
          </div>
        </div>
      </div>
    </header>

    {searchParams.get("convite") === "invalido" && <p className="mx-auto mt-5 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-800" role="alert">Este link não está mais ativo. Peça ao casal um novo convite individual.</p>}

    <div className={`relative z-10 mx-auto max-w-5xl space-y-12 px-4 pb-20 sm:space-y-16 sm:pb-24 ${nextEvent?.starts_at ? "-mt-10" : "pt-10 sm:pt-14"}`}>
      {nextEvent?.starts_at && <Countdown targetDate={nextEvent.starts_at} />}

      <section id="locais" className="scroll-mt-24 space-y-7">
        <div className="text-center"><h2 className="celebration-section-heading font-serif font-semibold text-stone-800">{phase === "past" ? "Obrigado por celebrar conosco" : "Onde vamos nos encontrar"}</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">{phase === "past" ? data.config.postEventMessage : data.config.subtitle || "Confira os detalhes publicados pelo casal."}</p></div>
        {data.events.length ? <div className={`grid gap-6 ${data.events.length === 1 ? "place-items-center" : "md:grid-cols-2"}`}>{data.events.map((event) => <article key={event.id} className={`flex w-full flex-col items-center space-y-4 rounded-3xl bg-white p-7 text-center shadow-[0_16px_40px_rgba(120,113,108,0.14)] ${data.events.length === 1 ? "max-w-lg" : ""}`}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><MapPin className="h-6 w-6" /></div><h3 className="font-serif text-xl font-bold text-stone-800">{event.title}</h3><div className="space-y-1 text-stone-600"><p className="flex items-center justify-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-rose-400" />{formatCelebrationDate(event.starts_at) || "Data em breve"}</p>{event.venue_name && <p>{event.venue_name}</p>}{event.address && <address className="mx-auto max-w-xs text-sm not-italic opacity-85">{event.address}</address>}</div>{event.map_url && <Button variant="outline" className="min-h-11 rounded-full border-rose-200 text-rose-700 hover:bg-rose-50" asChild><a href={event.map_url} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" />Ver no mapa</a></Button>}</article>)}</div> : <div className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-10"><CalendarDays className="mx-auto h-8 w-8 text-rose-300" /><p className="mt-3 font-serif text-xl text-stone-700">Novidades em breve</p><p className="mt-1 text-sm text-stone-500">Os próximos detalhes serão publicados pelo casal.</p></div>}
      </section>

      {guidance.length > 0 && <section id="orientacoes" className="scroll-mt-24"><div className="mx-auto max-w-3xl rounded-2xl bg-white p-7 text-center shadow-sm"><h2 className="font-serif text-2xl text-stone-800">Detalhes preparados com carinho</h2><div className="mx-auto my-5 flex w-fit gap-4" aria-hidden="true"><span className="h-10 w-10 rounded-full bg-stone-900 ring-4 ring-stone-50" /><span className="h-10 w-10 rounded-full border border-stone-200 bg-white ring-4 ring-stone-50" /><span className="h-10 w-10 rounded-full bg-stone-400 ring-4 ring-stone-50" /><span className="h-10 w-10 rounded-full bg-[#d4c4b7] ring-4 ring-stone-50" /></div><div className="space-y-3 text-sm leading-relaxed text-stone-600">{guidance.map((event) => <div key={event.id}>{guidance.length > 1 && <h3 className="font-semibold text-stone-800">{event.title}</h3>}{event.dress_code && <p><strong>Orientação:</strong> {event.dress_code}</p>}{event.schedule_note && <p>{event.schedule_note}</p>}</div>)}</div></div></section>}

      <section id="rsvp" className="rounded-3xl bg-rose-50 px-5 py-7 text-center sm:px-10 sm:py-10"><Heart className="mx-auto h-7 w-7 fill-rose-400 text-rose-400" /><h2 className="celebration-section-heading mt-3 font-serif text-stone-800">Sua presença é o melhor presente</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{data.invitation.active && data.invitation.displayName ? `Que bom ter você por aqui, ${data.invitation.displayName}. Conte pra gente se você vem celebrar conosco.` : "Conte pra gente seu nome completo para responder de forma privada."}</p><Button onClick={() => setRsvpOpen(true)} className="mt-5 min-h-12 rounded-full bg-rose-500 px-8 text-white hover:bg-rose-600 sm:mt-6">Confirmar presença</Button>{data.invitation.active && <Form method="post" action="/celebracao/sair" className="mt-4"><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"><LogOut className="h-4 w-4" />Não é você? Trocar nome</button></Form>}</section>

      {data.config.giftsEnabled && <section id="lista-presentes" className="scroll-mt-24 space-y-7 sm:space-y-8"><div className="text-center"><h2 className="celebration-section-heading font-serif text-stone-800">Lista de presentes</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">Escolha um item se quiser nos ajudar a construir esse novo lar.</p></div><GiftSection initialGifts={data.gifts} initialCursor={data.giftCursor} categories={data.categories} stats={data.giftStats} canReserve={data.invitation.active && data.config.reservationsEnabled && phase !== "past"} reservationsAvailable={data.config.reservationsEnabled && phase !== "past"} invitationActive={data.invitation.active} pixEnabled={data.config.pixEnabled} contacts={contactActions} onIdentified={refreshIdentity} /></section>}

      {data.config.pixEnabled && <section className="rounded-3xl bg-emerald-50 px-6 py-8 text-center sm:py-10"><QrCode className="mx-auto h-8 w-8 text-emerald-700" /><h2 className="celebration-section-heading mt-3 font-serif text-stone-800">Uma contribuição livre</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-600">Se fizer sentido para você, gere um PIX seguro. Ele é opcional, não escolhe nenhum presente e é independente do RSVP.</p><Button onClick={() => setGeneralPixOpen(true)} className="mt-5 min-h-12 rounded-full bg-emerald-700 px-8 text-white hover:bg-emerald-800 sm:mt-6">Abrir PIX livre</Button></section>}

      {contactNumbers.length > 0 && <section id="contato" className="border-t border-stone-200 py-12 text-center"><h2 className="font-serif text-2xl text-stone-800">Ficou com alguma dúvida?</h2><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{contactNumbers.map((number, index) => <Button key={`${number}-${index}`} variant="outline" className="min-h-12 rounded-full border-green-200 text-green-800 hover:bg-green-50" asChild><a href={`https://wa.me/${number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">Falar com {index === 0 ? "Gabriel" : "Raabe"}<ExternalLink className="ml-2 h-4 w-4" /></a></Button>)}</div></section>}
    </div>

    <footer className="celebration-footer border-t border-stone-200 pt-8 text-center text-xs text-stone-500"><p>Feito com <Heart className="mx-1 inline h-3.5 w-3.5 fill-rose-400 text-rose-400" /> por Nós Dois</p></footer>
    <RsvpPanel open={rsvpOpen} onOpenChange={setRsvpOpen} isMobile={isMobile} active={data.invitation.active}><RsvpContent events={data.events} responses={data.invitation.responses} general={data.invitation.general} active={data.invitation.active} enabled={data.config.rsvpEnabled && phase !== "past"} open={rsvpOpen} contacts={contactActions} onRefresh={refreshIdentity} onViewDetails={closeRsvpAndViewDetails} /></RsvpPanel>
    <PixPanel open={generalPixOpen} onOpenChange={setGeneralPixOpen} gift={null} isMobile={isMobile} />
  </main>;
}

export function ErrorBoundary() {
  return <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-5 text-center"><Heart className="h-10 w-10 text-rose-300" /><h1 className="mt-4 font-serif text-3xl text-stone-800">Não conseguimos abrir a celebração.</h1><p className="mt-2 text-stone-600">Tente novamente em alguns instantes.</p><Button asChild className="mt-6 rounded-full bg-rose-500 text-white"><Link to="/celebracao">Recarregar a página</Link></Button></main>;
}
