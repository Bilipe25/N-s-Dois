import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    useMessageWall,
    useCreateMessage,
    useDeleteMessage
} from "@/hooks/useBridalShower";
import { MessageSquare, Send, Trash2, Heart, Calendar } from "lucide-react";
import { toast } from "sonner";

const getMessageStyle = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rotations = [
        "-rotate-1 hover:rotate-0",
        "rotate-1 hover:rotate-0",
        "-rotate-2 hover:rotate-0",
        "rotate-2 hover:rotate-0",
        "rotate-0 hover:scale-[1.02]"
    ];
    const rotation = rotations[Math.abs(hash) % rotations.length];
    const gradients = [
        "from-amber-50 to-amber-100/40 dark:from-amber-950/15 dark:to-amber-900/5 border-amber-200/60 dark:border-amber-900/30",
        "from-rose-50 to-rose-100/40 dark:from-rose-950/15 dark:to-rose-900/5 border-rose-200/60 dark:border-rose-900/30",
        "from-pink-50 to-pink-100/40 dark:from-pink-950/15 dark:to-pink-900/5 border-pink-200/60 dark:border-pink-900/30",
        "from-orange-50 to-orange-100/40 dark:from-orange-950/15 dark:to-orange-900/5 border-orange-200/60 dark:border-orange-900/30",
        "from-emerald-50 to-emerald-100/40 dark:from-emerald-950/15 dark:to-emerald-900/5 border-emerald-200/60 dark:border-emerald-900/30"
    ];
    const gradient = gradients[Math.abs(hash) % gradients.length];
    return { rotation, gradient };
};

interface MessageWallSectionProps {
    isAdmin?: boolean;
}

export function MessageWallSection({ isAdmin = false }: MessageWallSectionProps) {
    const { data: messages = [], isLoading } = useMessageWall();
    const createMessage = useCreateMessage();
    const deleteMessage = useDeleteMessage();

    const [authorName, setAuthorName] = useState("");
    const [messageText, setMessageText] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!authorName.trim()) {
            toast.error("Por favor, preencha o seu nome.");
            return;
        }

        if (!messageText.trim()) {
            toast.error("Por favor, escreva uma mensagem.");
            return;
        }

        try {
            await createMessage.mutateAsync({
                author_name: authorName.trim(),
                message: messageText.trim()
            });
            toast.success("Mensagem enviada para o mural! ❤️");
            setAuthorName("");
            setMessageText("");
        } catch (err) {
            // Error is handled by hook
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza de que deseja remover esta mensagem do mural?")) {
            try {
                await deleteMessage.mutateAsync(id);
            } catch (err) {
                // Error is handled by hook
            }
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "";
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <section className="space-y-8 py-12 border-t border-border/40">
            <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center justify-center p-2 bg-pink-100 dark:bg-pink-950/30 text-pink-600 rounded-full mb-2">
                    <Heart className="h-6 w-6 fill-current animate-pulse" />
                </div>
                <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground sm:text-4xl">
                    Mural de Mensagens
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Deixe uma mensagem especial e carinhosa para os noivos nesta nova fase!
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto px-4">
                {/* Form column */}
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-primary/10 sticky top-24 backdrop-blur bg-card/90">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                                <MessageSquare className="h-5 w-5 text-pink-500" />
                                Deixe sua Mensagem
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="authorName">Seu Nome</Label>
                                    <Input
                                        id="authorName"
                                        value={authorName}
                                        onChange={(e) => setAuthorName(e.target.value)}
                                        placeholder="Como quer ser identificado"
                                        disabled={createMessage.isPending}
                                        className="bg-background/50"
                                        maxLength={50}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="messageText">Mensagem</Label>
                                    <Textarea
                                        id="messageText"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Sua mensagem de carinho..."
                                        rows={4}
                                        disabled={createMessage.isPending}
                                        className="bg-background/50 resize-none"
                                        maxLength={300}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={createMessage.isPending}
                                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium shadow-md shadow-pink-500/20 transition-all active:scale-[0.98]"
                                >
                                    {createMessage.isPending ? (
                                        "Enviando..."
                                    ) : (
                                        <>
                                            Enviar Mensagem
                                            <Send className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Messages grid column */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[1, 2, 3, 4].map((n) => (
                                <Card key={n} className="animate-pulse bg-muted h-32" />
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16 bg-muted/25 rounded-2xl border-2 border-dashed border-muted/50 max-w-md mx-auto">
                            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
                            <p className="text-muted-foreground text-sm font-medium">
                                Nenhuma mensagem enviada ainda.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Seja o primeiro a deixar uma mensagem especial!
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid gap-4 sm:grid-cols-2"
                        >
                            <AnimatePresence mode="popLayout">
                                {messages.map((msg) => {
                                    const { rotation, gradient } = getMessageStyle(msg.id || "");
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            variants={itemVariants}
                                            layout
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className={`group relative transition-all duration-300 transform ${rotation}`}
                                        >
                                            <Card className={`h-full shadow-sm hover:shadow-md transition-shadow duration-300 border bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                                                {/* Decorative small heart */}
                                                <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity duration-300 text-pink-500 pointer-events-none">
                                                    <Heart className="h-16 w-16 fill-current" />
                                                </div>

                                                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                                                    <p className="text-sm text-foreground/80 font-serif leading-relaxed italic whitespace-pre-wrap">
                                                        "{msg.message}"
                                                    </p>

                                                <div className="flex items-center justify-between text-xs border-t border-border/40 pt-3 mt-auto">
                                                    <div>
                                                        <span className="font-semibold text-foreground">
                                                            {msg.author_name}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(msg.created_at)}
                                                        </div>
                                                    </div>

                                                    {isAdmin && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(msg.id!)}
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}
