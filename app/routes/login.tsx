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
            {/* Background Image se existir */}
            {config?.login_photo_url && (
                <div className="fixed inset-0 z-0">
                    <img src={config.login_photo_url} alt="Login Background" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            )}

            <Card className="w-full max-w-md border-white/20 shadow-2xl z-10 bg-black/30 backdrop-blur-md text-white">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-white/10 p-4 rounded-full w-fit backdrop-blur-sm border border-white/20 shadow-inner">
                        <Heart className="w-10 h-10 text-white fill-white/20" />
                    </div>
                    <CardTitle className="text-4xl font-serif text-white drop-shadow-md">Nós Dois</CardTitle>
                    <CardDescription className="text-white/80 font-medium">
                        Entre para organizar nosso casamento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form method="post" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">Nome</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                placeholder="Gabriel ou Raabe"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30 focus-visible:border-white/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-white/10 border-white/20 text-white focus-visible:ring-white/30 focus-visible:border-white/50"
                            />
                        </div>

                        {actionData?.error && (
                            <div className="text-sm text-red-200 bg-red-500/20 p-2 rounded border border-red-500/30 text-center">
                                {actionData.error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-lg h-11 text-base transition-all hover:scale-[1.02]"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Entrando..." : "Entrar"}
                        </Button>
                    </Form>
                </CardContent>
                <CardFooter className="justify-center text-xs text-white/60">
                    Feito com amor por Gabriel
                </CardFooter>
            </Card>
        </div>
    );
}
