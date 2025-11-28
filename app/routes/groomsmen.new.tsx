import { Form, useNavigation, useActionData, redirect } from "react-router";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, User } from "lucide-react";
import type { Route } from "./+types/groomsmen.new";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Novo Padrinho - Nós Dois" }];
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const side = formData.get("side") as string;
    const photo = formData.get("photo") as File;

    const supabase = createClient(request);

    let photoUrl = null;

    if (photo && photo.size > 0) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `groomsman_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, photo);

        if (uploadError) {
            return { error: `Erro no upload da foto: ${uploadError.message}` };
        }

        const { data } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        photoUrl = data.publicUrl;
    }

    const { error } = await supabase.from("groomsmen").insert({
        name,
        role,
        side,
        photo_url: photoUrl
    });

    if (error) {
        return { error: `Erro ao salvar: ${error.message}` };
    }

    return redirect("/groomsmen");
};

export default function NewGroomsman() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <Card>
                <CardContent className="p-6">
                    <Form method="post" encType="multipart/form-data" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" required placeholder="Ex: João Silva" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Função</Label>
                                <Select name="role" required defaultValue="Padrinho">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Padrinho">Padrinho</SelectItem>
                                        <SelectItem value="Madrinha">Madrinha</SelectItem>
                                        <SelectItem value="Daminha">Daminha</SelectItem>
                                        <SelectItem value="Pajem">Pajem</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="side">Lado</Label>
                                <Select name="side" required defaultValue="Noivo">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Noivo">Do Noivo</SelectItem>
                                        <SelectItem value="Noiva">Da Noiva</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="photo">Foto (Opcional)</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <Input
                                    id="photo"
                                    name="photo"
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <UploadCloud className="h-8 w-8" />
                                    <span className="text-xs">Toque para selecionar uma foto</span>
                                </div>
                            </div>
                        </div>

                        {actionData?.error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {actionData.error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Adicionar Padrinho"}
                        </Button>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
