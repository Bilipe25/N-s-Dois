import { useState } from "react";
import { useLoaderData, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import type { Route } from "./+types/inspirations";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Inspirações - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: inspirations, error } = await supabase
        .from("inspirations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching inspirations:", error);
        return { inspirations: [] };
    }

    return { inspirations };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add") {
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const notes = formData.get("notes") as string;
        // Photo upload would be here
        const photo_url = "https://placehold.co/600x400/e8d9d6/c39da3?text=Inspiracao"; // Placeholder

        if (title) {
            await supabase.from("inspirations").insert({
                title,
                category,
                notes,
                photo_url
            });
        }
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("inspirations").delete().eq("id", id);
    }

    return null;
};

export default function Inspirations() {
    const { inspirations } = useLoaderData<typeof loader>();
    const [filter, setFilter] = useState<string>("todos");

    const categories = ["todos", "decoracao", "cerimonia", "festa", "vestidos", "lua_de_mel", "outros"];

    const filteredInspirations = inspirations.filter((item: any) => {
        if (filter === "todos") return true;
        return item.category === filter;
    });

    return (
        <div className="p-4 space-y-6 pb-20">
            <header>
                <h1 className="text-2xl font-serif text-primary">Inspirações</h1>
                <p className="text-sm text-muted-foreground">Nossas ideias e referências</p>
            </header>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap ${filter === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {cat.replace(/_/g, " ")}
                    </button>
                ))}
            </div>

            {/* Adicionar Inspiração */}
            <Card>
                <CardContent className="p-3">
                    <Form method="post" className="space-y-2">
                        <Input name="title" placeholder="Título (ex: Vestido Sereia)" required />
                        <div className="flex gap-2">
                            <select
                                name="category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Categoria...</option>
                                <option value="decoracao">Decoração</option>
                                <option value="cerimonia">Cerimônia</option>
                                <option value="festa">Festa</option>
                                <option value="vestidos">Vestidos</option>
                                <option value="lua_de_mel">Lua de Mel</option>
                                <option value="outros">Outros</option>
                            </select>
                            <Button type="submit" name="intent" value="add" className="shrink-0">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Input name="notes" placeholder="Notas (opcional)" className="text-sm" />
                    </Form>
                </CardContent>
            </Card>

            {/* Galeria */}
            <div className="grid grid-cols-2 gap-4">
                {filteredInspirations.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
                        Nenhuma inspiração encontrada.
                    </div>
                ) : (
                    filteredInspirations.map((item: any) => (
                        <Card key={item.id} className="overflow-hidden break-inside-avoid">
                            <div className="relative group">
                                <img src={item.photo_url} alt={item.title} className="w-full h-auto object-cover aspect-[3/4]" />
                                <Form method="post" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <input type="hidden" name="id" value={item.id} />
                                    <Button type="submit" name="intent" value="delete" variant="destructive" size="icon" className="h-6 w-6 rounded-full">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </Form>
                            </div>
                            <CardContent className="p-2">
                                <p className="font-medium text-sm truncate">{item.title}</p>
                                {item.notes && <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
