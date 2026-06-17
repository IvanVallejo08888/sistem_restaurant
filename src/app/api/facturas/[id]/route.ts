import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToFactura, facturaPatchToRow } from "@/lib/mappers";
import { Factura } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<Factura>;

  const { data, error } = await getSupabase()
    .from("facturas")
    .update(facturaPatchToRow(body))
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToFactura(data));
}

// Soft delete: nunca se borra físicamente la factura (debe seguir existiendo
// para el histórico/reportes, marcada como "Cancelada" vía deleted_at), igual
// que ya funciona para "locales". Antes de este fix no existía este handler,
// así que "Eliminar factura" en Historial devolvía 405 y fallaba en silencio.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await getSupabase()
    .from("facturas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
