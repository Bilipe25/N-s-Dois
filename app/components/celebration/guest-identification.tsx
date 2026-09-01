import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HttpRequestError, requestJson } from "@/lib/http.client";
import { GuestCountStepper } from "@/components/celebration/guest-count-stepper";
import { cleanGuestName } from "@/lib/guest-name";
import { publicIdentificationStep, type IdentificationStatus, type IdentificationStep } from "@/lib/guest-identification-state";
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

async function identifyGuest(name: string) {
  return requestJson<{ status: IdentificationStatus }>("/api/public/celebracao/rsvp/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function GuestIdentification({
  context = "rsvp",
  onIdentified,
  contacts,
  publicAdultLimit = 6,
  publicChildLimit = 6,
}: Props) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<IdentificationStep>("identify");
  const [status, setStatus] = useState<"confirmado" | "recusado">(publicAdultLimit > 0 ? "confirmado" : "recusado");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const focusNameAfterRenderRef = useRef(false);

  useEffect(() => {
    if (step !== "identify" || !focusNameAfterRenderRef.current) return;
    focusNameAfterRenderRef.current = false;
    nameInputRef.current?.focus();
  }, [step]);

  async function continueFromIdentification(result: { status: IdentificationStatus }) {
    if (result.status === "found") {
      await onIdentified({ kind: "identified" });
      return;
    }
    setStep(publicIdentificationStep(result.status));
  }

  async function identify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await continueFromIdentification(await identifyGuest(name));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não conseguimos continuar agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function recoverRegistrationConflict(requestError: HttpRequestError) {
    if (requestError.data.status === "ambiguous") {
      setStep("ambiguous");
      return;
    }

    try {
      const result = await identifyGuest(name);
      if (result.status === "not_found") {
        setStep("register");
        setError("Não conseguimos continuar agora. Tente novamente.");
        return;
      }
      await continueFromIdentification(result);
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : "Não conseguimos continuar agora. Tente novamente.");
    }
  }

  async function register(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const responseDraft = {
      status,
      confirmedAdults: status === "recusado" ? 0 : Math.min(adults, publicAdultLimit),
      confirmedChildren: status === "recusado" ? 0 : Math.min(children, publicChildLimit),
    };
    try {
      await requestJson("/api/public/celebracao/rsvp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...responseDraft, message, phone }),
      });
      await onIdentified({ kind: "registered", response: responseDraft });
    } catch (requestError) {
      if (requestError instanceof HttpRequestError && requestError.status === 409) {
        await recoverRegistrationConflict(requestError);
      } else {
        setError(requestError instanceof Error ? requestError.message : "Não conseguimos confirmar sua resposta agora. Tente novamente.");
      }
    } finally {
      setBusy(false);
    }
  }

  function editName() {
    focusNameAfterRenderRef.current = true;
    setStep("identify");
    setError("");
  }

  if (step === "ambiguous") {
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="celebration-panel-empty">
          <Search aria-hidden="true" />
          <div>
            <h3 className="font-serif text-xl font-semibold text-stone-800">Precisamos confirmar um detalhe</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">Não conseguimos identificar sua resposta com segurança usando somente esse nome.</p>
          </div>
        </div>
        {contacts}
        <Button type="button" variant="outline" className="min-h-11 w-full rounded-full" onClick={editName}>Usar outro nome</Button>
      </div>
    );
  }

  if (step === "register") {
    const displayName = cleanGuestName(name);
    return (
      <form onSubmit={register} className="space-y-4 py-2">
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-rose-800">Vamos continuar com</p>
            <Button type="button" variant="ghost" className="min-h-11 shrink-0 rounded-full px-3 text-rose-900 hover:bg-rose-100" onClick={editName}>Editar nome</Button>
          </div>
          <strong className="mt-1 block break-words font-serif text-xl leading-tight">{displayName}</strong>
          <p className="mt-2 text-xs leading-relaxed text-rose-800">Confira seu nome antes de continuar.</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-800">Você estará presente?</legend>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <Button type="button" disabled={publicAdultLimit < 1} variant={status === "confirmado" ? "default" : "outline"} className={status === "confirmado" ? "min-h-11 bg-rose-500 hover:bg-rose-600" : "min-h-11"} onClick={() => setStatus("confirmado")}>Sim, estarei</Button>
            <Button type="button" variant={status === "recusado" ? "default" : "outline"} className={status === "recusado" ? "min-h-11 bg-stone-800 hover:bg-stone-900" : "min-h-11"} onClick={() => setStatus("recusado")}>Não poderei ir</Button>
          </div>
        </fieldset>

        {status === "confirmado" && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-stone-800">Quem estará com você?</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">Informe o total de pessoas, incluindo você. Você pode informar até {guestLimitText(publicAdultLimit, publicChildLimit)}.</p>
            </div>
            <div className="celebration-counters">
              <GuestCountStepper label="Adultos" value={Math.min(adults, publicAdultLimit)} min={1} max={publicAdultLimit} onChange={setAdults} helperText="Inclua você nesta quantidade." />
              {publicChildLimit > 0 && <GuestCountStepper label="Crianças" value={Math.min(children, publicChildLimit)} min={0} max={publicChildLimit} onChange={setChildren} />}
            </div>
          </div>
        )}

        <label className="block space-y-1 text-sm font-medium text-stone-700">
          WhatsApp <span className="font-normal text-stone-500">opcional e privado</span>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} inputMode="tel" autoComplete="tel" className="h-11 text-base" />
        </label>
        <label className="block space-y-1 text-sm font-medium text-stone-700">
          Mensagem <span className="font-normal text-stone-500">opcional e privada</span>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" />
        </label>
        {error && <p className="celebration-form-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Confirmando…</> : <><Check className="mr-2 h-4 w-4" aria-hidden="true" />Confirmar minha resposta</>}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={identify} className="space-y-4 py-2">
      <p className="text-sm leading-relaxed text-stone-600">{context === "gift" ? "Digite seu nome completo para continuar com este presente." : "Digite seu nome completo para continuar."}</p>
      {context === "gift" && <p className="rounded-xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">Depois de continuar, você voltará para este mesmo presente.</p>}
      <label className="block space-y-2 text-sm font-medium text-stone-800">
        Nome completo
        <Input ref={nameInputRef} autoFocus name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={120} required className="h-12 text-base" placeholder="Seu nome e sobrenome" />
      </label>
      {error && <p className="celebration-form-error" role="alert">{error}</p>}
      <Button type="submit" disabled={busy || name.trim().length < 3} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">
        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Continuando…</> : "Continuar"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-stone-500">{context === "gift" ? "Usamos seu nome apenas para organizar sua escolha com segurança." : "Usamos seu nome apenas para organizar sua resposta com segurança."} A lista de convidados nunca é exibida.</p>
    </form>
  );
}
