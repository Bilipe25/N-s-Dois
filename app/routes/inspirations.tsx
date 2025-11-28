import { useState } from "react";
import { useLoaderData, Form, useNavigation } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./+types/inspirations";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Inspirações - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: inspirations, error } = await supabase
        .from("inspirations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching inspirations:", error);
        return { inspirations: [] };
    }

    return { inspirations };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add") {
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const notes = formData.get("notes") as string;
        const photo = formData.get("photo") as File;

        if (!title || !photo || photo.size === 0) return null;

        // Upload da foto
        const fileExt = photo.name.split('.').pop();
        const fileName = `inspiration_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, photo);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return null; // Ou retornar erro para exibir toast
        }

        const { data: publicUrlData } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        const photo_url = publicUrlData.publicUrl;

        const { error: dbError } = await supabase.from("inspirations").insert({
            title,
            category,
            notes,
            photo_url
        });

        if (dbError) console.error("DB Error:", dbError);

    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("inspirations").delete().eq("id", id);
    }

    return null;
};

export default function Inspirations() {
    const { inspirations } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [filter, setFilter] = useState<string>("todos");
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const categories = ["todos", "decoracao", "cerimonia", "festa", "vestidos", "lua_de_mel", "outros"];

    const filteredInspirations = inspirations.filter((item: any) => {
        if (filter === "todos") return true;
        return item.category === filter;
    });

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
                <p className="text-sm text-muted-foreground">Nossas ideias e referências</p>
            </header>

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
                        {cat.replace(/_/g, " ")}
                    </button>
                ))}
            </div>

            {/* Adicionar Inspiração */}
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
                                    required
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input name="title" placeholder="Título (ex: Vestido Sereia)" required className="h-9" />
                                <div className="flex gap-2">
                                    <select
                                        name="category"
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                    >
                                        <option value="">Categoria...</option>
                                        <option value="decoracao">Decoração</option>
                                        <option value="cerimonia">Cerimônia</option>
                                        <option value="festa">Festa</option>
                                        <option value="vestidos">Vestidos</option>
                                        <option value="lua_de_mel">Lua de Mel</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <Input name="notes" placeholder="Notas (opcional)" className="text-sm h-9" />
                        <Button type="submit" name="intent" value="add" className="w-full h-9" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Adicionar Inspiração
                        </Button>
                    </Form>
                </CardContent>
            </Card>

            {/* Galeria Masonry */}
            {filteredInspirations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                    Nenhuma inspiração encontrada nesta categoria.
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {filteredInspirations.map((item: any) => (
                        <div
                            key={item.id}
                            className="break-inside-avoid relative group cursor-pointer rounded-lg overflow-hidden mb-4"
                            onClick={() => setSelectedImage(item)}
                        >
                            <img
                                src={item.photo_url}
                                alt={item.title}
                                className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                <p className="text-white text-sm font-medium truncate">{item.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none">
                    {selectedImage && (
                        <div className="flex flex-col md:flex-row h-[80vh] md:h-[600px]">
                            <div className="flex-1 bg-black flex items-center justify-center relative">
                                <img
                                    src={selectedImage.photo_url}
                                    alt={selectedImage.title}
                                    className="max-h-full max-w-full object-contain"
                                />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 md:hidden"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="w-full md:w-80 p-6 flex flex-col bg-background">
                                <DialogHeader className="mb-4">
                                    <DialogTitle className="text-xl font-serif">{selectedImage.title}</DialogTitle>
                                    <DialogDescription className="capitalize text-primary font-medium">
                                        {selectedImage.category.replace(/_/g, " ")}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="flex-1 overflow-y-auto">
                                    {selectedImage.notes ? (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {selectedImage.notes}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Sem notas.</p>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">
                                        Adicionado em {new Date(selectedImage.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                    <Form method="post">
                                        <input type="hidden" name="id" value={selectedImage.id} />
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
