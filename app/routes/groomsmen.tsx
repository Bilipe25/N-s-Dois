
import { useState } from "react";
import { useLoaderData, Link, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, User, Trash2, Pencil } from "lucide-react";
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

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("groomsmen").delete().eq("id", id);
    }

    return null;
};

export default function Groomsmen() {
    const { groomsmen } = useLoaderData<typeof loader>();
    const [roleFilter, setRoleFilter] = useState<string>("todos");

    const roles = ["todos", "padrinho", "madrinha", "daminha", "pajem"];

    const filterGroomsmen = (side: string) => {
        return groomsmen.filter((person: any) => {
            const matchesSide = person.side === side;
            const matchesRole = roleFilter === "todos" ? true : person.role === roleFilter;
            return matchesSide && matchesRole;
        });
    };

    const renderList = (side: string) => {
        const list = filterGroomsmen(side);

        if (list.length === 0) {
            return (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Ninguém deste lado cadastrado com este filtro.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-4">
                {list.map((person: any) => (
                    <Card key={person.id} className="overflow-hidden relative group">
                        <div className="aspect-square bg-secondary flex items-center justify-center relative">
                            {person.photo_url ? (
                                <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <User className="h-12 w-12" />
                                </div>
                            )}

                            {/* Overlay com Ações */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                                    <Link to={`/groomsmen/${person.id}`}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Form method="post" onSubmit={(e) => {
                                    if (!confirm("Tem certeza que deseja remover?")) {
                                        e.preventDefault();
                                    }
                                }}>
                                    <input type="hidden" name="id" value={person.id} />
                                    <Button type="submit" name="intent" value="delete" variant="destructive" size="icon" className="h-8 w-8 rounded-full">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </Form>
                            </div>
                        </div>
                        <CardContent className="p-3 text-center">
                            <h3 className="font-medium text-sm truncate">{person.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{person.role}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 space-y-6 pb-20">


            {/* Filtro de Função */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {roles.map((role) => (
                    <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap ${roleFilter === role
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {role}
                    </button>
                ))}
            </div>

            <Tabs defaultValue="noiva" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="noiva">Time da Noiva</TabsTrigger>
                    <TabsTrigger value="noivo">Time do Noivo</TabsTrigger>
                </TabsList>
                <TabsContent value="noiva">
                    {renderList("noiva")}
                </TabsContent>
                <TabsContent value="noivo">
                    {renderList("noivo")}
                </TabsContent>
            </Tabs>

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
