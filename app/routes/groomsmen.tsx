import { useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import type { Route } from "./+types/groomsmen";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Padrinhos - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: groomsmen, error } = await supabase
        .from("groomsmen")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching groomsmen:", error);
        return { groomsmen: [] };
    }

    return { groomsmen };
};

export default function Groomsmen() {
    const { groomsmen } = useLoaderData<typeof loader>();

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-serif text-primary">Padrinhos</h1>
                {/* Botão de adicionar no cabeçalho também, opcional */}
            </header>

            {/* Lista de Padrinhos */}
            <div className="grid grid-cols-2 gap-4">
                {groomsmen.map((person: any) => (
                    <Card key={person.id} className="overflow-hidden">
                        <div className="aspect-square bg-secondary flex items-center justify-center relative group">
                            {person.photo_url ? (
                                <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <User className="h-12 w-12" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {/* Ações futuras como editar/excluir podem vir aqui */}
                            </div>
                        </div>
                        <CardContent className="p-3 text-center">
                            <h3 className="font-medium text-sm truncate">{person.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{person.role}</p>
                            <p className="text-[10px] text-primary/80 font-serif italic">Lado {person.side === 'Noivo' ? 'do Noivo' : 'da Noiva'}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {groomsmen.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Nenhum padrinho ou madrinha cadastrado.</p>
                    <p className="text-sm mt-2">Clique no + para adicionar.</p>
                </div>
            )}

            <div className="fixed bottom-20 right-4 z-40">
                <Button asChild size="icon" className="h-14 w-14 rounded-full shadow-lg">
                    <Link to="/groomsmen/new">
                        <Plus className="h-6 w-6" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
