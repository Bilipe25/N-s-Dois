import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { GIFT_CATEGORIES } from "@/schemas/bridal-shower";

interface GiftFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string | null;
    onCategorySelect: (category: string | null) => void;
    selectedStatus?: "all" | "disponivel" | "comprado";
    onStatusSelect?: (status: "all" | "disponivel" | "comprado") => void;
}

export function GiftFilter({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategorySelect,
    selectedStatus,
    onStatusSelect
}: GiftFilterProps) {
    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar presente..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-white h-10"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => onSearchChange("")}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {onStatusSelect && (
                    <div className="flex bg-stone-100/50 p-1 rounded-lg border border-stone-200">
                        <Button
                            variant={selectedStatus === "all" ? "default" : "ghost"}
                            size="sm"
                            className={`flex-1 sm:flex-none ${selectedStatus === "all" ? "shadow-sm" : ""}`}
                            onClick={() => onStatusSelect("all")}
                        >
                            Todos
                        </Button>
                        <Button
                            variant={selectedStatus === "disponivel" ? "default" : "ghost"}
                            size="sm"
                            className={`flex-1 sm:flex-none ${selectedStatus === "disponivel" ? "bg-green-600 text-white shadow-sm hover:bg-green-700" : "hover:text-green-600"}`}
                            onClick={() => onStatusSelect("disponivel")}
                        >
                            Disponíveis
                        </Button>
                        <Button
                            variant={selectedStatus === "comprado" ? "default" : "ghost"}
                            size="sm"
                            className={`flex-1 sm:flex-none ${selectedStatus === "comprado" ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600" : "hover:text-rose-500"}`}
                            onClick={() => onStatusSelect("comprado")}
                        >
                            Reservados
                        </Button>
                    </div>
                )}
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-2">
                <div className="flex w-max space-x-2 p-1">
                    <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => onCategorySelect(null)}
                        className={`rounded-full ${selectedCategory === null ? 'bg-stone-800 text-white hover:bg-stone-900' : 'bg-white'}`}
                    >
                        Todas Categorias
                    </Button>
                    {GIFT_CATEGORIES.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => onCategorySelect(category)}
                            className={`rounded-full ${selectedCategory === category ? 'bg-stone-800 text-white hover:bg-stone-900' : 'bg-white'}`}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
