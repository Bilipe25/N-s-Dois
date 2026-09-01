import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AdminMediaManager } from "@/components/celebration/admin-media-manager";

type AdminConfig = Record<string, string | number | boolean | null>;
type AdminEvent = { id: string; kind: string; title: string; starts_at: string | null; venue_name: string | null; address: string | null; map_url: string | null; dress_code: string | null; schedule_note: string | null; sort_order: number; state: string };
type AdminData = { config: AdminConfig | null; events: AdminEvent[] };

async function send(payload: object) {
  const response = await fetch("/api/admin/celebracao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Não foi possível salvar.");
}

const text = (value: FormDataEntryValue | null) => String(value || "").trim();
const bool = (form: FormData, name: string) => form.get(name) === "on";

export function CelebrationAdminControlPanel() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/admin/celebracao");
      const body = await response.json();
      if (response.ok) setData(body as AdminData);
      else toast.error(body.error || "A migração aditiva precisa ser aplicada antes de editar esta área.");
    } catch {
      toast.error("Não foi possível atualizar a administração. Verifique sua conexão.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const savePage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await send({
        intent: "update_page",
        title: text(form.get("title")), subtitle: text(form.get("subtitle")), story: text(form.get("story")), postEventMessage: text(form.get("postEventMessage")),
        rsvpEnabled: bool(form, "rsvpEnabled"), publicRsvpAdultLimit: Number(form.get("publicRsvpAdultLimit")), publicRsvpChildLimit: Number(form.get("publicRsvpChildLimit")), giftsEnabled: bool(form, "giftsEnabled"), giftSuggestionsEnabled: bool(form, "giftSuggestionsEnabled"), reservationsEnabled: bool(form, "reservationsEnabled"), pixEnabled: bool(form, "pixEnabled"),
        pixKey: text(form.get("pixKey")), pixRecipientName: text(form.get("pixRecipientName")), pixCity: text(form.get("pixCity")), contactGabriel: text(form.get("contactGabriel")), contactRaabe: text(form.get("contactRaabe")),
      });
      toast.success("Página da celebração atualizada.");
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  };

  const saveEvent = async (event: React.FormEvent<HTMLFormElement>, id?: string) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const localDate = text(form.get("startsAt"));
    setSaving(true);
    try {
      await send({ intent: "upsert_event", id, kind: text(form.get("kind")), title: text(form.get("eventTitle")), startsAt: localDate ? new Date(localDate).toISOString() : null, venueName: text(form.get("venueName")), address: text(form.get("address")), mapUrl: text(form.get("mapUrl")), dressCode: text(form.get("dressCode")), scheduleNote: text(form.get("scheduleNote")), sortOrder: Number(form.get("sortOrder") || 0), state: text(form.get("state")) });
      toast.success(id ? "Evento atualizado." : "Evento criado em segurança.");
      if (!id) event.currentTarget.reset();
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  };

  if (loading) return <Card><CardContent className="flex min-h-28 items-center justify-center" role="status" aria-label="Carregando administração da celebração"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /></CardContent></Card>;
  if (!data?.config) return <Card><CardHeader><CardTitle>Configuração ainda não migrada</CardTitle><CardDescription>A área canônica será habilitada após a migration aditiva. Nenhum valor legado será removido.</CardDescription></CardHeader></Card>;
  const config = data.config;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <a href="#pagina" className="rounded-xl border bg-white p-4 text-sm font-medium">Evento / Página</a>
        <a href="#imagens" className="rounded-xl border bg-white p-4 text-sm font-medium">Imagens</a>
        <a href="#eventos" className="rounded-xl border bg-white p-4 text-sm font-medium">Eventos e locais</a>
        <a href="#presentes" className="rounded-xl border bg-white p-4 text-sm font-medium">Presentes</a>
        <a href="/celebracao" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border bg-stone-900 p-4 text-sm font-medium text-white">Abrir página <ExternalLink className="h-4 w-4" /></a>
      </div>

      <AdminMediaManager
        heroUrl={typeof config.celebration_hero_url === "string" ? config.celebration_hero_url : null}
        ogUrl={typeof config.celebration_og_url === "string" ? config.celebration_og_url : null}
        heroFocalX={typeof config.celebration_hero_focal_x === "number" ? config.celebration_hero_focal_x : 50}
        heroFocalY={typeof config.celebration_hero_focal_y === "number" ? config.celebration_hero_focal_y : 50}
        description={typeof config.celebration_subtitle === "string" ? config.celebration_subtitle : ""}
        onChanged={() => load(false)}
      />

      <Card id="pagina">
        <CardHeader><CardTitle>Evento / Página</CardTitle><CardDescription>Conteúdo, aparência, PIX, contatos e recursos publicados em um só lugar.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={savePage} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título" name="title" defaultValue={config.celebration_title} required />
              <Field label="Subtítulo" name="subtitle" defaultValue={config.celebration_subtitle} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextArea label="Texto da celebração" name="story" defaultValue={config.celebration_story} />
              <TextArea label="Mensagem pós-evento" name="postEventMessage" defaultValue={config.celebration_post_event_message} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Toggle name="rsvpEnabled" label="RSVP" checked={config.celebration_rsvp_enabled === true} />
              <Toggle name="giftsEnabled" label="Presentes" checked={config.celebration_gifts_enabled === true} />
              <Toggle name="reservationsEnabled" label="Reservas" checked={config.celebration_reservations_enabled === true} />
              <Toggle name="pixEnabled" label="PIX" checked={config.celebration_pix_enabled === true} />
            </div>
            <section className="space-y-3 rounded-xl bg-stone-50 p-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">RSVP de novos convidados</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">Limites usados somente quando uma pessoa que não está na lista responde pelo site. Convites cadastrados mantêm seus próprios limites.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Máximo de adultos" name="publicRsvpAdultLimit" defaultValue={config.celebration_public_rsvp_adult_limit ?? 6} type="number" min={0} max={20} />
                <Field label="Máximo de crianças" name="publicRsvpChildLimit" defaultValue={config.celebration_public_rsvp_child_limit ?? 6} type="number" min={0} max={20} />
              </div>
            </section>
            <section id="presentes" className="scroll-mt-24 space-y-3 rounded-xl bg-stone-50 p-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">Apresentação dos presentes</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">Controle o que aparece nos cards sem alterar os links cadastrados.</p>
              </div>
              <Toggle
                name="giftSuggestionsEnabled"
                label="Exibir sugestão online"
                description="Mostra o link externo “Ver sugestão online”. Ao ocultar, os cards ficam mais compactos automaticamente."
                checked={config.bridal_shower_show_links !== false}
              />
            </section>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Chave PIX" name="pixKey" defaultValue={config.pix_key} />
              <Field label="Nome do recebedor" name="pixRecipientName" defaultValue={config.pix_recipient_name} />
              <Field label="Cidade PIX" name="pixCity" defaultValue={config.pix_city} />
              <Field label="WhatsApp Gabriel" name="contactGabriel" defaultValue={config.contact_phone_gabriel} />
              <Field label="WhatsApp Raabe" name="contactRaabe" defaultValue={config.contact_phone_raabe} />
            </div>
            <Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" /> Salvar página</Button>
          </form>
        </CardContent>
      </Card>

      <Card id="eventos">
        <CardHeader><CardTitle>Eventos e locais</CardTitle><CardDescription>Rascunhos nunca aparecem na página pública. Publique somente dados conferidos.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {data.events.map((item) => <EventForm key={item.id} item={item} saving={saving} onSubmit={(event) => saveEvent(event, item.id)} onDelete={async () => { if (!confirm(`Excluir ${item.title}?`)) return; await send({ intent: "delete_event", id: item.id }); await load(); }} />)}
          <EventForm saving={saving} onSubmit={(event) => saveEvent(event)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, name, fieldId = name, defaultValue, type = "text", required = false, min, max }: { label: string; name: string; fieldId?: string; defaultValue: unknown; type?: string; required?: boolean; min?: number; max?: number }) {
  return <div className="space-y-2"><Label htmlFor={fieldId}>{label}</Label><Input id={fieldId} name={name} type={type} defaultValue={String(defaultValue ?? "")} min={type === "number" ? min ?? 0 : undefined} max={type === "number" ? max ?? 100 : undefined} required={required} /></div>;
}
function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue: unknown }) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><textarea id={name} name={name} defaultValue={String(defaultValue ?? "")} rows={4} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm" /></div>; }
function Toggle({ name, label, description, checked }: { name: string; label: string; description?: string; checked: boolean }) { return <label className="flex min-h-12 items-start gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3"><input name={name} type="checkbox" defaultChecked={checked} className="mt-0.5 h-5 w-5 shrink-0 accent-rose-600" /><span><span className="block text-sm font-medium text-stone-900">{label}</span>{description && <span className="mt-1 block text-xs leading-relaxed text-stone-600">{description}</span>}</span></label>; }

