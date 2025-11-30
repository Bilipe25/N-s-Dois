import { useState, useEffect } from "react";
import { useLoaderData, Form, useNavigation, useSearchParams, useNavigate, redirect, useFetcher } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon, X, Loader2, Heart, MessageCircle, Send, Share2, Download, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./+types/inspirations";

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

    return { inspirations: processedInspirations, user };
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

clientLoader.hydrate = true; // Habilita hidratação com dados do clientLoader

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
                image_url: photo_url // Adicionando imagem na notificação
            });

            // Enviar Push para TODOS (Broadcast)
            await sendPushToUser(request, "all", "Nova Inspiração ✨", `${user} adicionou uma nova inspiração em ${category}: "${title}".`, `/inspirations?id=${newInspiration.id}`, photo_url);
        }

    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("inspirations").delete().eq("id", id);
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

            // Buscar título e foto para notificação
            const { data: insp } = await supabase.from("inspirations").select("title, photo_url").eq("id", inspirationId).single();

            // Notificar
            if (insp) {
                await supabase.from("notifications").insert({
                    type: "gift",
                    title: "Nova Curtida ❤️",
                    message: `${user} curtiu sua inspiração "${insp.title}".`,
                    link: `/inspirations?id=${inspirationId}`,
                    image_url: insp.photo_url // Adicionando imagem na notificação
                });

                // Enviar Push para TODOS
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

            // Buscar título e foto para notificação
            const { data: insp } = await supabase.from("inspirations").select("title, photo_url").eq("id", inspirationId).single();

            // Notificar
            if (insp) {
                await supabase.from("notifications").insert({
                    type: "gift",
                    title: "Novo Comentário 💬",
                    message: `${user} comentou em "${insp.title}": "${content}"`,
                    link: `/inspirations?id=${inspirationId}`,
                    image_url: insp.photo_url // Adicionando imagem na notificação
                });

                // Enviar Push para TODOS
                await sendPushToUser(request, "all", "Novo Comentário 💬", `${user} comentou em "${insp.title}": "${content}"`, `/inspirations?id=${inspirationId}`, insp.photo_url);
            }
        }
    }

    return null;
};

// Componente extraído para gerenciar estado e Optimistic UI
function InspirationDetails({ selectedImage, user, handleCloseDialog, handleDownload, handleShare, setIsZoomed }: any) {
    const fetcher = useFetcher();
    const [commentText, setCommentText] = useState("");

    // Optimistic Likes
    const isLikedOriginal = selectedImage.inspiration_likes?.some((l: any) => l.user_name === user);
    let isLiked = isLikedOriginal;
    let likesCount = selectedImage.inspiration_likes?.length || 0;
    let likedBy = selectedImage.inspiration_likes?.map((l: any) => l.user_name) || [];

    if (fetcher.formData?.get("intent") === "toggle_like" && fetcher.formData.get("inspirationId") === selectedImage.id) {
        if (isLiked) {
            isLiked = false;
            likesCount--;
            likedBy = likedBy.filter((name: string) => name !== user);
        } else {
            isLiked = true;
            likesCount++;
            likedBy = [...likedBy, user];
        }
    }

    // Optimistic Comments
    let comments = [...(selectedImage.inspiration_comments || [])];
    if (fetcher.formData?.get("intent") === "add_comment" && fetcher.formData.get("inspirationId") === selectedImage.id) {
        const newComment = {
            id: "temp-" + Date.now(),
            user_name: user,
            content: fetcher.formData.get("content"),
            created_at: new Date().toISOString()
        };
        comments = [newComment, ...comments]; // Adiciona no topo (ordem decrescente)
    }

    return (
        <>
            {/* Imagem (Esquerda/Topo) */}
            <div className="flex-1 bg-black flex items-center justify-center relative h-[40%] md:h-full group">
                <img
                    src={selectedImage.photo_url}
                    alt={selectedImage.title}
                    className="max-h-full max-w-full object-contain cursor-zoom-in"
                    onClick={() => setIsZoomed(true)}
                />
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button
                        onClick={() => setIsZoomed(true)}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        title="Zoom"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                        title="Baixar Imagem"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                        title="Compartilhar"
                    >
                        <Share2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleCloseDialog(false)}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 md:hidden"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Detalhes e Chat (Direita/Baixo) */}
            <div className="w-full md:w-96 flex flex-col bg-background h-[60%] md:h-full border-l">
                <div className="p-4 border-b flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <DialogTitle className="text-lg font-serif">{selectedImage.title}</DialogTitle>
                            <DialogDescription className="capitalize text-primary font-medium text-xs">
                                {selectedImage.category.replace(/_/g, " ")}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <fetcher.Form method="post" className="flex items-center">
                                <input type="hidden" name="intent" value="toggle_like" />
                                <input type="hidden" name="inspirationId" value={selectedImage.id} />
                                <input type="hidden" name="hasLiked" value={isLikedOriginal.toString()} />
                                <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-50">
                                    <Heart className={`h-5 w-5 transition-colors ${isLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
                                </Button>
                            </fetcher.Form>
                            <Form method="post" onSubmit={(e) => {
                                if (!confirm("Tem certeza que deseja excluir?")) e.preventDefault();
                            }}>
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="id" value={selectedImage.id} />
                                <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Form>
                        </div>
                    </div>

                    {/* Likes Summary */}
                    <div className="text-xs text-muted-foreground mb-2">
                        {likesCount > 0 ? (
                            <span>
                                Curtido por <span className="font-medium text-foreground">{likedBy.join(" e ")}</span>
                            </span>
                        ) : (
                            <span>Seja o primeiro a curtir!</span>
                        )}
                    </div>

                    {selectedImage.notes && (
                        <p className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md mb-2">
                            {selectedImage.notes}
                        </p>
                    )}
                </div>

                {/* Lista de Comentários */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground py-4">
                            Nenhum comentário ainda.
                        </div>
                    ) : (
                        comments.map((comment: any) => (
                            <div key={comment.id} className={`flex flex-col ${comment.user_name === user ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] rounded-lg p-2 text-sm ${comment.user_name === user ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary text-secondary-foreground rounded-tl-none"}`}>
                                    <p>{comment.content}</p>
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                    {comment.user_name} • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Input de Comentário - Fixed at bottom */}
                <div className="p-3 border-t bg-background flex-shrink-0 pb-safe">
                    <fetcher.Form
                        method="post"
                        className="flex gap-2"
                        onSubmit={() => setCommentText("")} // Optimistic clear
                    >
                        <input type="hidden" name="intent" value="add_comment" />
                        <input type="hidden" name="inspirationId" value={selectedImage.id} />
                        <Input
                            name="content"
                            placeholder="Escreva um comentário..."
                            className="flex-1 h-9 text-sm"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" className="h-9 w-9" disabled={!commentText.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </fetcher.Form>
                </div>
            </div>
        </>
    );
}

