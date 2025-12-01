import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { MoreHorizontal, Pencil, MessageCircle, Check, X, Trash2, Phone } from "lucide-react";
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

interface GuestListProps {
    guests: Guest[];
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
}

export function GuestList({ guests, selectedIds, onToggleSelect }: GuestListProps) {
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
                        />
                    ))
                )}
            </AnimatePresence>
        </div>
    );
}

function GuestItem({ guest, isSelected, onToggleSelect }: { guest: Guest, isSelected: boolean, onToggleSelect: () => void }) {
    const fetcher = useFetcher();

    // Optimistic RSVP
    let rsvpStatus = guest.rsvp_status;
    if (fetcher.formData?.get("intent") === "rsvp_action" && fetcher.formData.get("id") === guest.id) {
        rsvpStatus = fetcher.formData.get("status") as any;
    }

    const isDeleting = fetcher.formData?.get("intent") === "delete" && fetcher.formData.get("id") === guest.id;

    if (isDeleting) return null;

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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
                group flex items-center justify-between p-3 rounded-xl border transition-all duration-200
                ${isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-stone-100 hover:border-stone-200 hover:shadow-sm"}
            `}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelect}
                    className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} data-[state=checked]:opacity-100`}
                />

                <div className={`
                    h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border
                    ${statusColors[rsvpStatus]}
                `}>
                    {initials}
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{guest.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-medium">{guest.group_name}</span>
                        <span>•</span>
                        <span>{guest.adults_count + guest.children_count} pessoas</span>
                    </div>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-600">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                        <Link to={`/guests/${guest.id}`} className="cursor-pointer flex items-center">
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`https://wa.me/?text=Olá ${guest.name.split(' ')[0]}, você foi convidado para o nosso casamento! Veja todos os detalhes e confirme sua presença aqui: https://nosdois-mu.vercel.app/public/wedding`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer flex items-center text-green-600"
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>Enviar Convite</span>
                        </a>
                    </DropdownMenuItem>

                    {rsvpStatus !== 'confirmado' && (
                        <DropdownMenuItem asChild>
                            <fetcher.Form method="post" className="w-full cursor-pointer">
                                <input type="hidden" name="id" value={guest.id} />
                                <input type="hidden" name="status" value="confirmado" />
                                <button type="submit" name="intent" value="rsvp_action" className="flex w-full items-center">
                                    <Check className="mr-2 h-4 w-4 text-green-600" />
                                    <span>Confirmar Presença</span>
                                </button>
                            </fetcher.Form>
                        </DropdownMenuItem>
                    )}

                    {rsvpStatus !== 'recusado' && (
                        <DropdownMenuItem asChild>
                            <fetcher.Form method="post" className="w-full cursor-pointer">
                                <input type="hidden" name="id" value={guest.id} />
                                <input type="hidden" name="status" value="recusado" />
                                <button type="submit" name="intent" value="rsvp_action" className="flex w-full items-center">
                                    <X className="mr-2 h-4 w-4 text-red-600" />
                                    <span>Recusar Presença</span>
                                </button>
                            </fetcher.Form>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                        <fetcher.Form method="post" className="w-full cursor-pointer">
                            <input type="hidden" name="id" value={guest.id} />
                            <button type="submit" name="intent" value="delete" className="flex w-full items-center">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span onClick={(e) => { if (!confirm("Tem certeza?")) e.preventDefault() }}>Excluir</span>
                            </button>
                        </fetcher.Form>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
