import { type ActionFunctionArgs, type LoaderFunctionArgs, data } from "react-router";
import { createClient } from "@/lib/supabase";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const supabase = createClient(request);

    let { data: config, error } = await supabase
        .from("app_config")
        .select("*")
        .single();

    if (!config && !error) {
        // Create default if not exists (handling similar logic to original loader)
        const { data: newConfig, error: createError } = await supabase
            .from("app_config")
            .insert({ wedding_date: '2025-09-20 16:00:00-03' })
            .select()
            .single();

        if (!createError) config = newConfig;
    }

    if (error) {
        // If error is "PGRST116" (no rows), it's handled above, otherwise return error
        if (error.code !== "PGRST116") {
            throw data({ error: error.message }, { status: 500 });
        }
    }

    return { config };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const method = request.method;

    if (method === "POST") {
        const formData = await request.formData();

        // Server-side environment variables
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            return data({ error: "Server misconfiguration" }, { status: 500 });
        }

        const supabaseAdmin = createSupabaseJsClient(supabaseUrl, serviceRoleKey);

        // Get current config ID
        let { data: currentConfig } = await supabaseAdmin.from("app_config").select("id").single();
        let configId = currentConfig?.id;

        if (!configId) {
            const { data: newConfig } = await supabaseAdmin
                .from("app_config")
                .insert({ wedding_date: '2025-09-20 16:00:00-03' })
                .select()
                .single();
            configId = newConfig?.id;
        }

        if (!configId) {
            return data({ error: "Could not initialize config" }, { status: 500 });
        }

        const updates: any = {};
        const wedding_date = formData.get("wedding_date");
        const wedding_address = formData.get("wedding_address");

        if (wedding_date) updates.wedding_date = wedding_date;
        if (wedding_address) updates.wedding_address = wedding_address;

        // Handle File Uploads
        const files = [
            { key: "login_photo", dbField: "login_photo_url", prefix: "login" },
            { key: "home_photo", dbField: "home_photo_url", prefix: "home" },
            { key: "bridal_hero_photo", dbField: "bridal_shower_hero_url", prefix: "bridal_hero" },
            { key: "logo", dbField: "logo_url", prefix: "logo" },
        ];

        for (const fileInfo of files) {
            const file = formData.get(fileInfo.key) as File;
            if (file && file.size > 0) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${fileInfo.prefix}_${Date.now()}.${fileExt}`;
                const arrayBuffer = await file.arrayBuffer();
                const fileBuffer = Buffer.from(arrayBuffer);

                const { error: uploadError } = await supabaseAdmin.storage
                    .from("images")
                    .upload(fileName, fileBuffer, {
                        contentType: file.type,
                        upsert: true
                    });

                if (uploadError) {
                    return data({ error: `Error uploading ${fileInfo.key}: ${uploadError.message}` }, { status: 500 });
                }

                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from("images")
                    .getPublicUrl(fileName);

                updates[fileInfo.dbField] = publicUrl;
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from("app_config")
            .update(updates)
            .eq("id", configId);

        if (updateError) {
            return data({ error: updateError.message }, { status: 500 });
        }

        return { success: true };
    }

    return data({ error: "Method not allowed" }, { status: 405 });
};
