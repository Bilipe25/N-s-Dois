import { useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import QRCode from "react-qr-code";
import { CalendarDays, Check, Copy, ExternalLink, Gift, MapPin, Minus, Plus } from "lucide-react";
import type { Route } from "./+types/celebration";
import { loadCelebration } from "@/services/celebration.server";
import type { CelebrationEvent, InvitationEvent, PublicGift } from "@/schemas/celebration";
import { noStoreHeaders } from "@/lib/security.server";
import { formatCelebrationDate, getCelebrationPhase } from "@/lib/celebration-time";
import "./celebration.css";

const DIRECTION_CONTRACT = `
THESIS: Uma celebração e um novo lar aparecem como um caderno arquitetônico vivido, recusando o template romântico e a loja de presentes.
OWN-WORLD: Marfim de linho, barro queimado, oliva e carvão; grandes campos editoriais, linhas de planta e controles materiais.
STORY: O visitante reconhece Gabriel e Raabe, encontra o próximo encontro, responde ao convite e só depois considera presentes ou PIX.
FIRST VIEWPORT: Título monumental à esquerda, mídia real opcional à direita e um eixo que entra num portal de barro com a ação principal.
FORM: Caderno de materiais do novo lar, terceira direção aterrissada, seed bf92e174; composição A com portal da C.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance`;

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Manrope:wght@400;500;600;700&display=swap",
  },
];

export const meta: Route.MetaFunction = ({ data }) => {
  const loaderData = data as Awaited<ReturnType<typeof loader>> | undefined;
  const title = `${loaderData?.config.title || "Celebrando o Amor e o Novo Lar"} | Gabriel & Raabe`;
  const description = loaderData?.config.subtitle || "Informações da celebração de Gabriel e Raabe, confirmação de presença e lista de presentes opcional.";
  const image = loaderData?.config.ogUrl || loaderData?.config.heroUrl || undefined;
  return [
    { title },
    { name: "description", content: description },
    { name: "theme-color", content: "#F1E4D1" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: loaderData?.canonical || "/celebracao" },
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
  return {
    ...data,
    canonical: `${siteUrl.replace(/\/$/, "")}/celebracao`,
  };
}

function Counter({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (value: number) => void; label: string }) {
  return (
    <div className="celebration-counter">
      <span>{label}</span>
      <div className="celebration-counter-controls">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Diminuir ${label.toLowerCase()}`}><Minus /></button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Aumentar ${label.toLowerCase()}`}><Plus /></button>
      </div>
    </div>
  );
}

type ResponseDraft = InvitationEvent & { message: string };

