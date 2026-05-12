import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";
import { UpdateAssetSchema } from "@/schemas/assets";
import { requireUserSession } from "@/sessions";

// GET - Listar assets
export const loader = async ({ request }: LoaderFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);

    // Buscar assets manuais
    const { data: assets, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching assets:", error);
        return Response.json({ assets: [], reservedGifts: [] });
    }

    // Buscar presentes reservados do Chá de Casa Nova
    const { data: reservedGifts } = await supabase
        .from("bridal_shower_gifts")
        .select("id, item_name, category, reserved_by, reserved_at, image_url, price_range")
        .eq("status", "comprado")
        .order("reserved_at", { ascending: false });

    return Response.json({
        assets: assets || [],
        reservedGifts: reservedGifts || []
    });
};

// POST - Criar asset
export const action = async ({ request }: ActionFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);

    if (request.method === "POST") {
        try {
            const formData = await request.formData();
            const photo = formData.get("photo") as File | null;

            let photo_url = formData.get("photo_url") as string || null;

            // Upload de foto se fornecida
            if (photo && photo.size > 0 && photo.name !== "undefined") {
                const fileExt = photo.name.split('.').pop();
                const fileName = `asset_${Date.now()}.${fileExt}`;

                const arrayBuffer = await photo.arrayBuffer();
                const fileBuffer = Buffer.from(arrayBuffer);

                const { error: uploadError } = await supabase.storage
                    .from("images")
                    .upload(fileName, fileBuffer, {
                        contentType: photo.type,
                        upsert: true
                    });

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from("images")
                        .getPublicUrl(fileName);
                    photo_url = data.publicUrl;
                }
            }

            // Montar objeto apenas com campos básicos
            const insertData: Record<string, any> = {
                name: formData.get("name") as string,
                category: formData.get("category") as string || "Outros",
                value: parseFloat(formData.get("value") as string) || 0,
            };

            // Adicionar campos opcionais se existirem
            const notes = formData.get("notes") as string;
            if (notes) insertData.notes = notes;
            if (photo_url) insertData.photo_url = photo_url;

            const { data: asset, error } = await supabase
                .from("assets")
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;

            return Response.json({ success: true, asset });
        } catch (error: any) {
            console.error("Error creating asset:", error);
            return Response.json({ error: error.message || "Erro ao criar bem" }, { status: 400 });
        }
    }

    if (request.method === "PUT") {
        try {
            const body = await request.json();
            const validated = UpdateAssetSchema.parse(body);
            const { id, ...updates } = validated;

            const { data: asset, error } = await supabase
                .from("assets")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            return Response.json({ success: true, asset });
        } catch (error: any) {
            console.error("Error updating asset:", error);
            return Response.json({ error: error.message || "Erro ao atualizar bem" }, { status: 400 });
        }
    }

    if (request.method === "DELETE") {
        try {
            const url = new URL(request.url);
            const id = url.searchParams.get("id");

            if (!id) {
                return Response.json({ error: "ID é obrigatório" }, { status: 400 });
            }

            const { error } = await supabase
                .from("assets")
                .delete()
                .eq("id", id);

            if (error) throw error;

            return Response.json({ success: true });
        } catch (error: any) {
            console.error("Error deleting asset:", error);
            return Response.json({ error: error.message || "Erro ao excluir bem" }, { status: 400 });
        }
    }

    return Response.json({ error: "Método não permitido" }, { status: 405 });
};
