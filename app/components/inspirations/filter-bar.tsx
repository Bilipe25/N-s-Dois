import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortOption } from "./types";

interface FilterBarProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
}

export function FilterBar({
    categories,
    activeCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
}: FilterBarProps) {
    return (
        <div className="sticky top-0 z-40 bg-[#FDFCF8]/95 backdrop-blur-md border-b border-stone-100 py-3 px-4 space-y-3 transition-all duration-300">
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                        placeholder="Buscar inspirações..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-stone-50 border-stone-200 focus:bg-white transition-colors rounded-full h-10"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0 border-stone-200 hover:bg-stone-50">
                            <SlidersHorizontal className="h-4 w-4 text-stone-600" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onSortChange("recent")} className={sortBy === "recent" ? "bg-stone-100" : ""}>
                            Mais Recentes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("likes")} className={sortBy === "likes" ? "bg-stone-100" : ""}>
                            Mais Curtidas
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-linear-fade">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all duration-300 whitespace-nowrap border ${activeCategory === cat
                                ? "bg-stone-900 text-white border-stone-900 shadow-md transform scale-105"
                                : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                            }`}
                    >
                        {cat === "meus_likes" ? "Meus Likes ❤️" : cat.replace(/_/g, " ")}
                    </button>
                ))}
            </div>
        </div>
    );
}
