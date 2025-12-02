import { useNavigate, useParams } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Image as ImageIcon, Star, FileText, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Route } from "./+types/suppliers.$id";
import { useSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
import { toast } from "sonner";
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

export const meta: Route.MetaFunction = () => {
    return [{ title: "Editar Fornecedor - Nós Dois" }];
};

export default function EditSupplier() {
    const params = useParams();
    const navigate = useNavigate();
    const id = params.id as string;

    const { data: supplier, isLoading } = useSupplier(id);
    const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplier();
    const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier();

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [contractFile, setContractFile] = useState<File | null>(null);

    // Sync state when data loads
    useEffect(() => {
        if (supplier) {
            setPreviewUrl(supplier.photo_url);
            setRating(supplier.rating || 0);
        }
    }, [supplier]);

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
        const status = formData.get("status") as any;
        const price = parseFloat(formData.get("price") as string) || 0;
        const contact = formData.get("contact") as string;
        const notes = formData.get("notes") as string;

        let photo_url = supplier?.photo_url;
        let contract_url = supplier?.contract_url;

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

                let { error: uploadError } = await supabase.storage
                    .from("documents")
                    .upload(fileName, contractFile);

                let bucket = "documents";

                if (uploadError) {
                    const { error: fallbackError } = await supabase.storage
                        .from("images")
                        .upload(fileName, contractFile);

                    if (fallbackError) throw new Error(`Erro no contrato: ${uploadError.message}`);
                    bucket = "images";
                }

                const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
                contract_url = data.publicUrl;
            }

            updateSupplier({
                id,
                updates: {
                    name,
                    category,
                    status,
                    price,
                    contact_info: contact,
                    rating,
                    notes,
                    photo_url,
                    contract_url
                }
            }, {
                onSuccess: () => {
                    navigate("/suppliers");
                }
            });

        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = () => {
        deleteSupplier(id, {
            onSuccess: () => {
                navigate("/suppliers");
            }
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-stone-500">Fornecedor não encontrado.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-20 pt-6">
            {/* Header removed as title is in TopNav */}

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Dados do Fornecedor</CardTitle>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
                                        <Input
                                            id="contract"
                                            name="contract"
                                            type="file"
                                            accept=".pdf,image/*"
                                            className="cursor-pointer"
                                            onChange={handleContractChange}
                                        />
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

                            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800" disabled={isUpdating}>
                                {isUpdating ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
