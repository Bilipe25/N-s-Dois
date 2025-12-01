import { Heart, MessageCircle, Download } from "lucide-react";
import type { Inspiration } from "./types";
import { Button } from "@/components/ui/button";

interface InspirationCardProps {
    inspiration: Inspiration;
    onClick: () => void;
    isLiked: boolean;
    onToggleLike: (e: React.MouseEvent) => void;
    onDownload: (e: React.MouseEvent) => void;
}

export function InspirationCard({ inspiration, onClick, isLiked, onToggleLike, onDownload }: InspirationCardProps) {
    const commentsCount = inspiration.inspiration_comments?.length || 0;
    const likesCount = inspiration.inspiration_likes?.length || 0;

    return (
        <div
            className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden mb-4 shadow-sm border border-stone-100 bg-white hover:shadow-lg transition-all duration-300"
            onClick={onClick}
        >
            <img
                src={inspiration.photo_url}
                alt={inspiration.title}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex justify-between items-end">
                    <div className="text-white">
                        <p className="font-medium text-sm truncate max-w-[150px]">{inspiration.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/90">
                            <div className="flex items-center gap-1">
                                <Heart className={`h-3 w-3 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                                <span>{likesCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{commentsCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-sm"
                            onClick={onDownload}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className={`h-8 w-8 rounded-full border-none backdrop-blur-sm ${isLiked ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-white/20 hover:bg-white/40 text-white"}`}
                            onClick={onToggleLike}
                        >
                            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
