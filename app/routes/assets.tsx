import { useState } from "react";
import { useLoaderData, Form, useNavigation } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon, X, Loader2, DollarSign, Package } from "lucide-react";
import type { Route } from "./+types/assets";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Nossos Bens - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: assets, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching assets:", error);
        return { assets: [] };
    }

    return { assets };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add") {
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const value = parseFloat(formData.get("value") as string) || 0;
        const notes = formData.get("notes") as string;
        const photo = formData.get("photo") as File;

        let photo_url = null;

        if (photo && photo.size > 0 && photo.name !== "undefined") {
            const fileExt = photo.name.split('.').pop();
            const fileName = `asset_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(fileName, photo);

            if (!uploadError) {
                const { data } = supabase.storage
                    .from("images")
                    .getPublicUrl(fileName);
                photo_url = data.publicUrl;
            }
        }

        if (name) {
            await supabase.from("assets").insert({
                name,
                category,
                value,
                notes,
                photo_url
            });
        }
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("assets").delete().eq("id", id);
    }

    return null;
};

export default function Assets() {
    const { assets } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [filter, setFilter] = useState<string>("todos");
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const categories = ["todos", "Cozinha", "Sala", "Quarto", "Banheiro", "Lavanderia", "Escritório", "Outros"];

    const filteredAssets = assets.filter((item: any) => {
        if (filter === "todos") return true;
        return item.category === filter;
    });

    const totalValue = assets.reduce((acc: number, item: any) => acc + (item.value || 0), 0);
    const totalItems = assets.length;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-20">
            <header>
                <p className="text-sm text-muted-foreground">Inventário da nossa casa</p>
            </header>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <DollarSign className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">Valor Total</span>
                        <span className="text-lg font-bold text-primary">
                            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Package className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">Total de Itens</span>
                        <span className="text-lg font-bold text-primary">{totalItems}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap ${filter === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Adicionar Bem */}
            <Card>
                <CardContent className="p-3">
                    <Form method="post" encType="multipart/form-data" className="space-y-3" onSubmit={() => setPreviewUrl(null)}>
                        <div className="flex gap-3 items-start">
                            <div className="relative h-20 w-20 bg-secondary rounded-md flex items-center justify-center overflow-hidden shrink-0 border border-dashed border-muted-foreground/50">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                                )}
                                <input
                                    type="file"
                                    name="photo"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input name="name" placeholder="Nome (ex: Geladeira)" required className="h-9" />
                                <div className="flex gap-2">
                                    <select
                                        name="category"
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                    >
                                        <option value="">Categoria...</option>
                                        {categories.filter(c => c !== 'todos').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">R$</span>
                                <Input name="value" type="number" step="0.01" placeholder="Valor" className="pl-8 h-9" />
                            </div>
                            <Input name="notes" placeholder="Notas (opcional)" className="flex-[2] h-9" />
                        </div>
                        <Button type="submit" name="intent" value="add" className="w-full h-9" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Adicionar Item
                        </Button>
                    </Form>
                </CardContent>
            </Card>

            {/* Lista de Bens */}
            <div className="space-y-3">
                {filteredAssets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                        Nenhum item encontrado nesta categoria.
                    </div>
                ) : (
                    filteredAssets.map((item: any) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-secondary/20 transition-colors cursor-pointer"
                            onClick={() => setSelectedAsset(item)}
                        >
                            <div className="h-12 w-12 rounded-md bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                                {item.photo_url ? (
                                    <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Package className="h-6 w-6 text-muted-foreground opacity-50" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                                    <span className="text-xs font-bold text-primary">
                                        {(item.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detalhes Dialog */}
            <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
                <DialogContent className="max-w-sm w-full p-0 overflow-hidden bg-background">
                    {selectedAsset && (
                        <div className="flex flex-col">
                            <div className="h-48 bg-secondary flex items-center justify-center relative">
                                {selectedAsset.photo_url ? (
                                    <img
                                        src={selectedAsset.photo_url}
                                        alt={selectedAsset.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Package className="h-16 w-16 text-muted-foreground opacity-30" />
                                )}
                                <button
                                    onClick={() => setSelectedAsset(null)}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <h2 className="text-xl font-serif font-bold">{selectedAsset.name}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedAsset.category}</p>
                                </div>

                                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                                    <DollarSign className="h-5 w-5" />
                                    {(selectedAsset.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>

                                {selectedAsset.notes && (
                                    <div className="bg-secondary/50 p-3 rounded-md text-sm text-muted-foreground">
                                        {selectedAsset.notes}
                                    </div>
                                )}

                                <div className="pt-4 border-t flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">
                                        Adicionado em {new Date(selectedAsset.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                    <Form method="post">
                                        <input type="hidden" name="id" value={selectedAsset.id} />
                                        <Button
                                            type="submit"
                                            name="intent"
                                            value="delete"
                                            variant="destructive"
                                            size="sm"
                                            onClick={(e) => {
                                                if (!confirm("Tem certeza que deseja excluir?")) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                        </Button>
                                    </Form>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
