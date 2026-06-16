import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "@/components/ui/sonner";

function getTrustedLogoUrl(value: unknown, supabaseUrl?: string) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const logoUrl = new URL(value);
    const configuredSupabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : null;

    if (
      configuredSupabaseOrigin &&
      logoUrl.hostname.endsWith(".supabase.co") &&
      logoUrl.origin !== configuredSupabaseOrigin
    ) {
      return null;
    }

    return logoUrl.href;
  } catch {
    return null;
  }
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap",
  },
  { rel: "manifest", href: "/manifest.json" },
];

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": "private, max-age=0, must-revalidate",
});

export async function loader({ request }: Route.LoaderArgs) {
  // Precisamos criar o cliente aqui para buscar a config, mas cuidado com loops se usar auth
  // Vamos usar fetch direto ou criar cliente anonimo simples se possivel, ou apenas passar ENV
  // Para simplificar e evitar overhead no root, vamos passar apenas ENV e fazer o fetch no client se precisar,
  // MAS para o favicon funcionar no SSR, precisamos buscar aqui.

  // Nota: Em Remix/React Router v7, loader roda no server.
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  let logoUrl = "/favicon.ico"; // Default

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/app_config?select=logo_url&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].logo_url) {
          logoUrl = getTrustedLogoUrl(data[0].logo_url, supabaseUrl) || logoUrl;
        }
      }
    } catch (e) {
      console.error("Erro ao buscar logo no root:", e);
    }
  }

  return {
    logoUrl,
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || "",
      PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || new URL(request.url).origin,
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  // useRouteLoaderData retorna undefined (em vez de lançar erro) quando os dados
  // do loader não estão disponíveis — ex: quando o Layout envolve o ErrorBoundary.
  const data = useRouteLoaderData("root") as
    | { logoUrl: string; ENV: Record<string, string | undefined> }
    | undefined;
  const clientEnv = JSON.stringify(data?.ENV ?? {}).replace(/</g, "\\u003c");

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#C39DA3" />
        <Meta />
        <Links />
        <link rel="icon" href={data?.logoUrl || "/favicon.ico"} />
        <link rel="apple-touch-icon" href={data?.logoUrl || "/icon.svg"} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${clientEnv}`,
          }}
        />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Erro ao registrar Service Worker:", error);
      });
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker, { once: true });
    return () => window.removeEventListener("load", registerServiceWorker);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
