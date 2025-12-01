import { useState, useEffect } from "react";
import { useFetcher, Form } from "react-router";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Trash2, ZoomIn, Download, Share2, X, Send, ChevronLeft, ChevronRight, Edit2, Save, MessageCircle } from "lucide-react";
import type { Inspiration } from "./types";
import { toast } from "sonner";

interface InspirationDetailsProps {
    inspiration: Inspiration;
    user: string;
    onClose: () => void;
    onDownload: () => void;
    onShare: () => void;
    setIsZoomed: (zoomed: boolean) => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext: boolean;
    hasPrev: boolean;
}

export function InspirationDetails({
    inspiration,
    user,
    onClose,
    onDownload,
    onShare,
    setIsZoomed,
    onNext,
    onPrev,
    hasNext,
    hasPrev
}: InspirationDetailsProps) {
    const fetcher = useFetcher();
    const [commentText, setCommentText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(inspiration.title);
    const [editNotes, setEditNotes] = useState(inspiration.notes || "");
    const [editCategory, setEditCategory] = useState(inspiration.category);

    // Reset edit state when inspiration changes
    useEffect(() => {
        setEditTitle(inspiration.title);
        setEditNotes(inspiration.notes || "");
        setEditCategory(inspiration.category);
        setIsEditing(false);
    }, [inspiration]);

    // Optimistic Likes
    const isLikedOriginal = inspiration.inspiration_likes?.some((l) => l.user_name === user);
    let isLiked = isLikedOriginal;
    let likesCount = inspiration.inspiration_likes?.length || 0;
    let likedBy = inspiration.inspiration_likes?.map((l) => l.user_name) || [];

    if (fetcher.formData?.get("intent") === "toggle_like" && fetcher.formData.get("inspirationId") === inspiration.id) {
        if (isLiked) {
            isLiked = false;
            likesCount--;
            likedBy = likedBy.filter((name) => name !== user);
        } else {
            isLiked = true;
            likesCount++;
            likedBy = [...likedBy, user];
        }
    }

    // Optimistic Comments
    let comments = [...(inspiration.inspiration_comments || [])];
    if (fetcher.formData?.get("intent") === "add_comment" && fetcher.formData.get("inspirationId") === inspiration.id) {
        const newComment = {
            id: "temp-" + Date.now(),
            user_name: user,
            content: fetcher.formData.get("content") as string,
            created_at: new Date().toISOString()
        };
        comments = [newComment, ...comments];
    }

    // Handle key press for navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" && hasNext && onNext) onNext();
            if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasNext, hasPrev, onNext, onPrev, onClose]);

    const handleSaveEdit = () => {
        fetcher.submit(
            { intent: "edit", id: inspiration.id, title: editTitle, notes: editNotes, category: editCategory },
            { method: "post" }
        );
        setIsEditing(false);
        toast.success("Alterações salvas!");
    };

    return (
        <>
            {/* Navigation Buttons (Desktop) */}
            {hasPrev && (
                <button
                    onClick={onPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-[160] p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors hidden md:flex"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}
            {hasNext && (
                <button
                    onClick={onNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-[160] p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors hidden md:flex"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}

            {/* Image Section */}
            <div className="flex-1 bg-black flex items-center justify-center relative h-[40%] md:h-full group overflow-hidden">
                <img
                    src={inspiration.photo_url}
                    alt={inspiration.title}
                    className="max-h-full max-w-full object-contain cursor-zoom-in"
                    onClick={() => setIsZoomed(true)}
                />

                {/* Mobile Navigation Overlay */}
                <div className="absolute inset-0 flex md:hidden">
                    {hasPrev && <div className="w-1/4 h-full" onClick={(e) => { e.stopPropagation(); onPrev?.(); }} />}
                    <div className="flex-1 h-full" onClick={() => setIsZoomed(true)} />
                    {hasNext && <div className="w-1/4 h-full" onClick={(e) => { e.stopPropagation(); onNext?.(); }} />}
                </div>

                <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button onClick={() => setIsZoomed(true)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="Zoom">
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <button onClick={onDownload} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70" title="Baixar">
                        <Download className="h-4 w-4" />
                    </button>
                    <button onClick={onShare} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70" title="Compartilhar">
                        <Share2 className="h-4 w-4" />
                    </button>
                    <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 md:hidden">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Details Section */}
            <div className="w-full md:w-96 flex flex-col bg-background h-[60%] md:h-full border-l shadow-xl z-20">
                <div className="p-5 border-b flex-shrink-0 bg-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 mr-4">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-serif text-lg h-8" />
                                    <select
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                        className="text-xs border rounded px-2 py-1 w-full"
                                    >
                                        <option value="decoracao">Decoração</option>
                                        <option value="cerimonia">Cerimônia</option>
                                        <option value="festa">Festa</option>
                                        <option value="vestidos">Vestidos</option>
                                        <option value="lua_de_mel">Lua de Mel</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <DialogTitle className="text-xl font-serif text-stone-800 leading-tight">{inspiration.title}</DialogTitle>
                                    <DialogDescription className="capitalize text-rose-500 font-medium text-xs mt-1">
                                        {inspiration.category.replace(/_/g, " ")}
                                    </DialogDescription>
                                </>
                            )}
                        </div>

                        <div className="flex gap-1">
                            {isEditing ? (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleSaveEdit}>
                                    <Save className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-stone-400 hover:text-stone-600" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            )}

                            <fetcher.Form method="post" className="flex items-center">
                                <input type="hidden" name="intent" value="toggle_like" />
                                <input type="hidden" name="inspirationId" value={inspiration.id} />
                                <input type="hidden" name="hasLiked" value={isLikedOriginal.toString()} />
                                <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-50">
                                    <Heart className={`h-5 w-5 transition-colors ${isLiked ? "fill-rose-500 text-rose-500" : "text-stone-400"}`} />
                                </Button>
                            </fetcher.Form>

                            <Form method="post" onSubmit={(e) => { if (!confirm("Tem certeza que deseja excluir?")) e.preventDefault(); }}>
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="id" value={inspiration.id} />
                                <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500 text-stone-400">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Form>
                        </div>
                    </div>

                    <div className="text-xs text-stone-500 mb-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {likedBy.slice(0, 3).map((name, i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-rose-100 border border-white flex items-center justify-center text-[8px] font-bold text-rose-600 uppercase">
                                    {name[0]}
                                </div>
                            ))}
                        </div>
                        {likesCount > 0 ? (
                            <span>
                                Curtido por <span className="font-medium text-stone-700">{likedBy.length > 3 ? `${likedBy[0]} e outros ${likedBy.length - 1}` : likedBy.join(" e ")}</span>
                            </span>
                        ) : (
                            <span>Seja o primeiro a curtir!</span>
                        )}
                    </div>

                    {isEditing ? (
                        <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Adicionar notas..." className="text-sm" />
                    ) : (
                        inspiration.notes && (
                            <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-100 italic">
                                "{inspiration.notes}"
                            </p>
                        )
                    )}
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
                    {comments.length === 0 ? (
                        <div className="text-center text-xs text-stone-400 py-8 flex flex-col items-center">
                            <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
                            Nenhum comentário ainda.
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className={`flex flex-col ${comment.user_name === user ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${comment.user_name === user ? "bg-stone-800 text-white rounded-tr-none" : "bg-white text-stone-700 border border-stone-100 rounded-tl-none"}`}>
                                    <p>{comment.content}</p>
                                </div>
                                <span className="text-[10px] text-stone-400 mt-1 px-1 font-medium">
                                    {comment.user_name} • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Input */}
                <div className="p-3 border-t bg-white flex-shrink-0 pb-safe">
                    <fetcher.Form
                        method="post"
                        className="flex gap-2 items-center"
                        onSubmit={() => setCommentText("")}
                    >
                        <input type="hidden" name="intent" value="add_comment" />
                        <input type="hidden" name="inspirationId" value={inspiration.id} />
                        <Input
                            name="content"
                            placeholder="Escreva um comentário..."
                            className="flex-1 h-10 text-sm bg-stone-50 border-stone-200 rounded-full px-4 focus:bg-white transition-colors"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" className="h-10 w-10 rounded-full bg-stone-900 hover:bg-stone-800 shrink-0" disabled={!commentText.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </fetcher.Form>
                </div>
            </div>
        </>
    );
}
