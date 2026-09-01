import { Link } from "react-router";
import { MoreVertical, Pencil, MessageCircle, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Guest } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { confirmedCounts, formatRsvpTimestamp, latestResponseAt } from "@/lib/guest-rsvp";
import { normalizeWhatsAppPhone } from "@/lib/celebration-whatsapp";

interface GuestListProps {
    guests: Guest[];
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onUpdateRSVP: (id: string, status: "confirmado" | "recusado" | "pendente") => void;
    onDelete: (id: string) => void;
    onGuestClick?: (guest: Guest) => void;
    onWhatsApp: (guest: Guest) => void;
}

export function GuestList({ guests, selectedIds, onToggleSelect, onUpdateRSVP, onDelete, onGuestClick, onWhatsApp }: GuestListProps) {
    return (
        <div className="space-y-2 pb-24">
            <AnimatePresence mode="popLayout">
                {guests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center"
                    >
                        <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                            <UsersIcon className="h-6 w-6 text-stone-300" />
                        </div>
                        <p>Nenhum convidado encontrado.</p>
                    </motion.div>
                ) : (
                    guests.map((guest) => (
                        <GuestItem
                            key={guest.id}
                            guest={guest}
                            isSelected={selectedIds.includes(guest.id)}
                            onToggleSelect={() => onToggleSelect(guest.id)}
                            onUpdateRSVP={onUpdateRSVP}
                            onDelete={onDelete}
                            onGuestClick={onGuestClick}
                            onWhatsApp={onWhatsApp}
                        />
                    ))
                )}
            </AnimatePresence>
        </div>
    );
}

function GuestItem({
    guest,
    isSelected,
    onToggleSelect,
    onUpdateRSVP,
    onDelete,
    onGuestClick,
    onWhatsApp,
}: {
    guest: Guest,
    isSelected: boolean,
    onToggleSelect: () => void,
    onUpdateRSVP: (id: string, status: "confirmado" | "recusado" | "pendente") => void,
    onDelete: (id: string) => void,
    onGuestClick?: (guest: Guest) => void,
    onWhatsApp: (guest: Guest) => void,
}) {
    // Optimistic RSVP is handled by React Query now, so we just use the prop
    const rsvpStatus = guest.rsvp_status;

    const initials = guest.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const statusColors = {
        confirmado: "bg-green-100 text-green-700 border-green-200",
        recusado: "bg-red-100 text-red-700 border-red-200",
        pendente: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    const statusLabel = rsvpStatus === "confirmado" ? "Confirmado" : rsvpStatus === "recusado" ? "Recusado" : "Pendente";
    const counts = confirmedCounts(guest);
    const responseTime = formatRsvpTimestamp(latestResponseAt(guest));
    const hasWhatsApp = Boolean(normalizeWhatsAppPhone(guest.phone));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onGuestClick?.(guest)}
            onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
                    event.preventDefault();
                    onGuestClick?.(guest);
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Abrir detalhes de ${guest.name}`}
            className={`
                group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer
                ${isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-stone-100 hover:border-stone-200 hover:shadow-sm"}
            `}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        aria-label={`Selecionar ${guest.name}`}
                        className={`h-6 w-6 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'} data-[state=checked]:opacity-100`}
                    />
                </div>

                <div className={`
                    h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border
                    ${statusColors[rsvpStatus as keyof typeof statusColors] || statusColors.pendente}
                `}>
                    {initials}
                </div>

                <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-stone-800"><span className="truncate">{guest.name}</span>{guest.source === "public_rsvp" && <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-violet-700">Novo pelo site</span>}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium text-stone-600">{guest.group_name}</span>
                        <span className={`rounded-full border px-2 py-0.5 font-semibold ${statusColors[rsvpStatus]}`}>{statusLabel}</span>
                        <span>{counts.adults} adulto{counts.adults !== 1 ? "s" : ""} · {counts.children} criança{counts.children !== 1 ? "s" : ""}</span>
                        {responseTime && <span>Resposta: {responseTime}</span>}
                    </div>
                </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Ações para ${guest.name}`} className="h-11 w-11 text-stone-500 hover:text-stone-700">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                            <Link to={`/guests/${guest.id}`} className="cursor-pointer flex items-center">
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!hasWhatsApp}
                            onSelect={() => onWhatsApp(guest)}
                            className="cursor-pointer text-green-700 focus:text-green-800"
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>{hasWhatsApp ? "WhatsApp" : "WhatsApp não informado"}</span>
                        </DropdownMenuItem>

                        {rsvpStatus !== 'confirmado' && (
                            <DropdownMenuItem onClick={() => onUpdateRSVP(guest.id, "confirmado")} className="cursor-pointer">
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                <span>Confirmar Presença</span>
                            </DropdownMenuItem>
                        )}

                        {rsvpStatus !== 'recusado' && (
                            <DropdownMenuItem onClick={() => onUpdateRSVP(guest.id, "recusado")} className="cursor-pointer">
                                <X className="mr-2 h-4 w-4 text-red-600" />
                                <span>Recusar Presença</span>
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                            onClick={() => { if (confirm("Tem certeza?")) onDelete(guest.id) }}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
