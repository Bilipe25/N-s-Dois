import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, Link, useLoaderData, useSearchParams } from "react-router";
import QRCode from "react-qr-code";
import {
  CalendarDays, Check, ChevronUp, Copy, ExternalLink, Heart, Loader2,
  MapPin, Minus, Navigation, PackageSearch, PartyPopper, Plus, QrCode,
  LogOut, Share2, ShieldCheck, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./+types/celebration";
import { loadCelebration } from "@/services/celebration.server";
import type { CelebrationEvent, InvitationEvent, PublicGift } from "@/schemas/celebration";
import { noStoreHeaders } from "@/lib/security.server";
import { formatCelebrationDate, getCelebrationPhase } from "@/lib/celebration-time";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Countdown } from "@/components/bridal-shower/countdown";
import { GiftFilter } from "@/components/bridal-shower/gift-filter";
import { GiftProgressBar } from "@/components/bridal-shower/gift-progress-bar";
import { PublicGiftCard } from "@/components/celebration/public-gift-card";
import "./celebration.css";

const DIRECTION_CONTRACT = `
THESIS: A experiência afetiva e fotográfica do commit 9cd5beccb70efb51ed94fbbcaef957f8592dfc3d volta a ser a fonte visual da página pública.
OWN-WORLD: Pedra e marfim, branco, rosa queimado e verde funcional; hero imersivo, serifada romântica, cartões ricos e modais focados.
STORY: A página é completa sem convite; o link individual acrescenta RSVP, reserva identificada e cancelamento.
SECURITY: Os componentes antigos são somente referência visual. Dados e escritas continuam nos contratos seguros de celebracao.
SOURCE: app/routes/public.bridal-shower.tsx e app/components/bridal-shower no commit 9cd5beccb70efb51ed94fbbcaef957f8592dfc3d.`;

export const links: Route.LinksFunction = () => [{
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap",
}];

