import { SUPPLIER_STATUSES } from "./types";
import type { Supplier } from "./types";
import { SupplierCard } from "./supplier-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SupplierKanbanProps {
    suppliers: Supplier[];
}

export function SupplierKanban({ suppliers }: SupplierKanbanProps) {
    const columns = Object.entries(SUPPLIER_STATUSES).map(([key, config]) => ({
        id: key as Supplier['status'],
        label: config.label,
        color: config.color,
        items: suppliers.filter(s => s.status === key)
    }));

    return (
        <div className="h-[calc(100svh-220px)] w-full overflow-x-auto pb-4">
            <div className="flex gap-4 h-full min-w-[1000px] px-2">
                {columns.map(col => (
                    <div key={col.id} className="flex-1 min-w-[280px] flex flex-col bg-stone-50/50 rounded-xl border border-stone-100 h-full">
                        {/* Column Header */}
                        <div className={`p-3 border-b border-stone-100 flex items-center justify-between rounded-t-xl ${col.color.replace('text-', 'bg-').replace('100', '50').split(' ')[0]}`}>
                            <h3 className={`font-semibold text-sm ${col.color.split(' ')[1]}`}>
                                {col.label}
                            </h3>
                            <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full text-stone-500 shadow-sm border border-stone-100">
                                {col.items.length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <ScrollArea className="flex-1 p-2">
                            <div className="space-y-3">
                                {col.items.map(supplier => (
                                    <SupplierCard key={supplier.id} supplier={supplier} />
                                ))}
                                {col.items.length === 0 && (
                                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-stone-200 rounded-lg m-2">
                                        <p className="text-xs text-stone-400">Vazio</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                ))}
            </div>
        </div>
    );
}
