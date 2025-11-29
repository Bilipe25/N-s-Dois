import { ActionFunctionArgs, json } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";

export const action = async ({ request }: ActionFunctionArgs) => {
    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await request.json();

    if (!subscription) {
        return json({ error: "No subscription provided" }, { status: 400 });
    }

    const supabase = createClient(request);

    // Tentar inserir. Se já existir (user_name + subscription), o banco deve tratar (se tiver unique constraint)
    // Como definimos unique(user_name, subscription) no plano, podemos usar upsert ou ignore.
    // Mas como subscription é JSONB, a comparação exata pode ser chata.
    // Vamos tentar inserir simples.

    const { error } = await supabase
        .from("push_subscriptions")
        .insert({
            user_name: user,
            subscription
        });

    if (error) {
        // Se for erro de duplicidade (código 23505 no Postgres), ignoramos
        if (error.code === '23505') {
            return json({ success: true, message: "Already subscribed" });
        }
        console.error("Erro ao salvar subscrição:", error);
        return json({ error: "Database error" }, { status: 500 });
    }

    return json({ success: true });
};