function RsvpSection({ events, responses, enabled }: { events: CelebrationEvent[]; responses: InvitationEvent[]; enabled: boolean }) {
  const [drafts, setDrafts] = useState<ResponseDraft[]>(() => responses.map((response) => ({ ...response, message: response.private_message || "" })));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  if (!enabled) {
    return <p className="celebration-empty-copy">As confirmações ainda não foram abertas.</p>;
  }
  if (!responses.length) {
    return <p className="celebration-empty-copy">Abra o link individual recebido pelo WhatsApp para responder ao convite. Não usamos pesquisa pública por nomes.</p>;
  }

  const update = (id: string, values: Partial<ResponseDraft>) => {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...values } : draft));
    setState("idle");
  };

  const submit = async () => {
    setState("saving");
    setError("");
    const response = await fetch("/api/public/celebracao/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventResponses: drafts.map((draft) => ({
          eventId: draft.event_id,
          status: draft.status === "recusado" ? "recusado" : "confirmado",
          confirmedAdults: draft.status === "recusado" ? 0 : draft.confirmed_adults,
          confirmedChildren: draft.status === "recusado" ? 0 : draft.confirmed_children,
          message: draft.message,
        })),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error || "Não foi possível salvar. Tente novamente.");
      setState("error");
      return;
    }
    setState("saved");
  };

  return (
    <div className="celebration-rsvp-form">
      {drafts.map((draft) => {
        const event = eventById.get(draft.event_id);
        if (!event) return null;
        const accepted = draft.status !== "recusado";
        const chooseAttendance = (willAttend: boolean, group: HTMLDivElement | null) => {
          update(draft.id, willAttend
            ? { status: "confirmado", confirmed_adults: Math.max(1, draft.confirmed_adults) }
            : { status: "recusado", confirmed_adults: 0, confirmed_children: 0 });
          group?.querySelectorAll<HTMLButtonElement>("[role=radio]")[willAttend ? 0 : 1]?.focus();
        };
        const handleChoiceKeys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault();
          chooseAttendance(event.key === "ArrowLeft" || event.key === "ArrowUp", event.currentTarget.closest(".celebration-choice"));
        };
        return (
          <fieldset key={draft.id} className="celebration-rsvp-event">
            <legend>{event.title}</legend>
            <div className="celebration-choice" role="radiogroup" aria-label={`Resposta para ${event.title}`}>
              <button type="button" role="radio" aria-checked={accepted} tabIndex={accepted ? 0 : -1} className={accepted ? "is-active" : ""} onKeyDown={handleChoiceKeys} onClick={(event) => chooseAttendance(true, event.currentTarget.closest(".celebration-choice"))}>Estarei presente</button>
              <button type="button" role="radio" aria-checked={!accepted} tabIndex={!accepted ? 0 : -1} className={!accepted ? "is-active" : ""} onKeyDown={handleChoiceKeys} onClick={(event) => chooseAttendance(false, event.currentTarget.closest(".celebration-choice"))}>Não poderei ir</button>
            </div>
            {accepted && (
              <div className="celebration-counters">
                <Counter label="Adultos" value={draft.confirmed_adults} min={draft.adult_limit > 0 ? 1 : 0} max={draft.adult_limit} onChange={(value) => update(draft.id, { confirmed_adults: value })} />
                {draft.child_limit > 0 && <Counter label="Crianças" value={draft.confirmed_children} min={0} max={draft.child_limit} onChange={(value) => update(draft.id, { confirmed_children: value })} />}
              </div>
            )}
            <label className="celebration-message">
              <span>Mensagem para o casal <small>opcional e privada</small></span>
              <textarea value={draft.message} maxLength={1000} rows={3} onChange={(event) => update(draft.id, { message: event.target.value })} placeholder="Escreva somente se quiser." />
            </label>
          </fieldset>
        );
      })}
      {error && <p className="celebration-form-error" role="alert">{error}</p>}
      {state === "saved" && <p className="celebration-form-success" role="status"><Check /> Sua resposta foi salva e pode ser alterada por este mesmo convite.</p>}
      <button className="celebration-primary-button" type="button" onClick={submit} disabled={state === "saving"}>{state === "saving" ? "Salvando…" : "Salvar minha resposta"}</button>
    </div>
  );
}

