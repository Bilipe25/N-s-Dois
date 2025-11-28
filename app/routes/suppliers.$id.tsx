import { Form, useNavigation, useActionData, redirect, useLoaderData } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UploadCloud, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/suppliers.$id";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Editar Fornecedor - Nós Dois" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: supplier, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !supplier) {
        throw new Response("Fornecedor não encontrado", { status: 404 });
    }

    return { supplier };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    const formData = await request.formData();
    const supabase = createClient(request);

    // Usar Service Role Key para bypassar RLS se necessário, mas aqui vamos tentar com o cliente normal primeiro
    // Se der erro de RLS no upload, usamos a mesma lógica do settings.tsx
    // Mas para suppliers, geralmente o usuário logado tem permissão.
    // Vamos manter simples e se der erro corrigimos.

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const status = formData.get("status") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const contact = formData.get("contact") as string;
    const photo = formData.get("photo") as File;

    if (!name) {
        return { error: "Nome é obrigatório" };
    }

    const updates: any = {
        name,
        category,
        status,
        price,
        contact
    };

    if (photo && photo.size > 0 && photo.name !== "undefined") {
        const fileExt = photo.name.split('.').pop();
        const fileName = `supplier_${Date.now()}.${fileExt}`;

        const arrayBuffer = await photo.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, fileBuffer, {
                contentType: photo.type,
                upsert: true
            });

        if (uploadError) {
            return { error: `Erro ao fazer upload da imagem: ${uploadError.message}` };
        }

        const { data } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        updates.photo_url = data.publicUrl;
    }

    const { error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", params.id);

    if (error) {
        return { error: error.message };
    }

    return redirect("/suppliers");
};

export default function EditSupplier() {
    const { supplier } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [previewUrl, setPreviewUrl] = useState<string | null>(supplier.photo_url);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/suppliers">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Editar Fornecedor</h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Dados do Fornecedor</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form method="post" encType="multipart/form-data" className="space-y-4">

                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary border-2 border-border flex items-center justify-center group cursor-pointer">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UploadCloud className="h-6 w-6 text-white" />
                                </div>
                                <Input
                                    type="file"
                                    name="photo"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">Toque para alterar a foto</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Fornecedor</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={supplier.name}
                                placeholder="Ex: Buffet Silva"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Input
                                id="category"
                                name="category"
                                list="categories"
                                defaultValue={supplier.category}
                                placeholder="Selecione ou Digite"
                                required
                            />
                            <datalist id="categories">
                                <option value="Buffet" />
                                <option value="Decoração" />
                                <option value="Foto/Vídeo" />
                                <option value="Local" />
                                <option value="Roupas" />
                                <option value="Música" />
                                <option value="Cerimonial" />
                                <option value="Doces/Bolo" />
                                <option value="Papelaria" />
                                <option value="Outros" />
                            </datalist>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <div className="relative">
                                <select
                                    id="status"
                                    name="status"
                                    defaultValue={supplier.status}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                >
                                    <option value="pendente">Pendente</option>
                                    <option value="contratado">Contratado</option>
                                    <option value="pago">Pago</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Valor (R$)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    defaultValue={supplier.price}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact">Contato</Label>
                                <Input
                                    id="contact"
                                    name="contact"
                                    defaultValue={supplier.contact}
                                    placeholder="Telefone ou Email"
                                />
                            </div>
                        </div>

                        {actionData?.error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {actionData.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
