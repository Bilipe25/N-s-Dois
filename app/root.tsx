import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "@/components/ui/sonner";

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
          logoUrl = data[0].logo_url;
        }
      }
    } catch (e) {
      console.error("Erro ao buscar logo no root:", e);
    }
  }

  const vapidPublicKey = "BDjSK0SYyg0Xbsm03PlBGc8jawmjKeEYVVUn8ZB54Okdq3uUlec5RZGYjRMimMfEtvGg4IMitpYBvWIrC1WMuCw";

  return {
    logoUrl,
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      VAPID_PUBLIC_KEY: vapidPublicKey,
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="icon" href={data?.logoUrl || "/favicon.ico"} />
        <link rel="apple-touch-icon" href={data?.logoUrl || "/logo192.png"} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data?.ENV)}`,
          }}
        />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();

  // Lógica de Subscrição Push
  if (typeof window !== "undefined" && 'serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado:', registration);

        // Verificar permissão
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: data.ENV.VAPID_PUBLIC_KEY
          });

          // Enviar para o backend
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscription }),
          });
          console.log('Push inscrito com sucesso!');
        }
      } catch (error) {
        console.error('Erro no registro do SW ou Push:', error);
      }
    });
  }

  return <Outlet />;
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
