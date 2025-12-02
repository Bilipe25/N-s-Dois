import { Link, useFetcher } from "react-router";
import { Phone, DollarSign, FileText, Pencil, MoreHorizontal, Trash2, Star, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Supplier, SUPPLIER_STATUSES, SUPPLIER_CATEGORIES } from "./types";

interface SupplierCardProps {
    supplier: Supplier;
}

export function SupplierCard({ supplier }: SupplierCardProps) {
    const fetcher = useFetcher();
    const statusConfig = SUPPLIER_STATUSES[supplier.status] || SUPPLIER_STATUSES.pesquisando;
    const categoryIcon = SUPPLIER_CATEGORIES.find(c => c.name === supplier.category)?.icon || "✨";

    // WhatsApp Link Logic
    const getWhatsAppLink = (contact?: string | null) => {
        if (!contact) return null;
        const nums = contact.replace(/\D/g, "");
        if (nums.length >= 10) return `https://wa.me/55${nums}`;
        return null;
    };

    const whatsappLink = getWhatsAppLink(supplier.contact_info);

    return (
        <Card className="overflow-hidden border-l-4 border-l-transparent hover:border-l-stone-900 transition-all hover:scale-[1.01] duration-300 hover:shadow-md group">
            {supplier.photo_url && (
                <div className="h-32 w-full overflow-hidden relative">
                    <img src={supplier.photo_url} alt={supplier.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white font-medium text-lg drop-shadow-md flex items-center gap-2">
                        <span>{categoryIcon}</span>
                        {supplier.name}
                    </div>
                </div>
            )}

            <CardHeader className={`${supplier.photo_url ? 'pt-3' : 'pb-2'}`}>
                <div className="flex justify-between items-start">
                    {!supplier.photo_url && (
                        <div>
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1">
                                {categoryIcon} {supplier.category}
                            </span>
                            <CardTitle className="text-lg text-stone-900">{supplier.name}</CardTitle>
                        </div>
                    )}
                    {supplier.photo_url && (
                        <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">{supplier.category}</span>
                    )}

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`capitalize font-normal ${statusConfig.color}`}>
                            {statusConfig.label}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-stone-400">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link to={`/suppliers/${supplier.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                        <Pencil className="h-4 w-4" /> Editar
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-red-600 focus:text-red-600">
                                    <fetcher.Form method="post" action={`/suppliers/${supplier.id}`}>
                                        <input type="hidden" name="id" value={supplier.id} />
                                        <button type="submit" name="intent" value="delete" className="flex w-full items-center gap-2 cursor-pointer">
                                            <Trash2 className="h-4 w-4" /> Excluir
                                        </button>
                                    </fetcher.Form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="text-sm space-y-3">
                {/* Price & Budget Info */}
                {(supplier.price || supplier.total_paid) && (
                    <div className="flex justify-between items-center bg-stone-50 p-2 rounded-lg border border-stone-100">
                        {supplier.price && (
                            <div>
                                <p className="text-[10px] text-stone-500 uppercase">Valor Total</p>
                                <p className="font-semibold text-stone-900">
                                    {Number(supplier.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        )}
                        {supplier.total_paid ? (
                            <div className="text-right">
                                <p className="text-[10px] text-stone-500 uppercase">Pago</p>
                                <p className="font-semibold text-emerald-600">
                                    {Number(supplier.total_paid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Contact & WhatsApp */}
                {supplier.contact_info && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-stone-600 truncate max-w-[70%]">
                            <Phone className="h-3.5 w-3.5 mr-2 text-stone-400" />
                            <span className="truncate">{supplier.contact_info}</span>
                        </div>
                        {whatsappLink && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100" asChild>
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> Zap
                                </a>
                            </Button>
                        )}
                    </div>
                )}

                {/* Rating & Notes */}
                {(supplier.rating || supplier.notes) && (
                    <div className="pt-2 border-t border-stone-100 space-y-1">
                        {supplier.rating && supplier.rating > 0 && (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < (supplier.rating || 0) ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
                                    />
                                ))}
                            </div>
                        )}
                        {supplier.notes && (
                            <p className="text-xs text-stone-500 italic line-clamp-2">
                                "{supplier.notes}"
                            </p>
                        )}
                    </div>
                )}

                {/* Contract Button */}
                {supplier.contract_url && (
                    <div className="pt-1">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs border-stone-200 text-stone-600" asChild>
                            <a href={supplier.contract_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-3 w-3 mr-2" /> Ver Contrato
                            </a>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
