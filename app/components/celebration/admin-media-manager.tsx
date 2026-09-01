import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Crosshair,
  ImageIcon,
  Loader2,
  Monitor,
  RefreshCcw,
  Share2,
  Smartphone,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase";
import {
  downloadPublicImage,
  formatImageBytes,
  inspectSourceFile,
  processHeroImage,
  processOgImage,
  type ImageFocalPoint,
  type SourceImageInfo,
} from "@/lib/image-processing.client";

type MediaKind = "hero" | "og";
type BusyState = "inspecting" | "preparing" | "uploading" | "publishing" | "removing" | "saving-focus" | null;
type PendingImage = {
  file: File;
  previewUrl: string;
  info: SourceImageInfo;
  focal: ImageFocalPoint;
};
type PrepareResponse = {
  bucket: string;
  path: string;
  token: string;
  contentType: "image/webp" | "image/jpeg";
  cacheControl: string;
};

type Props = {
  heroUrl: string | null;
  ogUrl: string | null;
  heroFocalX: number;
  heroFocalY: number;
  description: string;
  onChanged: () => Promise<void>;
};

async function mediaRequest<T>(payload: object): Promise<T> {
  const response = await fetch("/api/admin/celebracao/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação de mídia.");
  return body as T;
}

function statusCopy(state: BusyState) {
  if (state === "inspecting") return "Conferindo imagem…";
  if (state === "preparing") return "Preparando imagem…";
  if (state === "uploading") return "Enviando foto…";
  if (state === "publishing") return "Publicando…";
  if (state === "removing") return "Removendo…";
  if (state === "saving-focus") return "Salvando enquadramento…";
  return null;
}

function FocalMarker({ focal }: { focal: ImageFocalPoint }) {
  return <span
    className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
    style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
    aria-hidden="true"
  />;
}

function RemoveImageAction({ label, busy, onRemove }: { label: string; busy: boolean; onRemove: () => void }) {
  return <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" variant="outline" disabled={busy} className="min-h-11 border-stone-200 text-stone-700">
        <Trash2 className="mr-2 h-4 w-4" />{label}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent className="max-w-md rounded-2xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Remover a imagem publicada?</AlertDialogTitle>
        <AlertDialogDescription>A página passará a usar o fallback visual oficial. Esta ação não altera os demais conteúdos.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="min-h-11">Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onRemove} className="min-h-11 bg-rose-600 hover:bg-rose-700">Remover imagem</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

function PendingPreview({
  kind,
  pending,
  busy,
  onFocalChange,
  onUse,
  onChooseAnother,
  onCancel,
}: {
  kind: MediaKind;
  pending: PendingImage;
  busy: boolean;
  onFocalChange: (focal: ImageFocalPoint) => void;
  onUse: () => void;
  onChooseAnother: () => void;
  onCancel: () => void;
}) {
  const updateFocal = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onFocalChange({
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
    });
  };
  return <div className="mt-5 space-y-4 border-t border-stone-200 pt-5">
    <div>
      <h4 className="font-medium text-stone-900">Nova imagem</h4>
      <p className="mt-1 text-sm text-stone-600">Confira antes de publicar. Nenhum arquivo foi enviado ainda.</p>
    </div>
    <button
      type="button"
      onClick={kind === "og" ? updateFocal : undefined}
      className={`relative block w-full overflow-hidden rounded-xl bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 ${kind === "og" ? "aspect-[1200/630] cursor-crosshair" : "aspect-video cursor-default"}`}
      aria-label={kind === "og" ? "Escolher o centro do recorte da imagem de compartilhamento" : "Prévia da nova foto principal"}
    >
      <img src={pending.previewUrl} alt="Prévia local selecionada" className="h-full w-full object-cover" style={{ objectPosition: `${pending.focal.x}% ${pending.focal.y}%` }} />
      {kind === "og" && <FocalMarker focal={pending.focal} />}
    </button>
    {kind === "og" && <p className="flex items-center gap-2 text-xs leading-relaxed text-stone-600"><Crosshair className="h-4 w-4 shrink-0 text-rose-500" />Toque no ponto que deve ficar no centro do recorte 1200 × 630.</p>}
    <dl className="grid grid-cols-3 gap-2 rounded-xl bg-stone-50 p-3 text-xs">
      <div><dt className="text-stone-500">Formato</dt><dd className="mt-1 font-medium text-stone-800">{pending.info.contentType.replace("image/", "").toUpperCase()}</dd></div>
      <div><dt className="text-stone-500">Dimensão</dt><dd className="mt-1 font-medium tabular-nums text-stone-800">{pending.info.width} × {pending.info.height}</dd></div>
      <div><dt className="text-stone-500">Tamanho</dt><dd className="mt-1 font-medium tabular-nums text-stone-800">{formatImageBytes(pending.info.size)}</dd></div>
    </dl>
    {pending.info.warning && <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{pending.info.warning}</p>}
    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
      <Button type="button" onClick={onUse} disabled={busy} className="min-h-11 bg-stone-900 hover:bg-stone-800">Usar esta imagem</Button>
      <Button type="button" variant="outline" onClick={onChooseAnother} disabled={busy} className="min-h-11">Escolher outra</Button>
      <Button type="button" variant="ghost" onClick={onCancel} disabled={busy} className="min-h-11">Cancelar</Button>
    </div>
  </div>;
}

