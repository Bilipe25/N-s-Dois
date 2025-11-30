// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userName, title, body, url, image } = await req.json();

    if (!userName || !title || !body) {
      throw new Error("Missing required fields: userName, title, body");
    }

    // Configurar VAPID
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured in Edge Function secrets");
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Inicializar Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar subscrições
    let query = supabase
      .from("push_subscriptions")
      .select("subscription");

    // Se userName for "all", pega de todos. Se não, filtra.
    if (userName !== "all") {
      query = query.eq("user_name", userName);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions found for user" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url, image });

    const promises = subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        return { success: true };
      } catch (error: any) {
        console.error("Error sending push:", error);

        if (error.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .match({ subscription: sub.subscription });
          return { success: false, error: "Expired subscription removed" };
        }
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
