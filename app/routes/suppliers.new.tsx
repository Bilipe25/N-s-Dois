import { useNavigate } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Image as ImageIcon, Star } from "lucide-react";
import { useState } from "react";
import type { Route } from "./+types/suppliers.new";
import { useCreateSupplier } from "@/hooks/useSuppliers";
import { toast } from "sonner";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Novo Fornecedor - Nós Dois" }];
};

export default function NewSupplier() {
    const navigate = useNavigate();
    const { mutate: createSupplier, isPending } = useCreateSupplier();

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [contractFile, setContractFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleContractChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setContractFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const status = formData.get("status") as any; // Zod will validate
        const price = parseFloat(formData.get("price") as string) || 0;
        const contact = formData.get("contact") as string;
        const notes = formData.get("notes") as string;

        let photo_url = null;
        let contract_url = null;

        const supabase = createClient(null as any);

        try {
            // Upload Photo
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `supplier_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("images")
                    .upload(fileName, photoFile);

                if (uploadError) throw new Error(`Erro na imagem: ${uploadError.message}`);

                const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                photo_url = data.publicUrl;
            }

            // Upload Contract
            if (contractFile) {
                const fileExt = contractFile.name.split('.').pop();
                const fileName = `contract_${Date.now()}.${fileExt}`;

                // Try documents bucket first
                let { error: uploadError } = await supabase.storage
                    .from("documents")
                    .upload(fileName, contractFile);

                let bucket = "documents";

                if (uploadError) {
                    // Fallback to images
                    const { error: fallbackError } = await supabase.storage
                        .from("images")
                        .upload(fileName, contractFile);

                    if (fallbackError) throw new Error(`Erro no contrato: ${uploadError.message}`);
                    bucket = "images";
                }

                const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
                contract_url = data.publicUrl;
            }

            createSupplier({
                name,
                category,
                status,
                price,
                contact_info: contact,
                rating,
                notes,
                photo_url,
                contract_url
            }, {
                onSuccess: () => {
                    navigate("/suppliers");
                }
            });

        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-20 pt-6">
            {/* Header removed as title is in TopNav */}

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Dados do Fornecedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

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
                                <span className="text-xs text-stone-500">Toque para adicionar foto</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Fornecedor</Label>
                                    <Input id="name" name="name" placeholder="Ex: Buffet Silva" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categoria</Label>
                                        <Input id="category" name="category" list="categories" placeholder="Selecione" required />
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
                                        <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact">Contato (WhatsApp)</Label>
                                        <Input id="contact" name="contact" placeholder="(11) 99999-9999" />
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
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notas / Observações</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        placeholder="O que você achou? Detalhes da negociação..."
                                        className="resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Contract Upload */}
                                <div className="space-y-2">
                                    <Label htmlFor="contract">Contrato (PDF/Imagem)</Label>
                                    <Input
                                        id="contract"
                                        name="contract"
                                        type="file"
                                        accept=".pdf,image/*"
                                        className="cursor-pointer"
                                        onChange={handleContractChange}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800" disabled={isPending}>
                                {isPending ? "Criando..." : "Criar Fornecedor"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