export function AdminMediaManager({ heroUrl, ogUrl, heroFocalX, heroFocalY, description, onChanged }: Props) {
  const heroInput = useRef<HTMLInputElement>(null);
  const ogInput = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const [pendingHero, setPendingHero] = useState<PendingImage | null>(null);
  const [pendingOg, setPendingOg] = useState<PendingImage | null>(null);
  const [busy, setBusy] = useState<BusyState>(null);
  const [activeKind, setActiveKind] = useState<MediaKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focal, setFocal] = useState<ImageFocalPoint>({ x: heroFocalX, y: heroFocalY });
  const focalChanged = focal.x !== heroFocalX || focal.y !== heroFocalY;
  const busyKind = (kind: MediaKind) => busy !== null && activeKind === kind;

  useEffect(() => setFocal({ x: heroFocalX, y: heroFocalY }), [heroFocalX, heroFocalY]);
  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  const clearPending = (kind: MediaKind) => {
    const pending = kind === "hero" ? pendingHero : pendingOg;
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
      objectUrls.current.delete(pending.previewUrl);
    }
    if (kind === "hero") setPendingHero(null);
    else setPendingOg(null);
  };

  const selectFile = async (kind: MediaKind, file: File | undefined) => {
    if (!file) return;
    setActiveKind(kind);
    setBusy("inspecting");
    setError(null);
    try {
      const info = await inspectSourceFile(file, kind);
      clearPending(kind);
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      const pending = { file, previewUrl, info, focal: { x: 50, y: 50 } };
      if (kind === "hero") setPendingHero(pending);
      else setPendingOg(pending);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "Não foi possível abrir a imagem.");
    } finally {
      setBusy(null);
      setActiveKind(null);
    }
  };

  const uploadProcessed = async (kind: MediaKind, processed: Awaited<ReturnType<typeof processHeroImage>>) => {
    setBusy("uploading");
    const prepared = await mediaRequest<PrepareResponse>({ intent: "prepare", kind });
    try {
      const supabase = createClient();
      const upload = await supabase.storage.from(prepared.bucket).uploadToSignedUrl(prepared.path, prepared.token, processed.blob, {
        contentType: prepared.contentType,
        cacheControl: prepared.cacheControl,
        upsert: false,
      });
      if (upload.error) throw new Error("Não conseguimos enviar esta imagem.");
      setBusy("publishing");
      return await mediaRequest<{ url: string }>({ intent: "finalize", kind, path: prepared.path });
    } catch (error) {
      void mediaRequest({ intent: "discard", kind, path: prepared.path }).catch(() => undefined);
      throw error;
    }
  };

  const publishPending = async (kind: MediaKind) => {
    const pending = kind === "hero" ? pendingHero : pendingOg;
    if (!pending) return;
    setActiveKind(kind);
    setBusy("preparing");
    setError(null);
    try {
      const processed = kind === "hero"
        ? await processHeroImage(pending.file)
        : await processOgImage(pending.file, pending.focal);
      await uploadProcessed(kind, processed);
      clearPending(kind);
      await onChanged();
      toast.success(kind === "hero" ? "Foto principal atualizada ✓" : "Imagem de compartilhamento atualizada ✓");
    } catch (uploadError) {
      const reason = uploadError instanceof Error ? uploadError.message : "Não conseguimos enviar esta imagem.";
      setError(`${reason} Sua imagem anterior continua publicada.`);
    } finally {
      setBusy(null);
      setActiveKind(null);
    }
  };

  const remove = async (kind: MediaKind) => {
    setActiveKind(kind);
    setBusy("removing");
    setError(null);
    try {
      await mediaRequest({ intent: "remove", kind });
      await onChanged();
      toast.success(kind === "hero" ? "Foto principal removida." : "Imagem personalizada removida.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Não foi possível remover a imagem.");
    } finally {
      setBusy(null);
      setActiveKind(null);
    }
  };

  const saveFocus = async () => {
    setActiveKind("hero");
    setBusy("saving-focus");
    setError(null);
    try {
      await mediaRequest({ intent: "update_focus", x: focal.x, y: focal.y });
      await onChanged();
      toast.success("Enquadramento do Hero atualizado.");
    } catch (focusError) {
      setError(focusError instanceof Error ? focusError.message : "Não foi possível salvar o enquadramento.");
    } finally {
      setBusy(null);
      setActiveKind(null);
    }
  };

  const generateOg = async () => {
    if (!heroUrl) return;
    setActiveKind("og");
    setBusy("preparing");
    setError(null);
    try {
      const source = await downloadPublicImage(heroUrl);
      const processed = await processOgImage(source, focal);
      await uploadProcessed("og", processed);
      await onChanged();
      toast.success("Imagem de compartilhamento gerada a partir do Hero ✓");
    } catch (generationError) {
      const reason = generationError instanceof Error ? generationError.message : "Não foi possível gerar a imagem.";
      setError(`${reason} Sua imagem anterior continua publicada.`);
    } finally {
      setBusy(null);
      setActiveKind(null);
    }
  };

  const chooseFocal = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setFocal({
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
    });
  };

  const adjustFocal = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const delta = event.shiftKey ? 10 : 2;
    const directions: Record<string, ImageFocalPoint> = {
      ArrowLeft: { x: -delta, y: 0 }, ArrowRight: { x: delta, y: 0 },
      ArrowUp: { x: 0, y: -delta }, ArrowDown: { x: 0, y: delta },
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    setFocal((current) => ({
      x: Math.min(100, Math.max(0, current.x + direction.x)),
      y: Math.min(100, Math.max(0, current.y + direction.y)),
    }));
  };

  const currentStatus = statusCopy(busy);

  return <Card id="imagens" className="border-stone-200 shadow-sm">
    <CardHeader>
      <CardTitle>Imagens da página</CardTitle>
      <CardDescription>Escolha, confira e publique as imagens da celebração sem precisar lidar com URLs ou formatos técnicos.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-8">
      {currentStatus && <div className="flex min-h-11 items-center gap-3 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white" role="status" aria-live="polite"><Loader2 className="h-4 w-4 animate-spin" />{currentStatus}</div>}
      {error && <div className="rounded-xl bg-rose-50 p-4 text-sm leading-relaxed text-rose-900" role="alert">{error}</div>}

      <section aria-labelledby="hero-media-title" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl"><h3 id="hero-media-title" className="font-serif text-xl font-semibold text-stone-900">Foto principal</h3><p className="mt-1 text-sm leading-relaxed text-stone-600">A fotografia que ocupa o destaque da página pública.</p></div>
          {heroUrl && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Publicada</span>}
        </div>

        {heroUrl ? <div className="space-y-4">
          <button type="button" onClick={chooseFocal} onKeyDown={adjustFocal} className="relative block aspect-video w-full overflow-hidden rounded-xl bg-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2" aria-label="Selecionar o ponto de foco da foto principal. Use as setas para ajustar.">
            <img src={heroUrl} alt="Foto principal publicada" className="h-full w-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
            <FocalMarker focal={focal} />
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h4 className="text-sm font-semibold text-stone-900">Ponto de foco</h4><p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">Toque na parte da foto que deve permanecer em destaque. Também é possível ajustar com as setas do teclado.</p></div>
            <Button type="button" variant="outline" onClick={saveFocus} disabled={!focalChanged || busy !== null} className="min-h-11 shrink-0"><Crosshair className="mr-2 h-4 w-4" />Salvar enquadramento</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <figure><figcaption className="mb-2 flex items-center gap-2 text-xs font-semibold text-stone-700"><Smartphone className="h-4 w-4" />Celular</figcaption><div className="mx-auto aspect-[9/16] w-40 overflow-hidden rounded-xl bg-stone-900"><img src={heroUrl} alt="Prévia do Hero no celular" className="h-full w-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} /></div></figure>
            <figure><figcaption className="mb-2 flex items-center gap-2 text-xs font-semibold text-stone-700"><Monitor className="h-4 w-4" />Desktop</figcaption><div className="aspect-video overflow-hidden rounded-xl bg-stone-900"><img src={heroUrl} alt="Prévia do Hero no desktop" className="h-full w-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} /></div></figure>
          </div>
        </div> : <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-900 px-6 text-center text-stone-200"><div><ImageIcon className="mx-auto h-8 w-8 text-rose-300" /><p className="mt-3 font-serif text-xl">Fallback visual ativo</p><p className="mt-1 text-sm text-stone-400">A página continua completa mesmo sem fotografia.</p></div></div>}

        <input ref={heroInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void selectFile("hero", event.target.files?.[0]); event.currentTarget.value = ""; }} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => heroInput.current?.click()} disabled={busy !== null} className="min-h-11"><Upload className="mr-2 h-4 w-4" />{heroUrl ? "Trocar foto" : "Enviar foto"}</Button>
          {heroUrl && <RemoveImageAction label="Remover foto" busy={busy !== null} onRemove={() => void remove("hero")} />}
        </div>
        {pendingHero && <PendingPreview kind="hero" pending={pendingHero} busy={busyKind("hero")} onFocalChange={(next) => setPendingHero({ ...pendingHero, focal: next })} onUse={() => void publishPending("hero")} onChooseAnother={() => heroInput.current?.click()} onCancel={() => clearPending("hero")} />}
      </section>

      <div className="h-px bg-stone-200" />

      <section aria-labelledby="og-media-title" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl"><h3 id="og-media-title" className="font-serif text-xl font-semibold text-stone-900">Imagem de compartilhamento</h3><p className="mt-1 text-sm leading-relaxed text-stone-600">Usada no WhatsApp e em outras redes ao compartilhar <span className="font-medium text-stone-800">/celebracao</span>.</p></div>
          {ogUrl && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Publicada</span>}
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="aspect-[1200/630] overflow-hidden bg-stone-100"><img src={ogUrl || "/celebration-og.png"} alt="Prévia da imagem de compartilhamento" className="h-full w-full object-cover" /></div>
          <div className="space-y-1 p-4"><p className="font-serif text-lg font-semibold text-stone-900">Gabriel &amp; Raabe — Celebrando o Amor</p><p className="line-clamp-2 text-sm leading-relaxed text-stone-600">{description || "Celebre o amor e o novo lar de Gabriel e Raabe."}</p><p className="pt-1 text-xs font-medium text-stone-500">/celebracao</p></div>
        </div>

        <input ref={ogInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void selectFile("og", event.target.files?.[0]); event.currentTarget.value = ""; }} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[auto_auto_auto] lg:justify-start">
          <Button type="button" variant="outline" onClick={() => ogInput.current?.click()} disabled={busy !== null} className="min-h-11"><Upload className="mr-2 h-4 w-4" />{ogUrl ? "Trocar imagem" : "Enviar imagem"}</Button>
          <Button type="button" variant="outline" onClick={() => void generateOg()} disabled={!heroUrl || busy !== null} className="min-h-11"><RefreshCcw className="mr-2 h-4 w-4" />Gerar a partir do Hero</Button>
          {ogUrl && <RemoveImageAction label="Remover personalizada" busy={busy !== null} onRemove={() => void remove("og")} />}
        </div>
        {!heroUrl && <p className="text-xs leading-relaxed text-stone-500">Publique uma foto principal para habilitar a geração automática do recorte.</p>}
        {pendingOg && <PendingPreview kind="og" pending={pendingOg} busy={busyKind("og")} onFocalChange={(next) => setPendingOg({ ...pendingOg, focal: next })} onUse={() => void publishPending("og")} onChooseAnother={() => ogInput.current?.click()} onCancel={() => clearPending("og")} />}
      </section>

      <p className="flex gap-2 rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-600"><Share2 className="mt-0.5 h-4 w-4 shrink-0 text-stone-700" /><span><strong className="font-semibold text-stone-800">Imagem pública.</strong> Use somente fotos que podem aparecer na página e em compartilhamentos. Metadados desnecessários, como localização EXIF, são removidos durante a otimização.</span></p>
    </CardContent>
  </Card>;
}
