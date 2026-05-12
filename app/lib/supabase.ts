import { createBrowserClient, createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

function getSupabaseCredentials() {
    const clientEnv =
        typeof window !== "undefined"
            ? ((window as any).ENV ?? {})
            : {};

    return {
        supabaseUrl: typeof window !== "undefined" ? clientEnv.SUPABASE_URL : process.env.SUPABASE_URL,
        supabaseKey: typeof window !== "undefined" ? clientEnv.SUPABASE_ANON_KEY : process.env.SUPABASE_ANON_KEY,
    };
}

export function hasSupabaseEnv() {
    const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
    return Boolean(supabaseUrl && supabaseKey);
}

function requireSupabaseCredentials() {
    const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("SUPABASE_URL e SUPABASE_ANON_KEY não configurados.");
    }

    return { supabaseUrl, supabaseKey };
}

export const createClient = (request?: Request, responseHeaders?: Headers) => {
    const { supabaseUrl, supabaseKey } = requireSupabaseCredentials();

    if (request) {
        return createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return parseCookieHeader(request.headers.get("Cookie") ?? "").map((cookie: any) => ({
                            name: cookie.name,
                            value: cookie.value ?? ""
                        }));
                    },
                    setAll(cookiesToSet: any) {
                        cookiesToSet.forEach(({ name, value, options }: any) => {
                            if (responseHeaders) {
                                responseHeaders.append("Set-Cookie", serializeCookieHeader(name, value, options));
                            }
                        });
                    },
                },
            }
        );
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseKey
    );
};
