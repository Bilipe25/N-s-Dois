import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UpdateConfigSchema, type UpdateConfigInput } from "@/schemas/bridal-shower";
import { Loader2 } from "lucide-react";

/**
 * Format date string safely for datetime-local input, keeping local timezone offset.
 * Solves the UTC shift issue of toISOString().
 */
const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
};

interface AdminConfigFormProps {
    config: any;
    updateConfig: any;
}

export function AdminConfigForm({ config, updateConfig }: AdminConfigFormProps) {
    const form = useForm<UpdateConfigInput>({
        resolver: zodResolver(UpdateConfigSchema),
        defaultValues: {
            date: formatDateForInput(config?.bridal_shower_date),
            location: config?.bridal_shower_location || "",
            address_1: config?.bridal_shower_address_1 || "",
            map_link_1: config?.bridal_shower_map_link_1 || "",
            date_2: formatDateForInput(config?.bridal_shower_date_2),
            location_2: config?.bridal_shower_location_2 || "",
            address_2: config?.bridal_shower_address_2 || "",
            map_link_2: config?.bridal_shower_map_link_2 || "",
            hero_url: config?.bridal_shower_hero_url || "",
            pix_key: config?.pix_key || "",
            pix_recipient_name: config?.pix_recipient_name || "",
            pix_city: config?.pix_city || "",
            contact_phone_gabriel: config?.contact_phone_gabriel || "",
            contact_phone_raabe: config?.contact_phone_raabe || "",
            show_links: config?.bridal_shower_show_links ?? true,
            show_prices: config?.bridal_shower_show_prices ?? true
        }
    });

    // Sincronizar formulário quando config for recarregado
    useEffect(() => {
        if (config) {
            form.reset({
                date: formatDateForInput(config.bridal_shower_date),
                location: config.bridal_shower_location || "",
                address_1: config.bridal_shower_address_1 || "",
                map_link_1: config.bridal_shower_map_link_1 || "",
                date_2: formatDateForInput(config.bridal_shower_date_2),
                location_2: config.bridal_shower_location_2 || "",
                address_2: config.bridal_shower_address_2 || "",
                map_link_2: config.bridal_shower_map_link_2 || "",
                hero_url: config.bridal_shower_hero_url || "",
                pix_key: config.pix_key || "",
                pix_recipient_name: config.pix_recipient_name || "",
                pix_city: config.pix_city || "",
                contact_phone_gabriel: config.contact_phone_gabriel || "",
                contact_phone_raabe: config.contact_phone_raabe || "",
                show_links: config.bridal_shower_show_links ?? true,
                show_prices: config.bridal_shower_show_prices ?? true
            });
        }
    }, [config, form]);

    const onSubmit = (data: UpdateConfigInput) => {
        if (!config) return;
        updateConfig.mutate({ id: config.id, updates: data });
    };

    return (
        <Card className="bg-stone-50 border-stone-200">
            <CardContent className="p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs defaultValue="local1" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="local1">Local 1</TabsTrigger>
                                <TabsTrigger value="local2">Local 2</TabsTrigger>
                                <TabsTrigger value="contato">Contato</TabsTrigger>
                                <TabsTrigger value="geral">Geral</TabsTrigger>
                            </TabsList>

                            <TabsContent value="local1" className="space-y-3 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data e Hora (Local 1)</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Local 1</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Salão de Festas A" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address_1"
                                        render={({ field }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Endereço Completo (Local 1)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Rua, Número, Bairro, Cidade" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="map_link_1"
                                        render={({ field }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Link do Google Maps (Local 1)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://maps.google.com/..." className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="local2" className="space-y-3 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date_2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data e Hora (Local 2)</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location_2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Local 2</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Casa da Mãe" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address_2"
                                        render={({ field }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Endereço Completo (Local 2)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Rua, Número, Bairro, Cidade" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="map_link_2"
                                        render={({ field }) => (
                                            <FormItem className="col-span-full">
                                                <FormLabel>Link do Google Maps (Local 2)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://maps.google.com/..." className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="contato" className="space-y-3 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contact_phone_gabriel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp Gabriel</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="5511999999999" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contact_phone_raabe"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp Raabe</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="5511999999999" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="geral" className="space-y-3 mt-4">
                                <FormField
                                    control={form.control}
                                    name="hero_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL da Imagem de Fundo (Hero)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." className="bg-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pix_key"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Chave Pix</FormLabel>
                                            <FormControl>
                                                <Input placeholder="CPF, Email ou Aleatória" className="bg-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pix_recipient_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Recebedor PIX</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome completo do recebedor" className="bg-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pix_city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cidade do Recebedor PIX</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Cidade do recebedor" className="bg-white" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="show_links"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Exibir Links dos Presentes</FormLabel>
                                                <div className="text-sm text-stone-500">
                                                    Permite que os convidados cliquem nos links externos para comprar os presentes.
                                                </div>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="show_prices"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white mt-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Exibir Preços dos Presentes</FormLabel>
                                                <div className="text-sm text-stone-500">
                                                    Mostra a faixa de preço cadastrada na lista pública. Se desativado, o filtro de preços também será escondido.
                                                </div>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>

                        <Button type="submit" size="sm" className="w-full mt-4 bg-stone-900 hover:bg-stone-800" disabled={updateConfig.isPending}>
                            {updateConfig.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/> Salvando...</> : "Salvar Configurações"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
