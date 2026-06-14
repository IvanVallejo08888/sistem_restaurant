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
      { auth: { persistSession: false } }
    );
  }
  return client;
};
