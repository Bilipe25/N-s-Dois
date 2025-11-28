
import { useState } from "react";
import { useLoaderData, Link, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, User, Trash2, Pencil, MoreHorizontal } from "lucide-react";
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

                            {/* Menu de Ações */}
                            <div className="absolute top-1 right-1 z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full opacity-90 hover:opacity-100 shadow-sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link to={`/groomsmen/${person.id}`} className="cursor-pointer flex items-center gap-2">
                                                <Pencil className="h-4 w-4" />
                                                <span>Editar</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Form method="post" className="w-full">
                                                <input type="hidden" name="id" value={person.id} />
                                                <button
                                                    type="submit"
                                                    name="intent"
                                                    value="delete"
                                                    className="flex w-full items-center gap-2 text-destructive cursor-pointer"
                                                    onClick={(e) => {
                                                        if (!confirm("Tem certeza que deseja remover?")) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span>Excluir</span>
                                                </button>
                                            </Form>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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
