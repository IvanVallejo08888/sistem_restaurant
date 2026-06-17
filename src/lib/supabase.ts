// Cliente Supabase para uso exclusivo en el servidor (API Routes).
// Usa la service role key, que ignora RLS: NUNCA importar este módulo
// desde código que se ejecute en el navegador.
//
// La creación es perezosa (lazy) para que el build/dev de Next.js no falle
// cuando SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY aún no están configuradas
// (p. ej. con NEXT_PUBLIC_USE_BACKEND=false).

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        // Next.js cachea cualquier fetch() del lado del servidor por defecto,
        // incluso en rutas con `dynamic = "force-dynamic"`. Sin esto, las
        // consultas a Supabase quedan congeladas con la respuesta de la
        // primera llamada y nunca reflejan altas/bajas/cambios posteriores.
        global: {
          fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
        },
      }
    );
  }
  return client;
};
