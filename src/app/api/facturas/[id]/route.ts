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
