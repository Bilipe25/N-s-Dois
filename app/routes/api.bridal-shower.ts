import { type ActionFunctionArgs, type LoaderFunctionArgs, data } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession, requireUserSession } from "@/sessions";
import {
    CreateGiftSchema,
    UpdateGiftSchema,
    CreateGuestSchema,
    UpdateConfigSchema,
    BulkUpdateCategorySchema
} from "@/schemas/bridal-shower";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const supabase = createClient(request);
    const session = await getSession(request.headers.get("Cookie"));
    const isAdmin = Boolean(session.get("user"));
    const giftFields = isAdmin
        ? "*"
        : "id, item_name, category, status, suggested_store, link, price_range, image_url, reserved_by, reserved_at, created_at";
    const guestFields = isAdmin
        ? "*"
        : "id, name, confirmed, confirmed_location, created_at";
    const configFields = isAdmin
        ? "*"
        : [
            "id",
            "bridal_shower_date",
            "bridal_shower_location",
            "bridal_shower_address_1",
            "bridal_shower_map_link_1",
            "bridal_shower_date_2",
            "bridal_shower_location_2",
            "bridal_shower_address_2",
            "bridal_shower_map_link_2",
            "bridal_shower_hero_url",
            "pix_key",
            "contact_phone_gabriel",
            "contact_phone_raabe"
        ].join(", ");

    // Fetch Gifts
    const { data: gifts, error: giftsError } = await supabase
        .from("bridal_shower_gifts")
        .select(giftFields)
        .order("item_name");

    if (giftsError) throw data({ error: giftsError.message }, { status: 500 });

    // Fetch Guests
    const { data: guests, error: guestsError } = await supabase
        .from("bridal_shower_guests")
        .select(guestFields)
        .order("name");

    if (guestsError) throw data({ error: guestsError.message }, { status: 500 });

    // Fetch Config
    const { data: config, error: configError } = await supabase
        .from("app_config")
        .select(configFields)
        .single();

    if (configError) throw data({ error: configError.message }, { status: 500 });

    // Non-admin users get empty guests for privacy.
    // The public page uses /api/bridal-shower-search-guests for autocomplete.
    return { gifts, guests: isAdmin ? guests : [], config };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    await requireUserSession(request);
    const supabase = createClient(request);
    const method = request.method;
    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    try {
        if (method === "POST") {
            const jsonData = await request.json();

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
                const { gifts } = jsonData;
                if (!Array.isArray(gifts)) throw new Error("Invalid format");

                const { error } = await supabase.from("bridal_shower_gifts").insert(gifts);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "import_guests") {
                // Expects an array of guests
                const { guests } = jsonData;
                if (!Array.isArray(guests)) throw new Error("Invalid format");

                const { error } = await supabase.from("bridal_shower_guests").insert(guests);
                if (error) throw error;
                return { success: true };
            }
        }

        if (method === "PUT") {
            const jsonData = await request.json();

            if (intent === "update_gift") {
                const parsedData = UpdateGiftSchema.parse(jsonData);
                const { id, ...updates } = parsedData;
                const { error } = await supabase.from("bridal_shower_gifts").update(updates).eq("id", id);
                if (error) throw error;
                return { success: true };
            }

            if (intent === "toggle_gift_status") {
                const { id, currentStatus } = jsonData;
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
                const { id, current } = jsonData;
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
                    contact_phone_gabriel: parsedData.contact_phone_gabriel,
                    contact_phone_raabe: parsedData.contact_phone_raabe
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

    } catch (error: any) {
        console.error("API Error:", error);
        return data({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
};