export const meta: Route.MetaFunction = ({ data }) => {
  const loaderData = data as Awaited<ReturnType<typeof loader>> | undefined;
  const title = `${loaderData?.config.title || "Celebrando o Amor e o Novo Lar"} | Gabriel & Raabe`;
  const description = loaderData?.config.subtitle || "Celebre com Gabriel e Raabe e conheça os detalhes preparados com carinho.";
  const image = loaderData?.config.ogUrl || loaderData?.config.heroUrl || undefined;
  return [
    { title }, { name: "description", content: description }, { name: "theme-color", content: "#f43f5e" },
    { property: "og:type", content: "website" }, { property: "og:title", content: title },
    { property: "og:description", content: description }, { property: "og:url", content: loaderData?.canonical || "/celebracao" },
    ...(image ? [{ property: "og:image", content: image }, { property: "og:image:alt", content: "Gabriel e Raabe" }] : []),
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { tagName: "link", rel: "canonical", href: loaderData?.canonical || "/celebracao" },
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

function ContactActions({ contacts }: { contacts: ContactAction[] }) {
  if (!contacts.length) return null;
  return <div className="flex w-full flex-col gap-2 sm:flex-row">{contacts.map((contact) => (
    <Button key={contact.name} asChild variant="outline" className="min-h-11 flex-1 rounded-full border-green-200 text-green-800 hover:bg-green-50">
      <a href={contact.href} target="_blank" rel="noopener noreferrer">Falar com {contact.name}<ExternalLink className="ml-2 h-4 w-4" /></a>
    </Button>
  ))}</div>;
}

function RsvpContent({ events, responses, active, enabled, contacts }: { events: CelebrationEvent[]; responses: InvitationEvent[]; active: boolean; enabled: boolean; contacts: ContactAction[] }) {
  const [drafts, setDrafts] = useState<ResponseDraft[]>(() => responses.map((response) => ({ ...response, message: response.private_message || "" })));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  if (!active) return <div className="celebration-panel-empty"><ShieldCheck /><p>Para proteger os dados dos nossos convidados, cada confirmação utiliza um link pessoal. Abra o convite que enviamos para você pelo WhatsApp.</p><ContactActions contacts={contacts} /></div>;
  if (!enabled) return <div className="celebration-panel-empty"><Heart /><p>As confirmações ainda não estão abertas.</p></div>;
  if (!responses.length) return <div className="celebration-panel-empty"><Heart /><p>Não há eventos disponíveis para este convite agora.</p></div>;

  const update = (id: string, values: Partial<ResponseDraft>) => { setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...values } : draft)); setState("idle"); };
  const submit = async () => {
    setState("saving"); setError("");
    const response = await fetch("/api/public/celebracao/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventResponses: drafts.map((draft) => ({ eventId: draft.event_id, status: draft.status === "recusado" ? "recusado" : "confirmado", confirmedAdults: draft.status === "recusado" ? 0 : draft.confirmed_adults, confirmedChildren: draft.status === "recusado" ? 0 : draft.confirmed_children, message: draft.message })) }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error || "Não foi possível salvar. Tente novamente."); setState("error"); return; }
    setState("saved");
  };

  return <div className="celebration-rsvp-form">{drafts.map((draft) => {
    const event = eventById.get(draft.event_id); if (!event) return null;
    const accepted = draft.status !== "recusado";
    return <fieldset key={draft.id} className="celebration-rsvp-event"><legend>{event.title}</legend>
      <div className="celebration-choice" role="radiogroup" aria-label={`Resposta para ${event.title}`}>
        <button type="button" role="radio" aria-checked={accepted} className={accepted ? "is-active" : ""} onClick={() => update(draft.id, { status: "confirmado", confirmed_adults: Math.max(1, draft.confirmed_adults) })}>Estarei presente</button>
        <button type="button" role="radio" aria-checked={!accepted} className={!accepted ? "is-active" : ""} onClick={() => update(draft.id, { status: "recusado", confirmed_adults: 0, confirmed_children: 0 })}>Não poderei ir</button>
      </div>
      {accepted && <div className="celebration-counters"><Counter label="Adultos" value={draft.confirmed_adults} min={draft.adult_limit > 0 ? 1 : 0} max={draft.adult_limit} onChange={(value) => update(draft.id, { confirmed_adults: value })} />{draft.child_limit > 0 && <Counter label="Crianças" value={draft.confirmed_children} min={0} max={draft.child_limit} onChange={(value) => update(draft.id, { confirmed_children: value })} />}</div>}
      <label className="celebration-message"><span>Mensagem para o casal <small>opcional e privada</small></span><textarea value={draft.message} maxLength={1000} rows={3} onChange={(event) => update(draft.id, { message: event.target.value })} placeholder="Escreva somente se quiser." /></label>
    </fieldset>;
  })}
    {error && <p className="celebration-form-error" role="alert">{error}</p>}
    {state === "saved" && <p className="celebration-form-success" role="status"><Check /> Sua resposta foi salva e pode ser alterada por este mesmo convite.</p>}
    <Button type="button" onClick={submit} disabled={state === "saving"} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">{state === "saving" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando…</> : "Salvar minha resposta"}</Button>
  </div>;
}

function RsvpPanel({ open, onOpenChange, children, isMobile, active }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; isMobile: boolean; active: boolean }) {
  const description = active ? "Sua resposta é privada e pode ser alterada pelo mesmo convite." : "Cada confirmação utiliza um link pessoal enviado pelo casal.";
  const heading = <><DialogTitle className="font-serif text-2xl text-stone-800">Confirmação de presença</DialogTitle><DialogDescription>{description}</DialogDescription></>;
  if (isMobile) return <Drawer open={open} onOpenChange={onOpenChange}><DrawerContent className="max-h-[92vh]"><DrawerHeader className="text-left"><DrawerTitle className="font-serif text-2xl">Confirmação de presença</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader><div className="overflow-y-auto px-4 pb-8">{children}</div></DrawerContent></Drawer>;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader>{heading}</DialogHeader>{children}</DialogContent></Dialog>;
}

