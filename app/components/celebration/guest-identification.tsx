import { useState } from "react";
import { Check, Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HttpRequestError, requestJson } from "@/lib/http.client";
import { GuestCountStepper } from "@/components/celebration/guest-count-stepper";
import { guestLimitText } from "@/lib/guest-rsvp";

export type IdentificationResult =
  | { kind: "identified" }
  | {
      kind: "registered";
      response: {
        status: "confirmado" | "recusado";
        confirmedAdults: number;
        confirmedChildren: number;
      };
    };

type Props = {
  context?: "rsvp" | "gift";
  onIdentified: (result: IdentificationResult) => void | Promise<void>;
  contacts?: React.ReactNode;
  publicAdultLimit?: number;
  publicChildLimit?: number;
};

export function GuestIdentification({ context = "rsvp", onIdentified, contacts, publicAdultLimit = 6, publicChildLimit = 6 }: Props) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<"identify" | "not_found" | "register" | "ambiguous">("identify");
  const [status, setStatus] = useState<"confirmado" | "recusado">(publicAdultLimit > 0 ? "confirmado" : "recusado");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function identify(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = await requestJson<{ status: "found" | "ambiguous" | "not_found" }>("/api/public/celebracao/rsvp/identify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
      });
      if (body.status === "found") { await onIdentified({ kind: "identified" }); return; }
      setStep(body.status === "ambiguous" ? "ambiguous" : "not_found");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível verificar seu nome.");
    } finally {
      setBusy(false);
    }
  }

  async function register(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const responseDraft = {
      status,
      confirmedAdults: status === "recusado" ? 0 : adults,
      confirmedChildren: status === "recusado" ? 0 : children,
    };
    try {
      await requestJson("/api/public/celebracao/rsvp/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...responseDraft, message, phone }),
      });
      await onIdentified({ kind: "registered", response: responseDraft });
    } catch (requestError) {
      if (requestError instanceof HttpRequestError && requestError.status === 409) {
        setStep(requestError.data.status === "ambiguous" ? "ambiguous" : "identify");
      }
      setError(requestError instanceof Error ? requestError.message : "Não foi possível registrar sua resposta.");
    } finally {
      setBusy(false);
    }
  }

  const reset = () => { setStep("identify"); setError(""); };

  if (step === "ambiguous") return <div className="space-y-4 py-2 text-center">
    <div className="celebration-panel-empty"><Search /><p>Encontramos mais de um cadastro com esse nome. Para proteger os dados, fale com o casal e confirme qual é o seu.</p></div>
    {contacts}
    <Button type="button" variant="outline" className="min-h-11 w-full rounded-full" onClick={reset}>Tentar outro nome</Button>
  </div>;

  if (step === "not_found") return <div className="space-y-4 py-2 text-center">
    <div className="celebration-panel-empty"><UserPlus /><p>Não encontramos esse nome na lista, mas você ainda pode responder com carinho por aqui.</p></div>
    <Button type="button" className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600" onClick={() => setStep("register")}>Confirmar mesmo assim</Button>
    <Button type="button" variant="outline" className="min-h-11 w-full rounded-full" onClick={reset}>Tentar outro nome</Button>
  </div>;

  if (step === "register") return <form onSubmit={register} className="space-y-4 py-2">
    <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-900"><strong className="block text-rose-950">{name}</strong>Seu cadastro ficará sinalizado para revisão do casal.</div>
    <fieldset className="space-y-2"><legend className="text-sm font-medium text-stone-800">Você estará presente?</legend><div className="grid grid-cols-2 gap-2">
      <Button type="button" disabled={publicAdultLimit < 1} variant={status === "confirmado" ? "default" : "outline"} className={status === "confirmado" ? "min-h-11 bg-rose-500 hover:bg-rose-600" : "min-h-11"} onClick={() => setStatus("confirmado")}>Sim</Button>
      <Button type="button" variant={status === "recusado" ? "default" : "outline"} className={status === "recusado" ? "min-h-11 bg-stone-800 hover:bg-stone-900" : "min-h-11"} onClick={() => setStatus("recusado")}>Não poderei ir</Button>
    </div></fieldset>
    {status === "confirmado" && <><p className="text-left text-xs leading-relaxed text-stone-500">Você pode informar até {guestLimitText(publicAdultLimit, publicChildLimit)}. O casal poderá revisar os dados depois.</p><div className="celebration-counters">
      <GuestCountStepper label="Adultos" value={Math.min(adults, publicAdultLimit)} min={1} max={publicAdultLimit} onChange={setAdults} helperText="Inclua você nesta quantidade." />
      {publicChildLimit > 0 && <GuestCountStepper label="Crianças" value={Math.min(children, publicChildLimit)} min={0} max={publicChildLimit} onChange={setChildren} />}
    </div></>}
    <label className="block space-y-1 text-sm font-medium text-stone-700">WhatsApp <span className="font-normal text-stone-500">opcional e privado</span><Input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} inputMode="tel" className="h-11 text-base" /></label>
    <label className="block space-y-1 text-sm font-medium text-stone-700">Mensagem <span className="font-normal text-stone-500">opcional e privada</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" /></label>
    {error && <p className="celebration-form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={busy} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registrando…</> : <><Check className="mr-2 h-4 w-4" />Registrar minha resposta</>}</Button>
  </form>;

  return <form onSubmit={identify} className="space-y-4 py-2">
    <p className="text-sm leading-relaxed text-stone-600">{context === "gift" ? "Antes de escolher este presente, diga seu nome completo." : "Digite seu nome completo para encontrarmos sua resposta."}</p>
    {context === "gift" && <p className="rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">Depois de encontrar seu nome, você voltará para este mesmo presente.</p>}
    <label className="block space-y-2 text-sm font-medium text-stone-800">Nome completo<Input autoFocus name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={120} required className="h-12 text-base" placeholder="Seu nome e sobrenome" /></label>
    {error && <p className="celebration-form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={busy || name.trim().length < 3} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procurando…</> : "Continuar"}</Button>
    <p className="text-center text-xs leading-relaxed text-stone-500">{context === "gift" ? "Usamos seu nome apenas para guardar esta escolha com segurança. A lista de convidados não é exibida." : "Seu nome é usado apenas para encontrar ou registrar sua resposta. A lista de convidados não é exibida."}</p>
  </form>;
}
