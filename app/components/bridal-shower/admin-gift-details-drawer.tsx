import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Edit, Check, X, Gift as GiftIcon, Tag, DollarSign, Store, User, Clock, ExternalLink } from "lucide-react";
import type { Gift } from "@/schemas/bridal-shower";

interface AdminGiftDetailsDrawerProps {
    gift: Gift | null;
    onClose: () => void;
    onEdit: (gift: Gift) => void;
    toggleStatus: any;
}

export function AdminGiftDetailsDrawer({ gift, onClose, onEdit, toggleStatus }: AdminGiftDetailsDrawerProps) {
    return (
        <Drawer open={!!gift} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="max-h-[90vh]">
                {gift && (
                    <>
                        <DrawerHeader className="text-left border-b pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${gift.status === 'comprado' ? 'bg-green-100' : 'bg-stone-100'}`}>
                                        <GiftIcon className={`h-6 w-6 ${gift.status === 'comprado' ? 'text-green-600' : 'text-stone-600'}`} />
                                    </div>
                                    <div>
                                        <DrawerTitle className="text-xl">{gift.item_name}</DrawerTitle>
                                        <Badge
                                            variant={gift.status === 'comprado' ? 'default' : 'secondary'}
                                            className={gift.status === 'comprado' ? 'bg-green-500 mt-1' : 'mt-1'}
                                        >
                                            {gift.status === 'comprado' ? '✓ Reservado' : 'Disponível'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </DrawerHeader>

                        <div className="px-4 py-4 space-y-4 overflow-y-auto">
                            {/* Imagem */}
                            {gift.image_url && (
                                <div className="rounded-xl overflow-hidden border bg-stone-50">
                                    <img
                                        src={gift.image_url}
                                        alt={gift.item_name}
                                        className="w-full h-48 object-contain"
                                    />
                                </div>
                            )}

                            {/* Informações */}
                            <div className="grid grid-cols-2 gap-3">
                                {gift.category && (
                                    <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <Tag className="h-4 w-4 text-stone-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-stone-400 uppercase tracking-wide">Categoria</p>
                                            <p className="text-sm font-medium text-stone-700">{gift.category}</p>
                                        </div>
                                    </div>
                                )}

                                {gift.price_range && (
                                    <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <DollarSign className="h-4 w-4 text-stone-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-stone-400 uppercase tracking-wide">Faixa de Preço</p>
                                            <p className="text-sm font-medium text-stone-700">{gift.price_range}</p>
                                        </div>
                                    </div>
                                )}

                                {gift.suggested_store && (
                                    <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <Store className="h-4 w-4 text-stone-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-stone-400 uppercase tracking-wide">Loja Sugerida</p>
                                            <p className="text-sm font-medium text-stone-700">{gift.suggested_store}</p>
                                        </div>
                                    </div>
                                )}

                                {gift.reserved_by && (
                                    <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <User className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-green-600 uppercase tracking-wide">Reservado por</p>
                                            <p className="text-sm font-medium text-green-700">{gift.reserved_by}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {gift.reserved_at && (
                                <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <Clock className="h-4 w-4 text-stone-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-stone-400 uppercase tracking-wide">Data da Reserva</p>
                                        <p className="text-sm font-medium text-stone-700">
                                            {new Date(gift.reserved_at).toLocaleString('pt-BR', {
                                                dateStyle: 'long',
                                                timeStyle: 'short'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Link */}
                            {gift.link && (
                                <a
                                    href={gift.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                                >
                                    <div className="bg-blue-500 p-2 rounded-lg">
                                        <ExternalLink className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-700">Ver na Loja</p>
                                        <p className="text-xs text-blue-500 truncate">{gift.link}</p>
                                    </div>
                                </a>
                            )}
                        </div>

                        <DrawerFooter className="border-t pt-4 flex-row gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    onEdit(gift);
                                    onClose();
                                }}
                            >
                                <Edit className="h-4 w-4 mr-2" /> Editar
                            </Button>
                            <Button
                                variant={gift.status === 'comprado' ? 'outline' : 'default'}
                                className={`flex-1 ${gift.status !== 'comprado' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                onClick={() => {
                                    toggleStatus.mutate({ id: gift.id, currentStatus: gift.status });
                                    onClose();
                                }}
                            >
                                {gift.status === 'comprado' ? (
                                    <><X className="h-4 w-4 mr-2" /> Disponível</>
                                ) : (
                                    <><Check className="h-4 w-4 mr-2" /> Reservado</>
                                )}
                            </Button>
                        </DrawerFooter>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    );
}