function EventForm({ item, saving, onSubmit, onDelete }: { item?: AdminEvent; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onDelete?: () => void }) {
  const localDate = item?.starts_at ? new Date(new Date(item.starts_at).getTime() - new Date(item.starts_at).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
  const fieldPrefix = item?.id || "new-event";
  return <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border bg-stone-50 p-4 md:grid-cols-2 lg:grid-cols-4">
    <div className="space-y-2"><Label htmlFor={`${fieldPrefix}-kind`}>Tipo</Label><select id={`${fieldPrefix}-kind`} name="kind" defaultValue={item?.kind || "celebration"} className="h-10 w-full rounded-md border bg-white px-3"><option value="celebration">Celebração</option><option value="ceremony">Cerimônia</option><option value="reception">Recepção</option><option value="gathering">Encontro</option></select></div>
    <Field label="Título" name="eventTitle" fieldId={`${fieldPrefix}-title`} defaultValue={item?.title} required />
    <Field label="Data e hora" name="startsAt" fieldId={`${fieldPrefix}-starts-at`} defaultValue={localDate} type="datetime-local" />
    <div className="space-y-2"><Label htmlFor={`${fieldPrefix}-state`}>Estado</Label><select id={`${fieldPrefix}-state`} name="state" defaultValue={item?.state || "draft"} className="h-10 w-full rounded-md border bg-white px-3"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></div>
    <Field label="Local" name="venueName" fieldId={`${fieldPrefix}-venue`} defaultValue={item?.venue_name} />
    <Field label="Endereço" name="address" fieldId={`${fieldPrefix}-address`} defaultValue={item?.address} />
    <Field label="Link do mapa" name="mapUrl" fieldId={`${fieldPrefix}-map`} defaultValue={item?.map_url} type="url" />
    <Field label="Ordem" name="sortOrder" fieldId={`${fieldPrefix}-sort-order`} defaultValue={item?.sort_order ?? 0} type="number" />
    <Field label="Dress code" name="dressCode" fieldId={`${fieldPrefix}-dress-code`} defaultValue={item?.dress_code} />
    <Field label="Nota / cronograma" name="scheduleNote" fieldId={`${fieldPrefix}-schedule-note`} defaultValue={item?.schedule_note} />
    <div className="flex items-end gap-2 lg:col-span-2"><Button type="submit" disabled={saving}>{item ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{item ? "Salvar evento" : "Criar rascunho"}</Button>{onDelete && <Button type="button" variant="outline" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" /> Excluir</Button>}</div>
  </form>;
}
