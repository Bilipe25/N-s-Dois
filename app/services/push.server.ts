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
            // Não lançar erro para não quebrar o fluxo principal da aplicação
        } else {
            // console.log("Push enviado com sucesso:", data);
        }
    } catch (err) {
        console.error("Exceção ao enviar push:", err);
    }
}
