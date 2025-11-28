import { Form, Link, useActionData, useNavigation, redirect } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";
import type { Route } from "./+types/suppliers.new";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Novo Fornecedor - Nós Dois" }];
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const contact_info = formData.get("contact_info") as string;
    const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;
    const status = formData.get("status") as string;

    // File upload handling would go here
    // const photo = formData.get("photo") as File;
    // const contract = formData.get("contract") as File;

    const supabase = createClient(request);

    const { error } = await supabase.from("suppliers").insert({
        name,
        category,
        contact_info,
        price,
        status,
    });

    if (error) {
        return { error: error.message };
    }

    return redirect("/suppliers");
};

export default function NewSupplier() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="p-4 space-y-6">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/suppliers">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-serif text-primary">Novo Fornecedor</h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Fornecedor</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form method="post" encType="multipart/form-data" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" required placeholder="Ex: Buffet Delícia" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <select
                                id="category"
                                name="category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="Buffet">Buffet</option>
                                <option value="Decoração">Decoração</option>
                                <option value="Fotografia">Fotografia</option>
                                <option value="Vídeo">Vídeo</option>
                                <option value="Música">Música</option>
                                <option value="Local">Local</option>
                                <option value="Cerimonial">Cerimonial</option>
                                <option value="Doces/Bolo">Doces/Bolo</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_info">Contato</Label>
                            <Input id="contact_info" name="contact_info" placeholder="Telefone, Email ou Instagram" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Valor (R$)</Label>
                            <Input id="price" name="price" type="number" step="0.01" placeholder="0,00" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                name="status"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue="pesquisando"
                            >
                                <option value="pesquisando">Pesquisando</option>
                                <option value="negociando">Negociando</option>
                                <option value="contratado">Contratado</option>
                                <option value="pago">Pago</option>
                            </select>
                        </div>

                        {/* Upload placeholder - to be implemented */}
                        <div className="space-y-2">
                            <Label>Contrato / Foto</Label>
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
                                <Upload className="h-8 w-8 mb-2" />
                                <span className="text-xs">Upload em breve</span>
                            </div>
                        </div>

                        {actionData?.error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {actionData.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Fornecedor"}
                        </Button>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
