import { Search, Filter, X, Check, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GuestFilter } from "./types";

interface GuestFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filter: GuestFilter;
    onFilterChange: (filter: GuestFilter) => void;
    groupFilter: string;
    onGroupFilterChange: (group: string) => void;
    groups: string[];
    selectedCount: number;
    onBulkConfirm: () => void;
    onBulkDelete: () => void;
    onClearSelection: () => void;
}

export function GuestFilters({
    searchTerm,
    onSearchChange,
    filter,
    onFilterChange,
    groupFilter,
    onGroupFilterChange,
    groups,
    selectedCount,
    onBulkConfirm,
    onBulkDelete,
    onClearSelection
}: GuestFiltersProps) {
    return (
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 pt-2 space-y-3">
            {/* Search and Group Filter Row */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar convidado..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className={`shrink-0 ${groupFilter !== 'todos' ? 'border-primary text-primary bg-primary/5' : ''}`}>
                            <Filter className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onGroupFilterChange("todos")}>
                            Todos os Grupos
                        </DropdownMenuItem>
                        {groups.map((group) => (
                            <DropdownMenuItem key={group} onClick={() => onGroupFilterChange(group)}>
                                {group}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Status Chips or Bulk Actions */}
            <div className="flex items-center justify-between min-h-[32px]">
                {selectedCount > 0 ? (
                    <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-sm font-medium text-primary mr-auto">
                            {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
                        </span>
                        <Button size="sm" variant="ghost" onClick={onClearSelection} className="h-8 text-muted-foreground">
                            Cancelar
                        </Button>
                        <Button size="sm" onClick={onBulkConfirm} className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white border-0">
                            <Check className="h-3 w-3" />
                            Confirmar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={onBulkDelete} className="h-8 gap-1">
                            <Trash2 className="h-3 w-3" />
                            Excluir
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {(["todos", "confirmado", "pendente", "recusado"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => onFilterChange(f)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all whitespace-nowrap border ${filter === f
                                    ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
