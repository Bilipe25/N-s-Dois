import { useState, useEffect, useMemo } from "react";
import { useLoaderData, useNavigation, useSearchParams, redirect, useFetcher, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./+types/inspirations";

// New Components
import { FilterBar } from "@/components/inspirations/filter-bar";
import { InspirationCard } from "@/components/inspirations/inspiration-card";
import { InspirationDetails } from "@/components/inspirations/inspiration-details";
import type { Inspiration, SortOption } from "@/components/inspirations/types";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Inspirações - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        return redirect("/login");
    }

    const supabase = createClient(request);

    // Buscar inspirações
    const { data: inspirations, error } = await supabase
        .from("inspirations")
        .select(`
            *,
            inspiration_likes (user_name),
            inspiration_comments (
                id,
                user_name,
                content,
                created_at
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching inspirations:", error);
        return { inspirations: [], user };
    }

    // Ordenar comentários por data (mais recentes primeiro)
    const processedInspirations = inspirations.map((insp: any) => ({
        ...insp,
        inspiration_comments: insp.inspiration_comments.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }));

    return { inspirations: processedInspirations as Inspiration[], user };
};

export const clientLoader = async ({ request, serverLoader }: Route.ClientLoaderArgs) => {
    const cacheKey = "inspirations-data";

    // Tenta pegar do cache primeiro (se não for uma navegação forçada)
    if (!new URL(request.url).searchParams.get("_data")) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache válido por 5 minutos
            if (Date.now() - timestamp < 5 * 60 * 1000) {
                return data;
            }
        }
    }

    // Se não tiver cache ou expirou, chama o loader do servidor
    const data = await serverLoader();

    // Salva no cache
    sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
    }));

    return data;
};

clientLoader.hydrate = true;

export const action = async ({ request }: Route.ActionArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) return redirect("/login");

    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);
    const { sendPushToUser } = await import("@/services/push.server");

    if (intent === "add") {
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const notes = formData.get("notes") as string;
        const photo = formData.get("photo") as File;

        if (!title || !photo || photo.size === 0) return null;

        // Upload da foto
        const fileExt = photo.name.split('.').pop();
        const fileName = `inspiration_${Date.now()}.${fileExt}`;

        const arrayBuffer = await photo.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, fileBuffer, {
                contentType: photo.type,
                upsert: true
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return null;
        }

        const { data: publicUrlData } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        const photo_url = publicUrlData.publicUrl;

        const { data: newInspiration, error: dbError } = await supabase.from("inspirations").insert({
            title,
            category,
            notes,
            photo_url
        }).select().single();

        if (dbError) console.error("DB Error:", dbError);

        if (newInspiration) {
            // Notificar o outro usuário
            await supabase.from("notifications").insert({
                type: "gift",
                title: "Nova Inspiração ✨",
                message: `${user} adicionou uma nova inspiração em ${category}: "${title}".`,
                link: `/inspirations?id=${newInspiration.id}`,
                image_url: photo_url
            });

            await sendPushToUser(request, "all", "Nova Inspiração ✨", `${user} adicionou uma nova inspiração em ${category}: "${title}".`, `/inspirations?id=${newInspiration.id}`, photo_url);
        }

    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("inspirations").delete().eq("id", id);
    } else if (intent === "edit") {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const notes = formData.get("notes") as string;
        const category = formData.get("category") as string;

        await supabase
            .from("inspirations")
            .update({ title, notes, category })
            .eq("id", id);

    } else if (intent === "toggle_like") {
        const inspirationId = formData.get("inspirationId") as string;
        const hasLiked = formData.get("hasLiked") === "true";

        if (hasLiked) {
            await supabase.from("inspiration_likes")
                .delete()
                .match({ inspiration_id: inspirationId, user_name: user });
        } else {
            await supabase.from("inspiration_likes").insert({
                inspiration_id: inspirationId,
                user_name: user
            });

            const { data: insp } = await supabase.from("inspirations").select("title, photo_url").eq("id", inspirationId).single();

            if (insp) {
                await supabase.from("notifications").insert({
                    type: "gift",
                    title: "Nova Curtida ❤️",
                    message: `${user} curtiu sua inspiração "${insp.title}".`,
                    link: `/inspirations?id=${inspirationId}`,
                    image_url: insp.photo_url
                });

                await sendPushToUser(request, "all", "Nova Curtida ❤️", `${user} curtiu sua inspiração "${insp.title}".`, `/inspirations?id=${inspirationId}`, insp.photo_url);
            }
        }
    } else if (intent === "add_comment") {
        const inspirationId = formData.get("inspirationId") as string;
        const content = formData.get("content") as string;

        if (content.trim()) {
            await supabase.from("inspiration_comments").insert({
                inspiration_id: inspirationId,
                user_name: user,
                content
            });

            const { data: insp } = await supabase.from("inspirations").select("title, photo_url").eq("id", inspirationId).single();

            if (insp) {
                await supabase.from("notifications").insert({
                    type: "gift",
                    title: "Novo Comentário 💬",
                    message: `${user} comentou em "${insp.title}": "${content}"`,
                    link: `/inspirations?id=${inspirationId}`,
                    image_url: insp.photo_url
                });

                await sendPushToUser(request, "all", "Novo Comentário 💬", `${user} comentou em "${insp.title}": "${content}"`, `/inspirations?id=${inspirationId}`, insp.photo_url);
            }
        }
    }

    return null;
};

export default function Inspirations() {
    const { inspirations, user } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();
    const isSubmitting = navigation.state === "submitting";

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
            // Default is recent (already sorted by DB, but good to ensure)
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        return result;
    }, [inspirations, filter, searchQuery, sortBy, user]);

    // Handle URL opening
    useEffect(() => {
        const idFromUrl = searchParams.get("id");
        if (idFromUrl) {
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
        fetcher.submit(
            { intent: "toggle_like", inspirationId: inspiration.id, hasLiked: isLiked.toString() },
            { method: "post" }
        );
    };

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
                                inspiration={item}
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
                            inspiration={selectedImage}
                            user={user}
                            onClose={handleCloseDialog}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            setIsZoomed={setIsZoomed}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            hasNext={hasNext}
                            hasPrev={hasPrev}
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
            <div className="fixed bottom-24 right-6 z-50">
                <Button
                    onClick={() => setShowAddInspiration(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-stone-900 hover:bg-stone-800 text-white transition-transform hover:scale-105"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Add Modal */}
            <Dialog open={showAddInspiration} onOpenChange={setShowAddInspiration}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Nova Inspiração</DialogTitle>
                        <DialogDescription>
                            Adicione uma foto e detalhes da sua inspiração.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={() => { setPreviewUrl(null); setShowAddInspiration(false); }}>
                        <div className="flex gap-4 items-start">
                            <div className="relative h-24 w-24 bg-secondary rounded-md flex items-center justify-center overflow-hidden shrink-0 border border-dashed border-muted-foreground/50 group hover:border-primary transition-colors">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50 group-hover:text-primary" />
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
                                <Input name="title" placeholder="Título (ex: Vestido Sereia)" required className="font-medium" />
                                <select
                                    name="category"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <Input name="notes" placeholder="Notas (opcional)" />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddInspiration(false)}>Cancelar</Button>
                            <Button type="submit" name="intent" value="add" disabled={isSubmitting} className="bg-stone-900 text-white hover:bg-stone-800">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Adicionar
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
