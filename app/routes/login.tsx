import { Form, Link, useActionData, useNavigation, redirect, useLoaderData } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { commitSession, getSession } from "@/sessions";
import { createClient } from "@/lib/supabase";
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Login - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: config } = await supabase.from("app_config").select("login_photo_url").single();
    return { config };
};

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    // Validação simples e hardcoded conforme solicitado
    if (
        (name.toLowerCase() === "gabriel" && password === "2708") ||
        (name.toLowerCase() === "raabe" && password === "2708")
    ) {
        const session = await getSession(request.headers.get("Cookie"));
        session.set("user", name);

        return redirect("/", {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
    }

    return { error: "Nome ou senha incorretos." };
};

export default function Login() {
    const { config } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
            {/* Background Image se existir */}
            {config?.login_photo_url && (
                <div className="fixed inset-0 z-0">
                    <img src={config.login_photo_url} alt="Login Background" className="w-full h-full object-cover opacity-30 blur-sm" />
                    <div className="absolute inset-0 bg-background/60" />
                </div>
            )}

            <Card className="w-full max-w-md border-primary/20 shadow-lg z-10 bg-card/90 backdrop-blur-sm">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                        <Heart className="w-8 h-8 text-primary fill-primary" />
                    </div>
                    <CardTitle className="text-3xl font-serif text-primary">Nós Dois</CardTitle>
                    <CardDescription>
                        Entre para organizar nosso casamento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" name="name" required placeholder="Gabriel ou Raabe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>

                        {actionData?.error && (
                            <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                                {actionData.error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Entrando..." : "Entrar"}
                        </Button>
                    </Form>
                </CardContent>
                <CardFooter className="justify-center text-xs text-muted-foreground">
                    Feito com amor por Gabriel
                </CardFooter>
            </Card>
        </div>
    );
}
