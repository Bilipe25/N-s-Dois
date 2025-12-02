import { Form, useNavigation, useActionData, redirect, useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UploadCloud, Image as ImageIcon, Star, FileText } from "lucide-react";
import { useState } from "react";
import type { Route } from "./+types/suppliers.$id";

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

    const intent = formData.get("intent");

    if (intent === "delete") {
        await supabase.from("suppliers").delete().eq("id", params.id);
        return redirect("/suppliers");
    }

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const status = formData.get("status") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const contact = formData.get("contact") as string;
    const rating = parseInt(formData.get("rating") as string) || 0;
    const notes = formData.get("notes") as string;

    const photo = formData.get("photo") as File;
    const contract = formData.get("contract") as File;

    if (!name) {
        return { error: "Nome é obrigatório" };
    }

    const updates: any = {
        name,
        category,
        status,
        price,
        contact_info: contact, // Map 'contact' form field to 'contact_info' db column
        rating,
        notes
    };

    // Handle Photo Upload
    if (photo && photo.size > 0 && photo.name !== "undefined") {
        const fileExt = photo.name.split('.').pop();
        const fileName = `supplier_${Date.now()}.${fileExt}`;
        const arrayBuffer = await photo.arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, Buffer.from(arrayBuffer), { contentType: photo.type, upsert: true });

        if (uploadError) return { error: `Erro na imagem: ${uploadError.message}` };

        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
        updates.photo_url = data.publicUrl;
    }

    // Handle Contract Upload
    if (contract && contract.size > 0 && contract.name !== "undefined") {
        const fileExt = contract.name.split('.').pop();
        const fileName = `contract_${Date.now()}.${fileExt}`;
        const arrayBuffer = await contract.arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from("documents") // Assuming 'documents' bucket exists, or use 'images' if mixed
            .upload(fileName, Buffer.from(arrayBuffer), { contentType: contract.type, upsert: true });

        if (uploadError) {
            // Fallback to 'images' bucket if 'documents' doesn't exist (common in simple setups)
            const { error: fallbackError } = await supabase.storage
                .from("images")
                .upload(fileName, Buffer.from(arrayBuffer), { contentType: contract.type, upsert: true });

            if (fallbackError) return { error: `Erro no contrato: ${uploadError.message}` };

            const { data } = supabase.storage.from("images").getPublicUrl(fileName);
            updates.contract_url = data.publicUrl;
        } else {
            const { data } = supabase.storage.from("documents").getPublicUrl(fileName);
            updates.contract_url = data.publicUrl;
        }
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
    const [rating, setRating] = useState(supplier.rating || 0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 sticky top-0 z-10 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="-ml-2" asChild>
                        <Link to="/suppliers">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="font-semibold text-stone-900">Editar Fornecedor</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Dados do Fornecedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form method="post" encType="multipart/form-data" className="space-y-6">

                            {/* Photo Upload */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-100 border-2 border-stone-200 flex items-center justify-center group cursor-pointer shadow-inner">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-stone-400" />
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
                                <span className="text-xs text-stone-500">Toque para alterar a foto</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Fornecedor</Label>
                                    <Input id="name" name="name" defaultValue={supplier.name} placeholder="Ex: Buffet Silva" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categoria</Label>
                                        <Input id="category" name="category" list="categories" defaultValue={supplier.category} placeholder="Selecione" required />
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
                                                <option value="pesquisando">Pesquisando</option>
                                                <option value="negociando">Negociando</option>
                                                <option value="contratado">Contratado</option>
                                                <option value="pago">Pago</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Valor Total (R$)</Label>
                                        <Input id="price" name="price" type="number" step="0.01" defaultValue={supplier.price} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact">Contato (WhatsApp)</Label>
                                        <Input id="contact" name="contact" defaultValue={supplier.contact_info} placeholder="(11) 99999-9999" />
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="space-y-2">
                                    <Label>Avaliação</Label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    className={`h-6 w-6 transition-colors ${star <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200 hover:text-amber-200"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <input type="hidden" name="rating" value={rating} />
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notas / Observações</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        defaultValue={supplier.notes}
                                        placeholder="O que você achou? Detalhes da negociação..."
                                        className="resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Contract Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="contract">Contrato (PDF/Imagem)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="contract" name="contract" type="file" accept=".pdf,image/*" className="cursor-pointer" />
                                    </div>
                                    {supplier.contract_url && (
                                        <div className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                                            <FileText className="h-3 w-3" />
                                            <a href={supplier.contract_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-800">
                                                Ver contrato atual
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {actionData?.error && (
                                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                    {actionData.error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800" disabled={isSubmitting}>
                                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
