import { createClient } from "@/lib/supabase";

export async function sendPushToUser(
    request: Request,
    userName: string,
    title: string,
    body: string,
    url: string = "/",
    image?: string
) {
    const supabase = createClient(request);

    try {
        const { data, error } = await supabase.functions.invoke('send-push', {
            body: {
                userName,
                title,
                body,
                url,
                image
            }
        });

        if (error) {
            console.error("Erro ao invocar Edge Function send-push:", error);
            if (error instanceof Error) {
                console.error("Stack:", error.stack);
            }
        } else {
            console.log("Push enviado com sucesso. Resposta da Function:", data);
        }
    } catch (err) {
        console.error("Exceção CRÍTICA ao enviar push:", err);
    }
}
