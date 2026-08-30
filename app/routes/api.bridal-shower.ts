import { type ActionFunctionArgs, type LoaderFunctionArgs, data } from "react-router";
import { createServerAdminClient } from "@/lib/supabase.server";
import { requireUserSession } from "@/sessions";
import { assertSameOrigin } from "@/lib/security.server";
import { readJsonBody } from "@/lib/security.server";
import { z } from "zod";
import {
    CreateGiftSchema,
    UpdateGiftSchema,
    CreateGuestSchema,
    UpdateConfigSchema,
    BulkUpdateCategorySchema
} from "@/schemas/bridal-shower";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createServerAdminClient();

    // Fetch Gifts
    const { data: gifts, error: giftsError } = await supabase
        .from("bridal_shower_gifts")
        .select("*")
        .order("item_name");

    if (giftsError) throw data({ error: giftsError.message }, { status: 500 });

    // Fetch Config
    const { data: config, error: configError } = await supabase
        .from("app_config")
        .select("*")
        .single();

    if (configError) throw data({ error: configError.message }, { status: 500 });

    return { gifts, guests: [], config };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    await requireUserSession(request);
    assertSameOrigin(request);
    const supabase = createServerAdminClient();
    const method = request.method;
    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    try {
        if (method === "POST") {
            // Se for upload de imagem, tratamos como formData
            if (intent === "upload_gift_image") {
                const formData = await request.formData();
                const photo = formData.get("photo") as File | null;

                if (!photo || photo.size === 0 || photo.name === "undefined") {
                    throw new Error("Nenhum arquivo enviado");
                }

                const fileExt = photo.name.split('.').pop();
                const fileName = `gift_${Date.now()}.${fileExt}`;

                const arrayBuffer = await photo.arrayBuffer();
                const fileBuffer = Buffer.from(arrayBuffer);

                const { error: uploadError } = await supabase.storage
                    .from("images")
                    .upload(fileName, fileBuffer, {
                        contentType: photo.type,
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("images").getPublicUrl(fileName);
                return { success: true, photo_url: data.publicUrl };
            }

            const jsonData = await readJsonBody(request, 262_144);

            if (intent === "create_gift") {
                const parsedData = CreateGiftSchema.parse(jsonData);
                const { error } = await supabase.from("bridal_shower_gifts").insert({
                    ...parsedData,
                    status: "disponivel"
                });
                if (error) throw error;
                return { success: true };
            }

            if (intent === "create_guest") {
                const parsedData = CreateGuestSchema.parse(jsonData);
                const { error } = await supabase.from("bridal_shower_guests").insert({
                    ...parsedData,
                    confirmed: false
                });
                if (error) throw error;
                return { success: true };
            }

            if (intent === "import_gifts") {
                // Expects an array of gifts
                const { gifts } = z.object({ gifts: z.array(CreateGiftSchema).min(1).max(500) }).parse(jsonData);

                const { error } = await supabase.from("bridal_shower_gifts").insert(gifts);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "import_guests") {
                // Expects an array of guests
                const { guests } = z.object({ guests: z.array(CreateGuestSchema).min(1).max(500) }).parse(jsonData);

                const { error } = await supabase.from("bridal_shower_guests").insert(guests);
                if (error) throw error;
                return { success: true };
            }
        }

        if (method === "PUT") {
            const jsonData = await readJsonBody(request, 65_536);

            if (intent === "update_gift") {
                const parsedData = UpdateGiftSchema.parse(jsonData);
                const { id, ...updates } = parsedData;
                const { error } = await supabase.from("bridal_shower_gifts").update(updates).eq("id", id);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "toggle_gift_status") {
                const { id, currentStatus } = z.object({ id: z.string().uuid(), currentStatus: z.enum(["disponivel", "comprado"]) }).parse(jsonData);
                const newStatus = currentStatus === 'comprado' ? 'disponivel' : 'comprado';
                const { error } = await supabase.from("bridal_shower_gifts").update({ status: newStatus }).eq("id", id);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "bulk_update_category") {
                const parsedData = BulkUpdateCategorySchema.parse(jsonData);
                const { ids, category } = parsedData;
                const { error } = await supabase.from("bridal_shower_gifts").update({ category }).in("id", ids);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "toggle_guest_confirm") {
                const { id, current } = z.object({ id: z.string().uuid(), current: z.boolean() }).parse(jsonData);
                const { error } = await supabase.from("bridal_shower_guests").update({ confirmed: !current }).eq("id", id);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "update_config") {
                const parsedData = UpdateConfigSchema.parse(jsonData);
                const id = url.searchParams.get("id");
                if (!id) throw new Error("Config ID required");

                const { error } = await supabase.from("app_config").update({
                    bridal_shower_date: parsedData.date || null,
                    bridal_shower_location: parsedData.location,
                    bridal_shower_address_1: parsedData.address_1,
                    bridal_shower_map_link_1: parsedData.map_link_1,
                    bridal_shower_date_2: parsedData.date_2 || null,
                    bridal_shower_location_2: parsedData.location_2,
                    bridal_shower_address_2: parsedData.address_2,
                    bridal_shower_map_link_2: parsedData.map_link_2,
                    bridal_shower_hero_url: parsedData.hero_url,
                    pix_key: parsedData.pix_key,
                    pix_recipient_name: parsedData.pix_recipient_name,
                    pix_city: parsedData.pix_city,
                    contact_phone_gabriel: parsedData.contact_phone_gabriel,
                    contact_phone_raabe: parsedData.contact_phone_raabe,
                    bridal_shower_show_links: parsedData.show_links,
                    bridal_shower_show_prices: parsedData.show_prices
                }).eq("id", id);
                if (error) throw error;
                return { success: true };
            }
        }

        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) throw new Error("ID required");

            if (intent === "delete_gift") {
                const { error } = await supabase.from("bridal_shower_gifts").delete().eq("id", id);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "delete_guest") {
                const { error } = await supabase.from("bridal_shower_guests").delete().eq("id", id);
                if (error) throw error;
                return { success: true };
            }
        }

        return data({ error: "Invalid intent or method" }, { status: 400 });

    } catch (error: unknown) {
        console.error("API Error:", error);
        if (error instanceof z.ZodError) return data({ error: "Revise os dados informados." }, { status: 400 });
        return data({ error: "Não foi possível concluir a operação." }, { status: 500 });
    }
};
