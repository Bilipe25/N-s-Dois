import { Form, useActionData, useLoaderData } from "react-router";
import { getSession } from "@/sessions";
import { sendPushToUser } from "@/services/push.server";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";

export const loader = async ({ request }: any) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");
    if (!user) return { user: null };
    return { user };
};

export const action = async ({ request }: any) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) return { error: "Usuário não logado" };

    try {
        console.log("Iniciando teste de push para:", user);
        await sendPushToUser(
            request,
            user,
            "Teste de Push 🔔",
            "Se você recebeu isso, o sistema está funcionando!",
            "/test-push"
        );
        return { success: true, message: "Comando de envio executado. Verifique o terminal para logs da Edge Function." };
    } catch (error: any) {
        console.error("Erro no action de teste:", error);
        return { error: error.message };
    }
};

export default function TestPush() {
    const { user } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    if (!user) return <div>Faça login primeiro.</div>;

    return (
        <div className="p-8 max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold">Teste de Push Notification</h1>
            <p>Usuário atual: <strong>{user}</strong></p>

            <div className="bg-muted p-4 rounded-md text-sm">
                <p>1. Certifique-se de estar inscrito (vá em Configurações).</p>
                <p>2. Clique no botão abaixo.</p>
                <p>3. Se funcionar, você receberá uma notificação.</p>
                <p>4. Se não, verifique o terminal onde o `npm run dev` está rodando.</p>
            </div>

            <Form method="post">
                <Button type="submit" className="w-full">
                    Enviar Notificação de Teste
                </Button>
            </Form>

            {actionData?.success && (
                <div className="p-4 bg-green-100 text-green-800 rounded-md">
                    {actionData.message}
                </div>
            )}

            {actionData?.error && (
                <div className="p-4 bg-red-100 text-red-800 rounded-md">
                    Erro: {actionData.error}
                </div>
            )}
        </div>
    );
}
