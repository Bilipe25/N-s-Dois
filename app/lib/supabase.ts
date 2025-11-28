import { createBrowserClient, createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

export const createClient = (request?: Request, responseHeaders?: Headers) => {
    if (request) {
        return createServerClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!,
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
        (window as any).ENV.SUPABASE_URL,
        (window as any).ENV.SUPABASE_ANON_KEY
    );
};
