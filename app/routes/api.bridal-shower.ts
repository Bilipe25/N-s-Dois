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

    const [giftsResult, configResult, reservationsResult] = await Promise.all([
        supabase.from("bridal_shower_gifts").select("*").order("item_name"),
        supabase.from("app_config").select("*").single(),
        supabase
            .from("gift_reservations")
            .select("id,gift_id,guest_id,reserved_by_name_snapshot,reserved_at,legacy_source")
            .eq("status", "active")
            .order("reserved_at", { ascending: false }),
    ]);

    if (giftsResult.error) throw data({ error: giftsResult.error.message }, { status: 500 });
    if (configResult.error) throw data({ error: configResult.error.message }, { status: 500 });
    if (reservationsResult.error) throw data({ error: reservationsResult.error.message }, { status: 500 });

    const reservations = reservationsResult.data || [];
    const guestIds = Array.from(new Set(reservations.flatMap((reservation) => reservation.guest_id ? [reservation.guest_id] : [])));
    const guestDetails = new Map<string, {
        name: string;
        phone: string | null;
        rsvpStatus: "pendente" | "confirmado" | "recusado";
        adults: number;
        children: number;
    }>();
    if (guestIds.length > 0) {
        const { data: guests, error: guestsError } = await supabase
            .from("guests")
            .select("id,name,contact_phone,rsvp_status,rsvp_adults,rsvp_children,adults_count,children_count")
            .in("id", guestIds);
        if (guestsError) throw data({ error: guestsError.message }, { status: 500 });
        for (const guest of guests || []) {
            const rsvpStatus = guest.rsvp_status === "confirmado" || guest.rsvp_status === "recusado" ? guest.rsvp_status : "pendente";
            guestDetails.set(String(guest.id), {
                name: String(guest.name).trim(),
                phone: guest.contact_phone ? String(guest.contact_phone).trim() : null,
                rsvpStatus,
                adults: rsvpStatus === "recusado" ? 0 : Number(guest.rsvp_adults ?? guest.adults_count ?? 0),
                children: rsvpStatus === "recusado" ? 0 : Number(guest.rsvp_children ?? guest.children_count ?? 0),
            });
        }
    }

    const reservationByGift = new Map(reservations.map((reservation) => [String(reservation.gift_id), reservation]));
    const gifts = (giftsResult.data || []).map((gift) => {
        const reservation = reservationByGift.get(String(gift.id));
        const guest = reservation?.guest_id ? guestDetails.get(String(reservation.guest_id)) : null;
        return {
            ...gift,
            active_reservation: reservation ? {
                id: reservation.id,
                guest_id: reservation.guest_id,
                guest_name: guest?.name
                    || reservation.reserved_by_name_snapshot
                    || "Identificação legada indisponível",
                guest_phone: guest?.phone || null,
                guest_rsvp_status: guest?.rsvpStatus || "pendente",
                guest_adults: guest?.adults || 0,
                guest_children: guest?.children || 0,
                reserved_at: reservation.reserved_at,
                legacy_source: reservation.legacy_source,
            } : null,
        };
    });

    return { gifts, guests: [], config: configResult.data };
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
                return data({ error: "O status de reserva agora é controlado pela reserva ativa." }, { status: 410 });
            }

            if (intent === "cancel_gift_reservation") {
                const { reservationId } = z.object({ reservationId: z.string().uuid() }).parse(jsonData);
                const { data: cancelled, error } = await supabase
                    .from("gift_reservations")
                    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
                    .eq("id", reservationId)
                    .eq("status", "active")
                    .select("id")
                    .maybeSingle();
                if (error) throw error;
                if (!cancelled) return data({ error: "A reserva já foi cancelada ou não existe." }, { status: 404 });
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