export default function Inspirations() {
    const { inspirations, user } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isSubmitting = navigation.state === "submitting";

    const [filter, setFilter] = useState<string>("todos");
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showAddInspiration, setShowAddInspiration] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isZoomed, setIsZoomed] = useState(false); // Estado para Zoom

    const categories = ["todos", "meus_likes", "decoracao", "cerimonia", "festa", "vestidos", "lua_de_mel", "outros"];

    // Efeito para abrir inspiração via URL (notificação)
    useEffect(() => {
        const idFromUrl = searchParams.get("id");
        if (idFromUrl) {
            const inspiration = inspirations.find((i: any) => i.id === idFromUrl);
            if (inspiration) {
                setSelectedImage(inspiration);
            }
        }
    }, [searchParams, inspirations]);

    // Limpar query param ao fechar dialog
    const handleCloseDialog = (open: boolean) => {
        if (!open) {
            setSelectedImage(null);
            setIsZoomed(false); // Reset zoom
            setSearchParams({}); // Limpa URL
        }
    };

    const isLikedByUser = (likes: any[]) => likes.some((l: any) => l.user_name === user);

    const filteredInspirations = inspirations.filter((item: any) => {
        if (filter === "todos") return true;
        if (filter === "meus_likes") return isLikedByUser(item.inspiration_likes || []);
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

    const handleShare = async () => {
        if (selectedImage && navigator.share) {
            try {
                await navigator.share({
                    title: selectedImage.title,
                    text: selectedImage.notes || `Olha essa inspiração de ${selectedImage.category}!`,
                    url: window.location.href, // Ou link direto se tiver
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            toast.info("Compartilhamento não suportado neste navegador.");
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

    return (
        <div className="p-4 space-y-6 pb-32"> {/* Aumentado padding bottom */}
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
                        {cat === "meus_likes" ? "Meus Likes ❤️" : cat.replace(/_/g, " ")}
                    </button>
                ))}
            </div>

            {/* Galeria Masonry */}
            {filteredInspirations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                    {filter === "meus_likes"
                        ? "Você ainda não curtiu nenhuma inspiração."
                        : "Nenhuma inspiração encontrada nesta categoria."}
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {filteredInspirations.map((item: any) => {
                        const liked = isLikedByUser(item.inspiration_likes || []);
                        const commentsCount = item.inspiration_comments?.length || 0;

                        return (
                            <div
                                key={item.id}
                                className="break-inside-avoid relative group cursor-pointer rounded-lg overflow-hidden mb-4 shadow-sm border border-border"
                                onClick={() => setSelectedImage(item)}
                            >
                                <img
                                    src={item.photo_url}
                                    alt={item.title}
                                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                                    <div className="flex items-center gap-3 mt-1 text-white/90 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Heart className={`h-3 w-3 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
                                            <span>{item.inspiration_likes?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="h-3 w-3" />
                                            <span>{commentsCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox Dialog Detalhado */}
            <Dialog open={!!selectedImage} onOpenChange={handleCloseDialog}>
                {/* z-index aumentado para 150 para ficar acima do BottomNav (z-100) */}
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none h-[90dvh] md:h-[80vh] flex flex-col md:flex-row z-[150]">
                    {selectedImage && (
                        <InspirationDetails
                            selectedImage={selectedImage}
                            user={user}
                            handleCloseDialog={handleCloseDialog}
                            handleDownload={handleDownload}
                            handleShare={handleShare}
                            setIsZoomed={setIsZoomed}
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

            {/* FAB para Adicionar Inspiração */}
            <div className="fixed bottom-24 right-6 z-50">
                <Button
                    onClick={() => setShowAddInspiration(true)}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Modal de Adicionar Inspiração */}
            <Dialog open={showAddInspiration} onOpenChange={setShowAddInspiration}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Inspiração</DialogTitle>
                        <DialogDescription>
                            Adicione uma foto e detalhes da sua inspiração.
                        </DialogDescription>
                    </DialogHeader>
                    <Form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={() => { setPreviewUrl(null); setShowAddInspiration(false); }}>
                        <div className="flex gap-4 items-start">
                            <div className="relative h-24 w-24 bg-secondary rounded-md flex items-center justify-center overflow-hidden shrink-0 border border-dashed border-muted-foreground/50">
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
                                <Input name="title" placeholder="Título (ex: Vestido Sereia)" required />
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
                            <Button type="submit" name="intent" value="add" disabled={isSubmitting}>
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
