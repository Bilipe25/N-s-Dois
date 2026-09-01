import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, Copy, Loader2, QrCode, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { GuestIdentification } from "@/components/celebration/guest-identification";
import {
  createGiftReservation,
  pixReferenceForGift,
} from "@/lib/gift-reservations";
import { HttpRequestError, requestJson } from "@/lib/http.client";
import type { PublicGift } from "@/schemas/celebration";

const CelebrationQRCode = lazy(() => import("react-qr-code"));

type GiftPatch = Pick<PublicGift, "available" | "reservation_id">;

type PixPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gift: PublicGift | null;
  isMobile: boolean;
  invitationActive?: boolean;
  reservationAvailable?: boolean;
  identificationContacts?: ReactNode;
  onIdentified?: () => void | Promise<void>;
  onGiftChange?: (giftId: string, patch: GiftPatch) => void;
};

type PayloadState = "idle" | "loading" | "error" | "conflict";
type ReservationState = "idle" | "identify" | "saving" | "success" | "error" | "conflict";

function formatCurrency(amountCents: number) {
  return (amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function DrawerCloseControl() {
  return (
    <DrawerClose asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Fechar PIX"
        className="celebration-drawer-close"
      >
        <X className="h-5 w-5" />
      </Button>
    </DrawerClose>
  );
}

export function PixPanel({
  open,
  onOpenChange,
  gift,
  isMobile,
  invitationActive = false,
  reservationAvailable = false,
  identificationContacts,
  onIdentified,
  onGiftChange,
}: PixPanelProps) {
  const [payload, setPayload] = useState("");
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [payloadState, setPayloadState] = useState<PayloadState>("idle");
  const [payloadError, setPayloadError] = useState("");
  const [reservationState, setReservationState] = useState<ReservationState>("idle");
  const [reservationError, setReservationError] = useState("");
  const [copied, setCopied] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const copyTimer = useRef<number | null>(null);

  const ownReservation = Boolean(gift?.reservation_id);
  const unavailableForSpecificPix = Boolean(gift && !gift.available && !gift.reservation_id);
  const shownAmount = amountCents ?? gift?.price_cents ?? null;

  useEffect(() => {
    if (!open) {
      setPayload("");
      setAmountCents(null);
      setPayloadState("idle");
      setPayloadError("");
      setReservationState("idle");
      setReservationError("");
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setReservationState("idle");
    setReservationError("");
  }, [open, gift?.id]);

  useEffect(() => {
    if (!open) return;
    if (unavailableForSpecificPix) {
      setPayload("");
      setAmountCents(null);
      setPayloadState("conflict");
      return;
    }

    const controller = new AbortController();
    setPayload("");
    setAmountCents(null);
    setPayloadError("");
    setPayloadState("loading");

    requestJson<{ payload: string; amountCents?: number | null }>(
      "/api/public/celebracao/pix-payload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pixReferenceForGift(gift)),
        signal: controller.signal,
      },
    )
      .then((body) => {
        setPayload(body.payload);
        setAmountCents(body.amountCents ?? null);
        setPayloadState("idle");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof HttpRequestError && error.status === 409 && gift) {
          setPayloadState("conflict");
          onGiftChange?.(gift.id, { available: false, reservation_id: null });
          return;
        }
        if (error instanceof HttpRequestError && error.status === 404 && gift?.reservation_id) {
          onGiftChange?.(gift.id, { available: true, reservation_id: null });
          return;
        }
        setPayloadError(error instanceof Error ? error.message : "Não foi possível gerar o PIX agora.");
        setPayloadState("error");
      });

    return () => controller.abort();
  }, [gift?.available, gift?.id, gift?.reservation_id, onGiftChange, open, retryToken, unavailableForSpecificPix]);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  async function copyPayload() {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      toast.error("Não foi possível copiar o código. Tente selecionar o PIX no seu banco.");
    }
  }

  async function reserveCurrentGift() {
    if (!gift || !reservationAvailable || gift.reservation_id) return;
    setReservationState("saving");
    setReservationError("");
    try {
      const response = await createGiftReservation(gift.id);
      onGiftChange?.(gift.id, { available: false, reservation_id: response.reservationId });
      setReservationState("success");
    } catch (error) {
      if (error instanceof HttpRequestError && error.status === 401) {
        setReservationError("Sua identificação expirou. Digite seu nome novamente para continuar.");
        setReservationState("identify");
        return;
      }
      if (error instanceof HttpRequestError && error.status === 409) {
        setPayload("");
        setPayloadState("conflict");
        setReservationState("conflict");
        onGiftChange?.(gift.id, { available: false, reservation_id: null });
        return;
      }
      setReservationError(error instanceof Error ? error.message : "Não foi possível reservar este presente agora.");
      setReservationState("error");
    }
  }

  async function continueAfterIdentification() {
    await onIdentified?.();
    await reserveCurrentGift();
  }

  function beginReservation() {
    if (invitationActive) {
      void reserveCurrentGift();
      return;
    }
    setReservationError("");
    setReservationState("identify");
  }

  const conflict = payloadState === "conflict" || reservationState === "conflict";

  const giftSummary = gift ? (
    <section className="w-full rounded-2xl bg-rose-50 p-4 text-center" aria-labelledby="pix-gift-name">
      <p className="text-sm text-rose-800">Você está contribuindo para</p>
      <h3 id="pix-gift-name" className="mt-1 break-words font-serif text-xl font-semibold text-stone-800">
        {gift.item_name}
      </h3>
      {shownAmount !== null ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-rose-800">Valor incluído no código</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-stone-900">{formatCurrency(shownAmount)}</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-900">Confirme o valor no aplicativo do seu banco antes de transferir.</p>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-base font-semibold text-stone-900">Valor livre</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-900">
            {gift.price_range ? `A faixa “${gift.price_range}” é apenas uma referência. Escolha o valor no seu banco.` : "Escolha o valor no aplicativo do seu banco."}
          </p>
        </div>
      )}
    </section>
  ) : (
    <section className="w-full rounded-2xl bg-emerald-50 p-4 text-center">
      <h3 className="font-serif text-xl font-semibold text-stone-800">Presente livre por PIX</h3>
      <p className="mt-2 text-sm leading-relaxed text-emerald-900">Escolha o valor no aplicativo do seu banco. Esta contribuição não cria reserva.</p>
    </section>
  );

  const ownReservationNotice = gift && ownReservation ? (
    <div className="w-full rounded-2xl bg-emerald-50 p-4 text-center" role="status" aria-live="polite">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-700 shadow-sm" aria-hidden="true">
        <Check className="h-5 w-5" />
      </div>
      <p className="mt-3 font-semibold text-emerald-900">
        {reservationState === "success" ? "Presente reservado" : "Este presente já está reservado por você"}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-900">Agora ele aparece como sua escolha. O PIX continua disponível abaixo.</p>
    </div>
  ) : null;

  const payloadContent = (
    <>
      {payloadState === "loading" && (
        <div className="flex min-h-48 items-center justify-center gap-2 text-stone-600" role="status">
          <Loader2 className="h-5 w-5 animate-spin" />Gerando PIX…
        </div>
      )}
      {payloadState === "error" && (
        <div className="celebration-panel-empty w-full" role="alert">
          <QrCode aria-hidden="true" />
          <p>{payloadError || "O PIX não está disponível agora."}</p>
          <Button type="button" variant="outline" onClick={() => setRetryToken((value) => value + 1)} className="min-h-11 rounded-full">
            <RotateCcw className="mr-2 h-4 w-4" />Tentar novamente
          </Button>
        </div>
      )}
      {payload && (
        <div className="flex w-full flex-col items-center gap-4">
          <figure className="text-center" aria-labelledby="pix-qr-caption">
            <div className="rounded-2xl bg-white p-4 shadow-sm" role="img" aria-label="QR Code PIX para abrir no aplicativo do banco">
              <Suspense fallback={<div className="h-[180px] w-[180px] animate-pulse rounded-xl bg-stone-100" aria-label="Carregando QR Code" />}>
                <CelebrationQRCode value={payload} size={180} bgColor="#ffffff" fgColor="#1c1917" level="M" />
              </Suspense>
            </div>
            <figcaption id="pix-qr-caption" className="mt-2 text-xs leading-relaxed text-stone-500">Escaneie no aplicativo do seu banco ou copie o código abaixo.</figcaption>
          </figure>
          {!gift && <p className="text-center text-sm text-stone-600">Contribuição livre: informe o valor no seu banco.</p>}
          <Button type="button" onClick={copyPayload} className="min-h-12 w-full rounded-full bg-stone-900 text-white hover:bg-stone-800">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Código copiado" : "Copiar PIX Copia e Cola"}
          </Button>
          <span className="sr-only" role="status" aria-live="polite">{copied ? "Código PIX copiado para a área de transferência." : ""}</span>
          <p className="text-center text-xs leading-relaxed text-stone-500">O site gera o código, mas não processa nem confirma automaticamente a transferência.</p>
        </div>
      )}
    </>
  );

  const reservationContent = gift && !ownReservation && !conflict ? (
    <section className="w-full border-t border-stone-200 pt-5" aria-labelledby="pix-reservation-title">
      <div className="text-center">
        <h3 id="pix-reservation-title" className="font-serif text-lg font-semibold text-stone-800">Quer deixar este presente marcado como sua escolha?</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">Assim outras pessoas saberão que ele já foi escolhido. A reserva não confirma a transferência.</p>
      </div>

      {!reservationAvailable ? (
        <p className="mt-4 rounded-xl bg-stone-50 p-3 text-center text-sm leading-relaxed text-stone-600">As reservas estão pausadas agora. Você ainda pode usar o PIX sem marcar este item.</p>
      ) : reservationState === "identify" ? (
        <div className="mt-4">
          {reservationError && <p className="celebration-form-error" role="alert">{reservationError}</p>}
          <GuestIdentification context="gift" onIdentified={continueAfterIdentification} contacts={identificationContacts} />
        </div>
      ) : reservationState === "error" ? (
        <div className="mt-4 space-y-3 text-center" role="alert">
          <p className="text-sm leading-relaxed text-rose-800">{reservationError}</p>
          <Button type="button" variant="outline" onClick={() => void reserveCurrentGift()} className="min-h-11 w-full rounded-full">Tentar reservar novamente</Button>
        </div>
      ) : (
        <Button type="button" onClick={beginReservation} disabled={reservationState === "saving"} className="mt-4 min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">
          {reservationState === "saving" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reservando…</> : "Reservar este presente para mim"}
        </Button>
      )}
    </section>
  ) : null;

  const content = conflict ? (
    <div className="space-y-4 py-4 text-center" role="alert">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-stone-100 text-stone-700"><QrCode className="h-6 w-6" aria-hidden="true" /></div>
      <div>
        <h3 className="font-serif text-xl font-semibold text-stone-800">Este presente acabou de ser escolhido</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">Para evitar contribuições duplicadas, o PIX específico não está mais disponível. O PIX geral continua aberto na página.</p>
      </div>
      <Button type="button" onClick={() => onOpenChange(false)} className="min-h-12 w-full rounded-full bg-rose-500 text-white hover:bg-rose-600">Ver outros presentes</Button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-5 py-2">
      {giftSummary}
      {gift && (
        <div className="w-full rounded-xl bg-stone-100 p-3 text-sm leading-relaxed text-stone-700">
          <p className="font-semibold text-stone-900">PIX e escolha são passos diferentes</p>
          <p className="mt-1">O PIX cria o código de transferência. A reserva marca este item como sua escolha.</p>
        </div>
      )}
      {ownReservationNotice}
      {payloadContent}
      {reservationContent}
    </div>
  );

  const title = gift ? "Presentear por PIX" : "Presente livre por PIX";
  const description = gift
    ? "Contribua usando este presente como referência."
    : "Gere um código PIX sem escolher um item da lista.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="celebration-drawer">
          <DrawerHeader className="relative px-16">
            <DrawerTitle className="font-serif text-2xl">{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
            <DrawerCloseControl />
          </DrawerHeader>
          <div className="celebration-drawer-scroll px-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
