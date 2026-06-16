import type { LoaderFunctionArgs } from "react-router";
import { createClient } from "@/lib/supabase";

/**
 * Server-side guest search endpoint for privacy.
 * Returns matching guests based on a search query (ilike).
 * Only exposes id, name, and confirmed status — no phone or other data.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";

    if (query.length < 2) {
        return Response.json({ guests: [] });
    }

    try {
        const supabase = createClient(request);

        const { data: guests, error } = await supabase
            .from("bridal_shower_guests")
            .select("id, name, confirmed")
            .ilike("name", `%${query}%`)
            .order("name")
            .limit(5);

        if (error) {
            console.error("Error searching guests:", error);
            return Response.json({ guests: [] });
        }

        return Response.json(
            { guests: guests || [] },
            {
                headers: {
                    "Cache-Control": "private, max-age=10",
                }
            }
        );
    } catch (error) {
        console.error("Error in guest search:", error);
        return Response.json({ guests: [] });
    }
};
