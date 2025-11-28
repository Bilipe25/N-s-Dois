import { Form, useLoaderData, useNavigation, useActionData } from "react-router";
import { createClient } from "@/lib/supabase";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, ArrowLeft, UploadCloud, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/settings";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Configurações - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    let { data: config } = await supabase
        .from("app_config")
        .select("*")
        .single();

    // Se não existir configuração, cria uma padrão
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

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();

    // Usar Service Role Key para bypassar RLS (permissões)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
        console.error("Faltam variáveis de ambiente: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
        return { error: "Erro interno: Chave de administração não configurada. Verifique o arquivo .env" };
    }

    const supabaseAdmin = createSupabaseJsClient(supabaseUrl, serviceRoleKey);

    // Garantir que existe configuração
    let { data: currentConfig } = await supabaseAdmin.from("app_config").select("id").single();
    let configId = currentConfig?.id;

    if (!configId) {
        const { data: newConfig } = await supabaseAdmin
            .from("app_config")
            .insert({ wedding_date: '2025-09-20 16:00:00-03' })
            .select()
            .single();
        configId = newConfig?.id;
    }

    if (!configId) {
        return { error: "Erro crítico: Não foi possível inicializar as configurações." };
    }

    const intent = formData.get("intent");

    if (intent === "save_all") {
        const date = formData.get("wedding_date") as string;
        const address = formData.get("wedding_address") as string;
        const loginPhoto = formData.get("login_photo") as File;
        const homePhoto = formData.get("home_photo") as File;

        const updates: any = { wedding_date: date, wedding_address: address };
        let successMessage = "Configurações salvas com sucesso!";

        // Upload Login Photo
        if (loginPhoto && loginPhoto.size > 0) {
            const fileExt = loginPhoto.name.split('.').pop();
            const fileName = `login_${Date.now()}.${fileExt}`;

            const arrayBuffer = await loginPhoto.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from("images")
                .upload(fileName, fileBuffer, {
                    contentType: loginPhoto.type,
                    upsert: true
                });

            if (uploadError) {
                return { error: `Erro ao salvar foto de login: ${uploadError.message}` };
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from("images")
                .getPublicUrl(fileName);

            updates.login_photo_url = publicUrl;
        }

        // Upload Home Photo
        if (homePhoto && homePhoto.size > 0) {
            const fileExt = homePhoto.name.split('.').pop();
            const fileName = `home_${Date.now()}.${fileExt}`;

            const arrayBuffer = await homePhoto.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from("images")
                .upload(fileName, fileBuffer, {
                    contentType: homePhoto.type,
                    upsert: true
                });

            if (uploadError) {
                return { error: `Erro ao salvar foto da home: ${uploadError.message}` };
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from("images")
                .getPublicUrl(fileName);

            updates.home_photo_url = publicUrl;
        }

        // Upload Logo
        const logo = formData.get("logo") as File;
        if (logo && logo.size > 0) {
            const fileExt = logo.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;

            const arrayBuffer = await logo.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from("images")
                .upload(fileName, fileBuffer, {
                    contentType: logo.type,
                    upsert: true
                });

            if (uploadError) {
                return { error: `Erro ao salvar logo: ${uploadError.message}` };
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from("images")
                .getPublicUrl(fileName);

            updates.logo_url = publicUrl;
        }

        const { error: updateError } = await supabaseAdmin.from("app_config").update(updates).eq("id", configId);

        if (updateError) {
            return { error: `Erro ao atualizar banco de dados: ${updateError.message}` };
        }

        return { success: successMessage };
    }

    return null;
};

export default function Settings() {
    const { config } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    // Formatar data para input datetime-local
    const defaultDate = config?.wedding_date
        ? new Date(config.wedding_date).toISOString().slice(0, 16)
        : "";

    return (
        <div className="p-4 space-y-6 pb-20">


            {actionData?.error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm font-medium border border-destructive/20">
                    {actionData.error}
                </div>
            )}

            {actionData?.success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm font-medium border border-green-200">
                    {actionData.success}
                </div>
            )}

            <Form method="post" encType="multipart/form-data" className="space-y-6">
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
                                    name="wedding_date"
                                    defaultValue={defaultDate}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wedding_address">Endereço do Local</Label>
                                <Input
                                    type="text"
                                    id="wedding_address"
                                    name="wedding_address"
                                    defaultValue={config?.wedding_address || ""}
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

                {/* Botão Salvar Fixo ou no final */}
                <Button type="submit" name="intent" value="save_all" className="w-full h-12 text-lg font-medium shadow-lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>Salvando...</>
                    ) : (
                        <><UploadCloud className="mr-2 h-5 w-5" /> Salvar Alterações</>
                    )}
                </Button>
            </Form>
        </div>
    );
}