function GiftSection({ initialGifts, initialCursor, canReserve }: { initialGifts: PublicGift[]; initialCursor: string | null; canReserve: boolean }) {
  const [gifts, setGifts] = useState(initialGifts);
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const categories = ["Todos", ...new Set(initialGifts.map((gift) => gift.category).filter((value): value is string => Boolean(value)))];
  const visible = gifts.filter((gift) => (category === "Todos" || gift.category === category) && gift.item_name.toLowerCase().includes(query.toLowerCase()));

  const toggleReservation = async (gift: PublicGift) => {
    setBusy(gift.id);
    setMessage("");
    const cancelling = Boolean(gift.reservation_id);
    const response = await fetch(cancelling ? `/api/public/celebracao/gift-reservations/${gift.reservation_id}` : "/api/public/celebracao/gift-reservations", {
      method: cancelling ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: cancelling ? undefined : JSON.stringify({ giftId: gift.id }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || "Não foi possível atualizar a reserva.");
    else {
      setGifts((current) => current.map((item) => item.id === gift.id ? {
        ...item,
        available: cancelling,
        reservation_id: cancelling ? null : body.reservationId,
      } : item));
      setMessage(cancelling ? "Reserva cancelada." : "Presente reservado. Isso não confirma pagamento nem sua presença.");
    }
    setBusy(null);
  };

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ cursor });
    const response = await fetch(`/api/public/celebracao/gifts?${params}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || "Não foi possível carregar mais presentes.");
    else {
      setGifts((current) => [...current, ...(body.gifts as PublicGift[])]);
      setCursor(body.nextCursor || null);
    }
    setLoadingMore(false);
  };

  return (
    <div>
      <div className="celebration-gift-tools">
        <label><span className="sr-only">Buscar presente</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar presente" /></label>
        <div className="celebration-category-list" role="group" aria-label="Categorias">
          {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </div>
      {message && <p className="celebration-gift-message" role="status">{message}</p>}
      <div className="celebration-gift-list">
        {visible.map((gift) => (
          <article key={gift.id} className="celebration-gift-row">
            <div className="celebration-gift-image">
              {gift.image_url ? <img src={gift.image_url} alt="" loading="lazy" decoding="async" /> : <Gift aria-hidden="true" />}
            </div>
            <div className="celebration-gift-copy">
              <p>{gift.category || "Presente"}</p>
              <h3>{gift.item_name}</h3>
              {gift.price_range && <span>{gift.price_range}</span>}
            </div>
            <div className="celebration-gift-actions">
              {gift.link && <a href={gift.link} target="_blank" rel="noopener noreferrer">Ver sugestão <ExternalLink /></a>}
              <button disabled={!canReserve || (!gift.available && !gift.reservation_id) || busy === gift.id} onClick={() => toggleReservation(gift)}>
                {busy === gift.id ? "Aguarde…" : gift.reservation_id ? "Cancelar minha reserva" : gift.available ? "Quero presentear" : "Já reservado"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && <p className="celebration-empty-copy">Nenhum presente encontrado com estes filtros.</p>}
      {cursor && !query && category === "Todos" && <button className="celebration-load-more" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Carregando…" : "Ver mais presentes"}</button>}
    </div>
  );
}

function PixSection() {
  const [payload, setPayload] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const generate = async () => {
    setState("loading");
    const response = await fetch("/api/public/celebracao/pix-payload", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setState("error");
    setPayload(body.payload);
    setState("idle");
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="celebration-pix-box">
      <div>
        <h3>Uma contribuição livre</h3>
        <p>Se fizer sentido para você, gere o código PIX. Ele não confirma pagamento e não está ligado ao RSVP.</p>
        {!payload && <button type="button" onClick={generate} disabled={state === "loading"}>{state === "loading" ? "Gerando…" : "Gerar código PIX"}</button>}
        {state === "error" && <p role="alert">O PIX não está disponível agora.</p>}
      </div>
      {payload && (
        <div className="celebration-pix-code">
          <QRCode value={payload} size={180} bgColor="#F1E4D1" fgColor="#262720" />
          <button type="button" onClick={copyPayload}><Copy /> {copyState === "copied" ? "Código copiado" : "Copiar código"}</button>
          {copyState === "error" && <p role="alert">Não foi possível copiar. Tente novamente ou use outro navegador.</p>}
        </div>
      )}
    </div>
  );
}

export default function CelebrationPage() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const phase = getCelebrationPhase(data.events);
  const nextEvent = data.events.find((event) => event.starts_at && new Date(event.starts_at).getTime() >= Date.now()) || data.events[0];
  const contactNumbers = [data.config.contactGabriel, data.config.contactRaabe].filter((value): value is string => Boolean(value));

  useEffect(() => {
    document.documentElement.dataset.celebration = "active";
    return () => { delete document.documentElement.dataset.celebration; };
  }, []);

  return (
    <main className="celebration-page">
      <span dangerouslySetInnerHTML={{ __html: `<!-- ${DIRECTION_CONTRACT.replace(/--/g, "—")} -->` }} />
      <section className="celebration-hero" aria-labelledby="celebration-title">
        <nav className="celebration-nav" aria-label="Navegação da celebração">
          <Link className="celebration-mark" to="/celebracao" aria-label="Gabriel e Raabe — início">G &amp; R</Link>
          <div className="celebration-nav-links"><a href="#celebracao">Celebração</a>{data.config.giftsEnabled && <a href="#presentes">Presentes</a>}<a href="#contato">Contato</a></div>
          <a className="celebration-invite-link" href="#rsvp">Nosso convite</a>
        </nav>
        <div className="celebration-hero-layout">
          <div className="celebration-title-block">
            <h1 id="celebration-title">Celebrando<br />o amor e o<br />novo lar</h1>
            <p>Gabriel &amp; Raabe</p>
          </div>
          <div className={`celebration-media ${data.config.heroUrl ? "has-image" : ""}`} aria-hidden={!data.config.heroUrl}>
            {data.config.heroUrl && <img src={data.config.heroUrl} alt="Gabriel e Raabe" fetchPriority="high" style={{ objectPosition: `${data.config.heroFocalX}% ${data.config.heroFocalY}%` }} />}
          </div>
        </div>
        <div className="celebration-axis" aria-hidden="true" />
      </section>

      <section className="celebration-portal-wrap" aria-label="Próximo encontro">
        <div className="celebration-portal">
          <p>{phase === "past" ? "Obrigado por estar perto" : phase === "live" ? "Hoje celebramos juntos" : nextEvent ? formatCelebrationDate(nextEvent.starts_at) || nextEvent.title : "Novidades em breve"}</p>
          <a className="celebration-portal-action" href="#rsvp">{data.invitation.active ? "Responder ao convite" : "Abrir meu convite"}</a>
        </div>
      </section>

      {searchParams.get("convite") === "invalido" && <p className="celebration-invite-error" role="alert">Este link não está mais ativo. Peça ao casal um novo convite individual.</p>}

      <section id="celebracao" className="celebration-section celebration-events-section">
        <div className="celebration-section-heading"><h2>{phase === "past" ? "Este capítulo fica com a gente" : "Onde vamos nos encontrar"}</h2><p>{phase === "past" ? data.config.postEventMessage : data.config.subtitle || "As informações publicadas pelo casal aparecem aqui, sem datas ou endereços de exemplo."}</p></div>
        {data.events.length ? (
          <div className="celebration-event-list">
            {data.events.map((event) => (
              <article key={event.id} className="celebration-event-row">
                <div className="celebration-event-date"><CalendarDays /><span>{formatCelebrationDate(event.starts_at) || "Data em breve"}</span></div>
                <div><h3>{event.title}</h3>{event.venue_name && <p>{event.venue_name}</p>}{event.address && <address>{event.address}</address>}</div>
                {event.map_url && <a href={event.map_url} target="_blank" rel="noopener noreferrer"><MapPin /> Abrir mapa</a>}
              </article>
            ))}
          </div>
        ) : <p className="celebration-empty-copy">Os próximos detalhes chegam em breve.</p>}
      </section>

      <section className="celebration-story-band"><p>{data.config.story}</p></section>

      <section id="rsvp" className="celebration-section celebration-rsvp-section">
        <div className="celebration-section-heading"><h2>Sua presença é o nosso melhor presente</h2><p>Responder leva poucos instantes. A mensagem é privada e você pode voltar pelo mesmo link para alterar a resposta.</p></div>
        <RsvpSection events={data.events} responses={data.invitation.responses} enabled={data.config.rsvpEnabled && phase !== "past"} />
      </section>

      {data.config.giftsEnabled && (
        <section id="presentes" className="celebration-section celebration-gifts-section">
          <div className="celebration-section-heading"><h2>Se quiser nos presentear</h2><p>A lista é apenas uma ajuda. Reservar um item não confirma presença nem pagamento.</p></div>
          <GiftSection initialGifts={data.gifts} initialCursor={data.giftCursor} canReserve={data.invitation.active && data.config.reservationsEnabled && phase !== "past"} />
        </section>
      )}

      {data.config.pixEnabled && <section className="celebration-section celebration-pix-section"><PixSection /></section>}

      <footer id="contato" className="celebration-footer">
        <div><span>G &amp; R</span><p>Celebrando o amor e o novo lar.</p></div>
        <div><h2>Ficou com alguma dúvida?</h2>{contactNumbers.length ? contactNumbers.map((number, index) => <a key={number} href={`https://wa.me/${number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">Falar com {index === 0 ? "Gabriel" : "Raabe"}</a>) : <p>Os contatos serão publicados pelo casal.</p>}</div>
      </footer>
    </main>
  );
}

export function ErrorBoundary() {
  return <main className="celebration-page celebration-error-page"><h1>Não conseguimos abrir a celebração.</h1><p>Tente novamente em alguns instantes.</p><Link to="/celebracao">Recarregar a página</Link></main>;
}
