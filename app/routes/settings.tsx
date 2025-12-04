import { useLoaderData } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, UploadCloud, Image as ImageIcon, Bell } from "lucide-react";
import { PushManager } from "@/components/push-manager";
import type { Route } from "./+types/settings";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Configurações - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    let { data: config } = await supabase
        .from("app_config")
        .select("*")
        .single();

    if (!config) {
        const { data: newConfig, error } = await supabase
            .from("app_config")
            .insert({ wedding_date: '2025-09-20 16:00:00-03' })
            .select()
            .single();

        if (!error) {
            config = newConfig;
        }
    }

    return { config };
};

export default function Settings() {
    const { config: initialConfig } = useLoaderData<typeof loader>();
    const { data: config } = useSettings(initialConfig);
    const updateSettings = useUpdateSettings();

    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: {
            wedding_date: config?.wedding_date ? new Date(config.wedding_date).toISOString().slice(0, 16) : "",
            wedding_address: config?.wedding_address || "",
        }
    });

    // Update form values when config changes (e.g. after refetch)
    useEffect(() => {
        if (config) {
            setValue("wedding_date", config.wedding_date ? new Date(config.wedding_date).toISOString().slice(0, 16) : "");
            setValue("wedding_address", config.wedding_address || "");
        }
    }, [config, setValue]);

    const onSubmit = (data: any, event: any) => {
        const formData = new FormData(event.target);
        updateSettings.mutate(formData);
    };

    return (
        <div className="p-4 space-y-6 pb-20">

            {/* Seção de Notificações */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Notificações
                    </CardTitle>
                    <CardDescription>Gerencie as notificações neste dispositivo</CardDescription>
                </CardHeader>
                <CardContent>
                    <PushManager />
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="space-y-6">
                {/* Data do Casamento */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Save className="w-4 h-4" /> Data do Casamento
                        </CardTitle>
                        <CardDescription>Quando será o grande dia?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="wedding_date">Data e Hora</Label>
                                <Input
                                    type="datetime-local"
                                    id="wedding_date"
                                    {...register("wedding_date")}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wedding_address">Endereço do Local</Label>
                                <Input
                                    type="text"
                                    id="wedding_address"
                                    {...register("wedding_address")}
                                    placeholder="Ex: Chácara Recanto dos Sonhos - Rua das Flores, 123"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Fotos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Personalização
                        </CardTitle>
                        <CardDescription>Escolha as fotos de fundo do app</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Foto Login */}
                        <div className="space-y-3">
                            <Label htmlFor="login_photo">Foto da Tela de Login</Label>
                            {config?.login_photo_url && (
                                <div className="aspect-video w-full rounded-md overflow-hidden bg-muted border relative group">
                                    <img src={config.login_photo_url} alt="Login Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                        Atual
                                    </div>
                                </div>
                            )}
                            <Input id="login_photo" name="login_photo" type="file" accept="image/*" />
                            <p className="text-[10px] text-muted-foreground">Recomendado: Formato horizontal, alta qualidade.</p>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Foto Home */}
                        <div className="space-y-3">
                            <Label htmlFor="home_photo">Foto da Home (Fundo)</Label>
                            {config?.home_photo_url && (
                                <div className="aspect-video w-full rounded-md overflow-hidden bg-muted border relative group">
                                    <img src={config.home_photo_url} alt="Home Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                        Atual
                                    </div>
                                </div>
                            )}
                            <Input id="home_photo" name="home_photo" type="file" accept="image/*" />
                            <p className="text-[10px] text-muted-foreground">Recomendado: Foto mais clara ou com bom contraste.</p>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Foto Chá de Casa Nova */}
                        <div className="space-y-3">
                            <Label htmlFor="bridal_hero_photo">Foto do Chá de Casa Nova (Capa)</Label>
                            {config?.bridal_shower_hero_url && (
                                <div className="aspect-video w-full rounded-md overflow-hidden bg-muted border relative group">
                                    <img src={config.bridal_shower_hero_url} alt="Bridal Hero" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                        Atual
                                    </div>
                                </div>
                            )}
                            <Input id="bridal_hero_photo" name="bridal_hero_photo" type="file" accept="image/*" />
                            <p className="text-[10px] text-muted-foreground">Recomendado: Foto horizontal de alta qualidade para o topo da página do Chá.</p>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Logo do App */}
                        <div className="space-y-3">
                            <Label htmlFor="logo">Logo do App (Ícone)</Label>
                            {config?.logo_url && (
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border relative group">
                                        <img src={config.logo_url} alt="App Logo" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">Logo atual</span>
                                </div>
                            )}
                            <Input id="logo" name="logo" type="file" accept="image/*" />
                            <p className="text-[10px] text-muted-foreground">Recomendado: Imagem quadrada (PNG ou JPG), será usada como ícone do app.</p>
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full h-12 text-lg font-medium shadow-lg" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? (
                        <>Salvando...</>
                    ) : (
                        <><UploadCloud className="mr-2 h-5 w-5" /> Salvar Alterações</>
                    )}
                </Button>
            </form>
        </div>
    );
}
