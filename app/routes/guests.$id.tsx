import { useLoaderData, Form, Link, redirect, useNavigation } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { Route } from "./+types/guests.$id";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Editar Convidado - Nós Dois" }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { id } = params;

    const { data: guest, error } = await supabase
        .from("guests")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !guest) {
        throw new Response("Convidado não encontrado", { status: 404 });
    }

    return { guest };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    const formData = await request.formData();
    const supabase = createClient(request);
    const { id } = params;

    const name = formData.get("name") as string;
    const group_name = formData.get("group_name") as string;
    const adults_count = parseInt(formData.get("adults_count") as string) || 1;
    const children_count = parseInt(formData.get("children_count") as string) || 0;
    const rsvp_status = formData.get("rsvp_status") as string;

    const { error } = await supabase
        .from("guests")
        .update({
            name,
            group_name,
            adults_count,
            children_count,
            rsvp_status
        })
        .eq("id", id);

    if (error) {
        return { error: "Erro ao atualizar convidado" };
    }

    return redirect("/guests");
};

export default function EditGuest() {
    const { guest } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link to="/guests">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Editar Convidado</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Dados do Convidado</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome Completo</label>
                            <Input name="name" defaultValue={guest.name} required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Grupo</label>
                            <select
                                name="group_name"
                                defaultValue={guest.group_name}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="Família Noivo">Família Noivo</option>
                                <option value="Família Noiva">Família Noiva</option>
                                <option value="Amigos Noivo">Amigos Noivo</option>
                                <option value="Amigos Noiva">Amigos Noiva</option>
                                <option value="Igreja">Igreja</option>
                                <option value="Trabalho">Trabalho</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Adultos</label>
                                <Input
                                    name="adults_count"
                                    type="number"
                                    min="1"
                                    defaultValue={guest.adults_count}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Crianças</label>
                                <Input
                                    name="children_count"
                                    type="number"
                                    min="0"
                                    defaultValue={guest.children_count}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status RSVP</label>
                            <select
                                name="rsvp_status"
                                defaultValue={guest.rsvp_status}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="pendente">Pendente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="recusado">Recusado</option>
                            </select>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