function PixPanel({ open, onOpenChange, gift, isMobile }: { open: boolean; onOpenChange: (open: boolean) => void; gift: PublicGift | null; isMobile: boolean }) {
  const [payload, setPayload] = useState(""); const [amountCents, setAmountCents] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle"); const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) { setPayload(""); setAmountCents(null); setState("idle"); setCopied(false); return; }
    const controller = new AbortController(); setState("loading");
    fetch("/api/public/celebracao/pix-payload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(gift ? { giftId: gift.id } : {}), signal: controller.signal })
      .then(async (response) => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => { if (!response.ok) throw new Error(); setPayload(body.payload); setAmountCents(body.amountCents ?? null); setState("idle"); })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [open, gift]);
  const copy = async () => { try { await navigator.clipboard.writeText(payload); setCopied(true); } catch { toast.error("Não foi possível copiar o código."); } };
  const content = <div className="flex flex-col items-center gap-4 py-2">
    {gift && <div className="w-full rounded-xl border border-rose-100 bg-rose-50 p-3 text-center"><span className="text-xs font-semibold uppercase tracking-wide text-rose-600">Presente selecionado</span><p className="mt-1 font-medium text-stone-800">{gift.item_name}</p></div>}
    {state === "loading" && <div className="flex min-h-56 items-center gap-2 text-stone-600"><Loader2 className="h-5 w-5 animate-spin" />Gerando BR Code…</div>}
    {state === "error" && <div className="celebration-panel-empty"><QrCode /><p>O PIX não está disponível agora. Tente novamente mais tarde.</p></div>}
    {payload && <><div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"><QRCode value={payload} size={180} bgColor="#ffffff" fgColor="#1c1917" level="M" /></div>{amountCents ? <p className="text-sm font-semibold text-stone-700">Valor configurado: {(amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p> : <p className="text-center text-sm text-stone-600">Contribuição livre: informe o valor no aplicativo do seu banco.</p>}<Button onClick={copy} className="min-h-12 w-full rounded-full bg-stone-900 text-white hover:bg-stone-800"><Copy className="mr-2 h-4 w-4" />{copied ? "Código copiado" : "Copiar PIX Copia e Cola"}</Button><p className="text-center text-xs leading-relaxed text-stone-500">O código facilita a transferência, mas o site não processa nem confirma pagamentos.</p></>}
  </div>;
  if (isMobile) return <Drawer open={open} onOpenChange={onOpenChange}><DrawerContent className="max-h-[92vh]"><DrawerHeader><DrawerTitle className="font-serif text-2xl">Presente virtual por PIX</DrawerTitle><DrawerDescription>Escaneie o QR Code ou copie o código com segurança.</DrawerDescription></DrawerHeader><div className="overflow-y-auto px-4 pb-8">{content}</div></DrawerContent></Drawer>;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="text-center font-serif text-2xl">Presente virtual por PIX</DialogTitle><DialogDescription className="text-center">Escaneie o QR Code ou copie o código com segurança.</DialogDescription></DialogHeader>{content}</DialogContent></Dialog>;
}

function GiftSection({ initialGifts, initialCursor, categories, stats, canReserve, invitationActive, pixEnabled, contacts, onPix }: { initialGifts: PublicGift[]; initialCursor: string | null; categories: string[]; stats: { total: number; reserved: number }; canReserve: boolean; invitationActive: boolean; pixEnabled: boolean; contacts: ContactAction[]; onPix: (gift: PublicGift | null) => void }) {
  const [gifts, setGifts] = useState(initialGifts); const [cursor, setCursor] = useState(initialCursor);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState<string | null>(null); const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false); const [loadingMore, setLoadingMore] = useState(false); const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicGift | null>(null); const [message, setMessage] = useState("");
  const [reservedCount, setReservedCount] = useState(stats.reserved);
  const didInitializeFilters = useRef(false);
  const isMobile = useIsMobile();

  const requestPage = useCallback(async (nextCursor?: string | null, signal?: AbortSignal) => {
    const params = new URLSearchParams(); if (query.trim()) params.set("q", query.trim()); if (category) params.set("category", category); if (price) params.set("price", price); if (nextCursor) params.set("cursor", nextCursor);
    const response = await fetch(`/api/public/celebracao/gifts?${params}`, { signal }); const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Não foi possível carregar os presentes."); return body as { gifts: PublicGift[]; nextCursor: string | null };
  }, [query, category, price]);

  useEffect(() => {
    if (!didInitializeFilters.current) { didInitializeFilters.current = true; return; }
    const controller = new AbortController(); const timer = window.setTimeout(async () => {
      setLoading(true); setMessage(""); try { const body = await requestPage(null, controller.signal); setGifts(body.gifts); setCursor(body.nextCursor); } catch (error) { if ((error as Error).name !== "AbortError") setMessage((error as Error).message); } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [requestPage]);

  const loadMore = async () => { if (!cursor) return; setLoadingMore(true); try { const body = await requestPage(cursor); setGifts((current) => [...current, ...body.gifts]); setCursor(body.nextCursor); } catch (error) { setMessage((error as Error).message); } finally { setLoadingMore(false); } };
  const applyReservation = async () => {
    if (!selected || !canReserve) return;
    setBusy(selected.id); setMessage(""); const cancelling = Boolean(selected.reservation_id);
    const response = await fetch(cancelling ? `/api/public/celebracao/gift-reservations/${selected.reservation_id}` : "/api/public/celebracao/gift-reservations", { method: cancelling ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: cancelling ? undefined : JSON.stringify({ giftId: selected.id }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || "Não foi possível atualizar a reserva."); else {
      const patch = { available: cancelling, reservation_id: cancelling ? null : body.reservationId };
      setGifts((current) => current.map((gift) => gift.id === selected.id ? { ...gift, ...patch } : gift));
      setReservedCount((current) => Math.max(0, current + (cancelling ? -1 : 1)));
      setMessage(cancelling ? "Sua reserva foi cancelada." : "Presente reservado. Isso não confirma presença nem pagamento."); setSelected(null);
    }
    setBusy(null);
  };
  const panel = <div className="space-y-5 py-2">{selected && <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-center"><PartyPopper className="mx-auto mb-2 h-7 w-7 text-rose-500" /><p className="font-serif text-lg text-stone-800">{selected.item_name}</p></div>}{canReserve ? <><p className="text-sm leading-relaxed text-stone-600">{selected?.reservation_id ? "Você pode cancelar a sua própria reserva. O item voltará a ficar disponível." : "A reserva fica vinculada ao seu convite. Ela não confirma presença nem pagamento."}</p><Button onClick={applyReservation} disabled={busy === selected?.id} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">{busy ? "Atualizando…" : selected?.reservation_id ? "Cancelar minha reserva" : "Confirmar reserva"}</Button></> : !invitationActive ? <><p className="text-sm leading-relaxed text-stone-600">Para manter sua escolha vinculada ao seu convite, abra o link pessoal que enviamos pelo WhatsApp.</p><ContactActions contacts={contacts} /></> : <p className="text-sm leading-relaxed text-stone-600">As reservas não estão disponíveis agora. A lista e o PIX continuam públicos quando habilitados.</p>}</div>;

  return <div className="space-y-7">
    <GiftProgressBar total={stats.total} reserved={reservedCount} />
    <div className="sticky top-0 z-30 -mx-4 border-b border-stone-200/70 bg-stone-50/95 px-4 py-3 backdrop-blur-md sm:rounded-2xl sm:border">
      <GiftFilter categories={categories} searchTerm={query} onSearchChange={setQuery} selectedCategory={category} onCategorySelect={setCategory} selectedPriceRange={price} onPriceRangeSelect={setPrice} />
    </div>
    {message && <p className="rounded-xl bg-white p-3 text-center text-sm text-stone-700 shadow-sm" role="status">{message}</p>}
    {loading ? <div className="grid gap-3 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-stone-200" /><div className="h-36 animate-pulse rounded-2xl bg-stone-200" /></div> : gifts.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{gifts.map((gift) => <PublicGiftCard key={gift.id} gift={gift} busy={busy === gift.id} onReserve={setSelected} onPix={pixEnabled ? onPix : undefined} />)}</div> : <div className="rounded-2xl border border-stone-100 bg-white px-4 py-14 text-center shadow-sm"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50"><PackageSearch className="h-10 w-10 text-rose-300" /></div><h3 className="font-serif text-xl text-stone-800">Nenhum presente encontrado</h3><p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{query || category || price ? "Tente outro termo ou limpe os filtros." : "A lista de presentes está sendo preparada."}</p>{(query || category || price) && <Button variant="outline" className="mt-5 min-h-11 rounded-full" onClick={() => { setQuery(""); setCategory(null); setPrice(""); }}>Limpar filtros</Button>}</div>}
    {cursor && <div className="text-center"><Button variant="outline" className="min-h-11 rounded-full bg-white" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Carregando…" : "Ver mais presentes"}</Button></div>}
    {isMobile ? <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DrawerContent><DrawerHeader><DrawerTitle className="font-serif text-2xl">{selected?.reservation_id ? "Cancelar reserva" : "Confirmar presente"}</DrawerTitle><DrawerDescription>Uma escolha feita com carinho.</DrawerDescription></DrawerHeader><div className="px-4 pb-8">{panel}</div></DrawerContent></Drawer> : <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-serif text-2xl">{selected?.reservation_id ? "Cancelar reserva" : "Confirmar presente"}</DialogTitle><DialogDescription>Uma escolha feita com carinho.</DialogDescription></DialogHeader>{panel}</DialogContent></Dialog>}
  </div>;
}

export default function CelebrationPage() {
  const data = useLoaderData<typeof loader>(); const [searchParams] = useSearchParams(); const isMobile = useIsMobile();
  const phase = getCelebrationPhase(data.events, data.renderedAt); const nextEvent = data.events.find((event) => event.starts_at && new Date(event.starts_at).getTime() >= data.renderedAt);
  const [rsvpOpen, setRsvpOpen] = useState(false); const [pixOpen, setPixOpen] = useState(false); const [pixGift, setPixGift] = useState<PublicGift | null>(null); const [showScrollTop, setShowScrollTop] = useState(false);
  const contactNumbers = [data.config.contactGabriel, data.config.contactRaabe].filter((value): value is string => Boolean(value));
  const contactActions: ContactAction[] = [
    data.config.contactGabriel ? { name: "Gabriel" as const, href: `https://wa.me/${data.config.contactGabriel.replace(/\D/g, "")}` } : null,
    data.config.contactRaabe ? { name: "Raabe" as const, href: `https://wa.me/${data.config.contactRaabe.replace(/\D/g, "")}` } : null,
  ].filter((value): value is ContactAction => Boolean(value));
  const guidance = data.events.filter((event) => event.dress_code || event.schedule_note);

  useEffect(() => { document.documentElement.dataset.celebration = "active"; const onScroll = () => setShowScrollTop(window.scrollY > 500); window.addEventListener("scroll", onScroll, { passive: true }); return () => { delete document.documentElement.dataset.celebration; window.removeEventListener("scroll", onScroll); }; }, []);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const share = async () => { try { if (navigator.share) await navigator.share({ title: data.config.title, url: data.canonical }); else { await navigator.clipboard.writeText(data.canonical); toast.success("Link da celebração copiado!"); } } catch { /* cancelamento do compartilhamento */ } };
  const openPix = (gift: PublicGift | null = null) => { setPixGift(gift); setPixOpen(true); };

  return <main className="celebration-page min-h-screen bg-stone-50 pb-20 font-sans text-stone-800 selection:bg-rose-100 selection:text-rose-900">
    <span dangerouslySetInnerHTML={{ __html: `<!-- ${DIRECTION_CONTRACT.replace(/--/g, "—")} -->` }} />
    {showScrollTop && <Button variant="outline" size="icon" className="fixed bottom-6 right-5 z-50 h-12 w-12 rounded-full border-stone-200 bg-white/95 shadow-lg" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} aria-label="Voltar ao topo"><ChevronUp className="h-5 w-5" /></Button>}

    <header className={`celebration-romantic-hero ${data.config.heroUrl ? "has-photo" : ""}`}>
      {data.config.heroUrl && <img src={data.config.heroUrl} alt="" fetchPriority="high" className="celebration-hero-photo" style={{ objectPosition: `${data.config.heroFocalX}% ${data.config.heroFocalY}%` }} onLoad={(event) => { event.currentTarget.style.opacity = "1"; }} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
      <div className="celebration-hero-overlay" />
      <div className="relative z-10 mx-auto flex min-h-[82svh] max-w-4xl flex-col items-center justify-center space-y-7 px-5 py-12 text-center text-white">
        <span className="rounded-full border border-white/30 bg-black/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-sm">Celebrando o amor e o novo lar</span>
        <h1 className="font-serif text-[clamp(3.25rem,15vw,7rem)] font-semibold leading-[0.92] tracking-[-0.03em] drop-shadow-xl">Gabriel <span className="font-normal text-rose-300">&amp;</span> Raabe</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-100 drop-shadow sm:text-lg">{data.config.story || "Estamos construindo nosso lar com muito amor. Sua presença é o nosso maior presente."}</p>
        <div className="w-full max-w-2xl space-y-3 pt-2">
          {data.invitation.active && data.invitation.displayName && <div className="mx-auto flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm"><Heart className="h-4 w-4 shrink-0 fill-rose-300 text-rose-300" /><span className="max-w-full break-words font-medium">Olá, {data.invitation.displayName}</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1 text-stone-100"><ShieldCheck className="h-4 w-4" />Seu convite está ativo</span></div>}
          <Button onClick={() => setRsvpOpen(true)} className="min-h-14 w-full rounded-full bg-rose-500 px-8 text-base font-semibold text-white shadow-lg hover:-translate-y-0.5 hover:bg-rose-600"><Heart className="mr-2 h-5 w-5 fill-current" />Confirmar presença</Button>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {data.config.pixEnabled && <Button variant="outline" onClick={() => openPix()} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><QrCode className="mr-1.5 h-4 w-4" />PIX</Button>}
            <Button variant="outline" onClick={() => scrollTo("locais")} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><MapPin className="mr-1.5 h-4 w-4" />Locais</Button>
            {guidance.length > 0 && <Button variant="outline" onClick={() => scrollTo("orientacoes")} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><Sparkles className="mr-1.5 h-4 w-4" />Detalhes</Button>}
            {data.config.giftsEnabled && <Button variant="outline" onClick={() => scrollTo("lista-presentes")} className="min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><PartyPopper className="mr-1.5 h-4 w-4" />Presentes</Button>}
            <Button variant="outline" onClick={share} className="col-span-2 min-h-12 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white sm:col-span-1"><Share2 className="mr-1.5 h-4 w-4" />Compartilhar</Button>
          </div>
        </div>
      </div>
    </header>

    {searchParams.get("convite") === "invalido" && <p className="mx-auto mt-5 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-800" role="alert">Este link não está mais ativo. Peça ao casal um novo convite individual.</p>}

    <div className={`relative z-10 mx-auto max-w-5xl space-y-16 px-4 pb-24 ${nextEvent?.starts_at ? "-mt-10" : "pt-14"}`}>
      {nextEvent?.starts_at && <Countdown targetDate={nextEvent.starts_at} />}

      <section id="locais" className="scroll-mt-24 space-y-7">
        <div className="text-center"><h2 className="font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">{phase === "past" ? "Obrigado por celebrar conosco" : "Onde vamos nos encontrar"}</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">{phase === "past" ? data.config.postEventMessage : data.config.subtitle || "Confira os detalhes publicados pelo casal."}</p></div>
        {data.events.length ? <div className={`grid gap-6 ${data.events.length === 1 ? "place-items-center" : "md:grid-cols-2"}`}>{data.events.map((event) => <article key={event.id} className={`flex w-full flex-col items-center space-y-4 rounded-3xl bg-white p-7 text-center shadow-[0_16px_40px_rgba(120,113,108,0.14)] ${data.events.length === 1 ? "max-w-lg" : ""}`}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><MapPin className="h-6 w-6" /></div><h3 className="font-serif text-xl font-bold text-stone-800">{event.title}</h3><div className="space-y-1 text-stone-600"><p className="flex items-center justify-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-rose-400" />{formatCelebrationDate(event.starts_at) || "Data em breve"}</p>{event.venue_name && <p>{event.venue_name}</p>}{event.address && <address className="mx-auto max-w-xs text-sm not-italic opacity-85">{event.address}</address>}</div>{event.map_url && <Button variant="outline" className="min-h-11 rounded-full border-rose-200 text-rose-700 hover:bg-rose-50" asChild><a href={event.map_url} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" />Ver no mapa</a></Button>}</article>)}</div> : <div className="rounded-3xl bg-white p-10 text-center shadow-sm"><CalendarDays className="mx-auto h-9 w-9 text-rose-300" /><p className="mt-3 font-serif text-xl text-stone-700">Novidades em breve</p><p className="mt-1 text-sm text-stone-500">Os próximos detalhes serão publicados pelo casal.</p></div>}
      </section>

      {guidance.length > 0 && <section id="orientacoes" className="scroll-mt-24"><div className="mx-auto max-w-3xl rounded-2xl bg-white p-7 text-center shadow-sm"><h2 className="font-serif text-2xl text-stone-800">Detalhes preparados com carinho</h2><div className="mx-auto my-5 flex w-fit gap-4" aria-hidden="true"><span className="h-10 w-10 rounded-full bg-stone-900 ring-4 ring-stone-50" /><span className="h-10 w-10 rounded-full border border-stone-200 bg-white ring-4 ring-stone-50" /><span className="h-10 w-10 rounded-full bg-stone-400 ring-4 ring-stone-50" /><span className="h-10 w-10 rounded-full bg-[#d4c4b7] ring-4 ring-stone-50" /></div><div className="space-y-3 text-sm leading-relaxed text-stone-600">{guidance.map((event) => <div key={event.id}>{guidance.length > 1 && <h3 className="font-semibold text-stone-800">{event.title}</h3>}{event.dress_code && <p><strong>Orientção:</strong> {event.dress_code}</p>}{event.schedule_note && <p>{event.schedule_note}</p>}</div>)}</div></div></section>}

      <section id="rsvp" className="rounded-3xl bg-rose-50 px-5 py-10 text-center sm:px-10"><Heart className="mx-auto h-8 w-8 fill-rose-400 text-rose-400" /><h2 className="mt-3 font-serif text-3xl text-stone-800">Sua presença é o nosso melhor presente</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{data.invitation.active && data.invitation.displayName ? `Olá, ${data.invitation.displayName}. Seu convite pessoal está ativo; você pode responder agora ou voltar pelo mesmo link para alterar depois.` : "A confirmação é privada e utiliza o link pessoal enviado pelo casal."}</p><Button onClick={() => setRsvpOpen(true)} className="mt-6 min-h-12 rounded-full bg-rose-500 px-8 text-white hover:bg-rose-600">Confirmar presença</Button>{data.invitation.active && <Form method="post" action="/celebracao/sair" className="mt-4"><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"><LogOut className="h-4 w-4" />Não é o seu convite? Sair deste convite</button></Form>}</section>

      {data.config.giftsEnabled && <section id="lista-presentes" className="scroll-mt-24 space-y-8"><div className="text-center"><h2 className="font-serif text-3xl text-stone-800 sm:text-4xl">Lista de presentes</h2><p className="mt-2 text-stone-600">Escolha um item se quiser nos ajudar a construir esse novo lar.</p></div><GiftSection initialGifts={data.gifts} initialCursor={data.giftCursor} categories={data.categories} stats={data.giftStats} canReserve={data.invitation.active && data.config.reservationsEnabled && phase !== "past"} invitationActive={data.invitation.active} pixEnabled={data.config.pixEnabled} contacts={contactActions} onPix={openPix} /></section>}

      {data.config.pixEnabled && <section className="rounded-3xl bg-emerald-50 px-6 py-10 text-center"><QrCode className="mx-auto h-9 w-9 text-emerald-700" /><h2 className="mt-3 font-serif text-3xl text-stone-800">Uma contribuição livre</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-600">Se fizer sentido para você, gere um PIX seguro. Ele é opcional e independente do RSVP.</p><Button onClick={() => openPix()} className="mt-6 min-h-12 rounded-full bg-emerald-700 px-8 text-white hover:bg-emerald-800">Abrir PIX</Button></section>}

      {contactNumbers.length > 0 && <section id="contato" className="border-t border-stone-200 py-12 text-center"><h2 className="font-serif text-2xl text-stone-800">Ficou com alguma dúvida?</h2><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{contactNumbers.map((number, index) => <Button key={`${number}-${index}`} variant="outline" className="min-h-12 rounded-full border-green-200 text-green-800 hover:bg-green-50" asChild><a href={`https://wa.me/${number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">Falar com {index === 0 ? "Gabriel" : "Raabe"}<ExternalLink className="ml-2 h-4 w-4" /></a></Button>)}</div></section>}
    </div>

    <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-500"><p>Feito com <Heart className="mx-1 inline h-3.5 w-3.5 fill-rose-400 text-rose-400" /> por Nós Dois</p></footer>
    <RsvpPanel open={rsvpOpen} onOpenChange={setRsvpOpen} isMobile={isMobile} active={data.invitation.active}><RsvpContent events={data.events} responses={data.invitation.responses} active={data.invitation.active} enabled={data.config.rsvpEnabled && phase !== "past"} contacts={contactActions} /></RsvpPanel>
    <PixPanel open={pixOpen} onOpenChange={(open) => { setPixOpen(open); if (!open) setPixGift(null); }} gift={pixGift} isMobile={isMobile} />
  </main>;
}

export function ErrorBoundary() {
  return <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-5 text-center"><Heart className="h-10 w-10 text-rose-300" /><h1 className="mt-4 font-serif text-3xl text-stone-800">Não conseguimos abrir a celebração.</h1><p className="mt-2 text-stone-600">Tente novamente em alguns instantes.</p><Button asChild className="mt-6 rounded-full bg-rose-500 text-white"><Link to="/celebracao">Recarregar a página</Link></Button></main>;
}
