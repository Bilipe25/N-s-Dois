import type { ActionFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { ReserveGiftSchema } from "@/schemas/bridal-shower";
import { sendPushToUser } from "@/services/push.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const jsonData = await request.json();
        const { id, name } = ReserveGiftSchema.parse(jsonData);

        const supabase = createClient(request);

        // Check if gift exists and is available
        const { data: gift, error: fetchError } = await supabase
            .from("bridal_shower_gifts")
            .select("item_name, status")
            .eq("id", id)
            .single();

        if (fetchError || !gift) {
            return Response.json({ error: "Presente não encontrado." }, { status: 404 });
        }

        if (gift.status === 'comprado') {
            return Response.json({ error: "Este presente já foi reservado por outra pessoa." }, { status: 400 });
        }

        // Update gift status
        const { error: updateError } = await supabase
            .from("bridal_shower_gifts")
            .update({
                status: "comprado",
                reserved_by: name,
                reserved_at: new Date().toISOString()
            })
            .eq("id", id);

        if (updateError) {
            throw updateError;
        }

        // Send Notifications - don't throw if this fails
        try {
            await supabase.from("notifications").insert({
                type: "gift",
                title: "Novo Presente Reservado! 🎁",
                message: `${name} reservou o presente "${gift.item_name}" no Chá de Casa Nova.`,
                link: "/bridal-shower"
            });

            await sendPushToUser(request, "all", "Novo Presente Reservado! 🎁", `${name} reservou o presente "${gift.item_name}" no Chá de Casa Nova.`, "/bridal-shower");
        } catch (notifError) {
            console.error("Error sending notification for gift reservation (non-fatal):", notifError);
        }

        // Return success with a random verse
        const verses = [
            "Nós amamos porque ele nos amou primeiro. (1 João 4:19)",
            "O meu mandamento é este: amem-se uns aos outros como eu os amei. (João 15:12)",
            "Acima de tudo, porém, revistam-se do amor, que é o elo perfeito. (Colossenses 3:14)",
            "Quem não ama não conhece a Deus, porque Deus é amor. (1 João 4:8)",
            "Assim, permanecem agora estes três: a fé, a esperança e o amor. O maior deles, porém, é o amor. (1 Coríntios 13:13)",
            "Com amor eterno eu te amei. (Jeremias 31:3)",
            "O amor é paciente, o amor é bondoso. (1 Coríntios 13:4)",
            "Tudo o que fizerem, façam com amor. (1 Coríntios 16:14)"
        ];
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];

        return Response.json({
            success: true,
            giftName: gift.item_name,
            guestName: name,
            verse: randomVerse
        });

    } catch (error: any) {
        console.error("Error reserving gift:", error);
        return Response.json({ error: error.message || "Erro ao reservar presente." }, { status: 500 });
    }
};
