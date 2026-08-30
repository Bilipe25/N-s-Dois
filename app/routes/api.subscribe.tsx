import type { ActionFunctionArgs } from "react-router";
import { createServerAdminClient } from "@/lib/supabase.server";
import { getSession } from "@/sessions";
import { assertSameOrigin } from "@/lib/security.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    assertSameOrigin(request);
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await request.json();

    if (!subscription) {
        return Response.json({ error: "No subscription provided" }, { status: 400 });
    }

    const supabase = createServerAdminClient();

    // Tentar inserir. Se já existir (user_name + subscription), o banco deve tratar (se tiver unique constraint)
    // Como definimos unique(user_name, subscription) no plano, podemos usar upsert ou ignore.
    // Mas como subscription é JSONB, a comparação exata pode ser chata.
    // Vamos tentar inserir simples.

    const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
            user_name: user,
            subscription
        }, { onConflict: 'user_name, subscription' });

    if (error) {
        // Se for erro de duplicidade (código 23505 no Postgres), ignoramos
        if (error.code === '23505') {
            return Response.json({ success: true, message: "Already subscribed" });
        }
        console.error("Erro ao salvar subscrição:", error);
        return Response.json({
            error: "Database error",
            details: error.message,
            code: error.code,
            hint: error.hint
        }, { status: 500 });
    }

    return Response.json({ success: true });
};
