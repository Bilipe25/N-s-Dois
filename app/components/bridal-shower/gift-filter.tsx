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
}

export function GiftFilter({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategorySelect
}: GiftFilterProps) {
    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar presente..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 bg-white"
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

            <ScrollArea className="w-full whitespace-nowrap pb-2">
                <div className="flex w-max space-x-2 p-1">
                    <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => onCategorySelect(null)}
                        className="rounded-full"
                    >
                        Todos
                    </Button>
                    {GIFT_CATEGORIES.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => onCategorySelect(category)}
                            className="rounded-full"
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
