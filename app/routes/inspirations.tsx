import { useState, useEffect, useMemo } from "react";
import { useLoaderData, useSearchParams, redirect } from "react-router";
import { getSession } from "@/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Plus, Image as ImageIcon, Loader2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./+types/inspirations";

// New Components
import { FilterBar } from "@/components/inspirations/filter-bar";
import { InspirationCard } from "@/components/inspirations/inspiration-card";
import { InspirationDetails } from "@/components/inspirations/inspiration-details";
import type { SortOption } from "@/components/inspirations/types";
import {
    useInspirations,
    useAddInspiration,
    useToggleLike,
    useAddComment,
    useDeleteInspiration,
    useEditInspiration,
} from "@/hooks/useInspirations";
import type { Inspiration } from "@/schemas/inspiration";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Inspirações - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        return redirect("/login");
    }

    return { user };
};

export default function Inspirations() {
    const { user } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    // React Query Hooks
    const { data: inspirations = [], isLoading } = useInspirations();
    const { mutate: addInspiration, isPending: isAdding } = useAddInspiration(user);
    const { mutate: toggleLike } = useToggleLike(user);
    const { mutate: addComment } = useAddComment(user);
    const { mutate: deleteInspiration } = useDeleteInspiration();
    const { mutate: editInspiration } = useEditInspiration();

    // State
    const [filter, setFilter] = useState<string>("todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [selectedImage, setSelectedImage] = useState<Inspiration | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showAddInspiration, setShowAddInspiration] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    const categories = ["todos", "meus_likes", "decoracao", "cerimonia", "festa", "vestidos", "lua_de_mel", "outros"];

    // Filtering and Sorting Logic
    const filteredInspirations = useMemo(() => {
        let result = inspirations.filter((item) => {
            const matchesCategory = filter === "todos"
                ? true
                : filter === "meus_likes"
                    ? item.inspiration_likes.some(l => l.user_name === user)
                    : item.category === filter;

            const matchesSearch = searchQuery === ""
                ? true
                : item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesCategory && matchesSearch;
        });

        if (sortBy === "likes") {
            result.sort((a, b) => (b.inspiration_likes?.length || 0) - (a.inspiration_likes?.length || 0));
        } else {
            // Default is recent
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        return result;
    }, [inspirations, filter, searchQuery, sortBy, user]);

    // Handle URL opening
    useEffect(() => {
        const idFromUrl = searchParams.get("id");
        if (idFromUrl && inspirations.length > 0) {
            const inspiration = inspirations.find((i) => i.id === idFromUrl);
            if (inspiration) {
                setSelectedImage(inspiration);
            }
        }
    }, [searchParams, inspirations]);

    const handleCloseDialog = () => {
        setSelectedImage(null);
        setIsZoomed(false);
        setSearchParams({});
    };

    // Navigation Logic
    const handleNext = () => {
        if (!selectedImage) return;
        const currentIndex = filteredInspirations.findIndex(i => i.id === selectedImage.id);
        if (currentIndex < filteredInspirations.length - 1) {
            setSelectedImage(filteredInspirations[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (!selectedImage) return;
        const currentIndex = filteredInspirations.findIndex(i => i.id === selectedImage.id);
        if (currentIndex > 0) {
            setSelectedImage(filteredInspirations[currentIndex - 1]);
        }
    };

    const hasNext = selectedImage ? filteredInspirations.findIndex(i => i.id === selectedImage.id) < filteredInspirations.length - 1 : false;
    const hasPrev = selectedImage ? filteredInspirations.findIndex(i => i.id === selectedImage.id) > 0 : false;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const notes = formData.get("notes") as string;
        const photo = formData.get("photo") as File;

        if (!photo || photo.size === 0) {
            toast.error("Selecione uma foto.");
            return;
        }

        addInspiration({ title, category, notes, photo }, {
            onSuccess: () => {
                setShowAddInspiration(false);
                setPreviewUrl(null);
            }
        });
    };

    const handleDownload = async () => {
        if (selectedImage) {
            try {
                const response = await fetch(selectedImage.photo_url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `inspiracao-${selectedImage.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Download iniciado!");
            } catch (error) {
                console.error("Erro no download:", error);
                toast.error("Erro ao baixar imagem.");
            }
        }
    };

    const handleShare = async () => {
        if (selectedImage && navigator.share) {
            try {
                await navigator.share({
                    title: selectedImage.title,
                    text: selectedImage.notes || `Olha essa inspiração de ${selectedImage.category}!`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            toast.info("Compartilhamento não suportado neste navegador.");
        }
    };

    const handleToggleLike = (e: React.MouseEvent, inspiration: Inspiration) => {
        e.stopPropagation();
        const isLiked = inspiration.inspiration_likes.some(l => l.user_name === user);
        toggleLike({ inspirationId: inspiration.id, hasLiked: isLiked });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8] pb-32">
            <FilterBar
                categories={categories}
                activeCategory={filter}
                onCategoryChange={setFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
            />

            <div className="p-4">
                {filteredInspirations.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon className="h-10 w-10 text-stone-300" />
                        </div>
                        <h3 className="text-lg font-medium text-stone-800 mb-2">Nenhuma inspiração encontrada</h3>
                        <p className="text-sm max-w-xs mx-auto">
                            Tente mudar os filtros ou adicione uma nova inspiração para começar sua coleção.
                        </p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {filteredInspirations.map((item) => (
                            <InspirationCard
                                key={item.id}
                                inspiration={item as any} // Cast to any to avoid strict type mismatch with component props if they differ slightly
                                onClick={() => setSelectedImage(item)}
                                isLiked={item.inspiration_likes.some(l => l.user_name === user)}
                                onToggleLike={(e) => handleToggleLike(e, item)}
                                onDownload={(e) => { e.stopPropagation(); setSelectedImage(item); setTimeout(handleDownload, 100); }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none h-[90dvh] md:h-[80vh] flex flex-col md:flex-row z-[150]">
                    {selectedImage && (
                        <InspirationDetails
                            inspiration={selectedImage as any}
                            user={user}
                            onClose={handleCloseDialog}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            setIsZoomed={setIsZoomed}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            hasNext={hasNext}
                            hasPrev={hasPrev}
                            onToggleLike={(inspiration) => handleToggleLike({ stopPropagation: () => { } } as any, inspiration)}
                            onAddComment={(inspirationId, content) => addComment({ inspirationId, content })}
                            onDelete={(id) => deleteInspiration(id, { onSuccess: () => setSelectedImage(null) })}
                            onEdit={(id, data) => editInspiration({ id, ...data })}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Zoom Overlay */}
            {isZoomed && selectedImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20"
                        onClick={() => setIsZoomed(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={selectedImage.photo_url}
                        alt={selectedImage.title}
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            )}

            {/* FAB */}
            {!showAddInspiration && !selectedImage && (
                <div className="fixed bottom-safe-24 right-6 z-40">
                    <Button
                        onClick={() => setShowAddInspiration(true)}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-stone-900 hover:bg-stone-800 text-white transition-transform hover:scale-105"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {/* Add Drawer */}
            <Drawer open={showAddInspiration} onOpenChange={setShowAddInspiration}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="text-left border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-100">
                                <Sparkles className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl">Nova Inspiração</DrawerTitle>
                                <DrawerDescription>Adicione uma foto e detalhes da sua inspiração</DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>
                    <form onSubmit={handleAddSubmit} className="px-4 py-4 space-y-4 overflow-y-auto">
                        {/* Photo Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Foto</label>
                            <div className="relative h-40 w-full bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors group cursor-pointer">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-stone-400 group-hover:text-stone-600">
                                        <ImageIcon className="h-10 w-10" />
                                        <span className="text-sm">Clique para selecionar uma foto</span>
                                    </div>
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
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Título</label>
                            <Input name="title" placeholder="Ex: Vestido Sereia" required className="h-11" />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Categoria</label>
                            <select
                                name="category"
                                className="flex h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="decoracao">Decoração</option>
                                <option value="cerimonia">Cerimônia</option>
                                <option value="festa">Festa</option>
                                <option value="vestidos">Vestidos</option>
                                <option value="lua_de_mel">Lua de Mel</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Notas <span className="text-stone-400">(opcional)</span></label>
                            <Input name="notes" placeholder="Adicione observações..." className="h-11" />
                        </div>

                        <DrawerFooter className="flex-row gap-2 px-0 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddInspiration(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isAdding} className="flex-1 bg-stone-900 hover:bg-stone-800">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                            </Button>
                        </DrawerFooter>
                    </form>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
