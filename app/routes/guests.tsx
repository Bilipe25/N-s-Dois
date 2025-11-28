import { useState } from "react";
import { useLoaderData, Form } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Users } from "lucide-react";
import type { Route } from "./+types/guests";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Convidados - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: guests, error } = await supabase
        .from("guests")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching guests:", error);
        return { guests: [] };
    }

    return { guests };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const supabase = createClient(request);

    if (intent === "add") {
        const name = formData.get("name") as string;
        const group_name = formData.get("group_name") as string;
        const adults_count = parseInt(formData.get("adults_count") as string) || 1;

        if (!name) return null;

        await supabase.from("guests").insert({
            name,
            group_name,
            adults_count,
            rsvp_status: "pendente"
        });
    } else if (intent === "delete") {
        const id = formData.get("id") as string;
        await supabase.from("guests").delete().eq("id", id);
    }

    return null;
};

export default function Guests() {
    const { guests } = useLoaderData<typeof loader>();
    const [filter, setFilter] = useState<"todos" | "confirmado" | "pendente" | "recusado">("todos");

    const filteredGuests = guests.filter((guest: any) => {
        if (filter === "todos") return true;
        return guest.rsvp_status === filter;
    });

    const totalGuests = guests.reduce((acc: any, curr: any) => acc + (curr.adults_count || 0) + (curr.children_count || 0), 0);
    const confirmedGuests = guests.filter((g: any) => g.rsvp_status === 'confirmado').reduce((acc: any, curr: any) => acc + (curr.adults_count || 0) + (curr.children_count || 0), 0);

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-serif text-primary">Convidados</h1>
                    <p className="text-sm text-muted-foreground">
                        {confirmedGuests} confirmados de {totalGuests}
                    </p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="text-primary w-6 h-6" />
                </div>
            </header>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-3 gap-2">
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-green-700">
                            {guests.filter((g: any) => g.rsvp_status === 'confirmado').length}
                        </div>
                        <div className="text-[10px] text-green-600 uppercase font-medium">Sim</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-yellow-700">
                            {guests.filter((g: any) => g.rsvp_status === 'pendente').length}
                        </div>
                        <div className="text-[10px] text-yellow-600 uppercase font-medium">Talvez</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-red-700">
                            {guests.filter((g: any) => g.rsvp_status === 'recusado').length}
                        </div>
                        <div className="text-[10px] text-red-600 uppercase font-medium">Não</div>
                    </CardContent>
                </Card>
            </div>

            {/* Adicionar Convidado */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Adicionar Convidado</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <Form method="post" className="space-y-2">
                        <div className="flex gap-2">
                            <Input name="name" placeholder="Nome completo" className="flex-1" required />
                            <Input name="adults_count" type="number" placeholder="Qtd" className="w-16" min="1" defaultValue="1" />
                        </div>
                        <div className="flex gap-2">
                            <select
                                name="group_name"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Grupo...</option>
                                <option value="Família Noivo">Família Noivo</option>
                                <option value="Família Noiva">Família Noiva</option>
                                <option value="Amigos Noivo">Amigos Noivo</option>
                                <option value="Amigos Noiva">Amigos Noiva</option>
                                <option value="Igreja">Igreja</option>
                                <option value="Trabalho">Trabalho</option>
                                <option value="Outros">Outros</option>
                            </select>
                            <Button type="submit" name="intent" value="add" className="shrink-0">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </Form>
                </CardContent>
            </Card>

            {/* Lista de Convidados */}
            <div className="space-y-2">
                {filteredGuests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum convidado encontrado.
                    </div>
                ) : (
                    filteredGuests.map((guest: any) => (
                        <div
                            key={guest.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card border-border"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                  h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${guest.rsvp_status === 'confirmado' ? 'bg-green-100 text-green-700' :
                                        guest.rsvp_status === 'recusado' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'}
                `}>
                                    {guest.adults_count + (guest.children_count || 0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{guest.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{guest.group_name}</p>
                                </div>
                            </div>

                            <Form method="post">
                                <input type="hidden" name="id" value={guest.id} />
                                <Button
                                    type="submit"
                                    name="intent"
                                    value="delete"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Form>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
