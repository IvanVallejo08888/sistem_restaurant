import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToProducto, productoPatchToRow } from "@/lib/mappers";
import { Producto } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<Producto>;

  const { data, error } = await getSupabase()
    .from("productos")
    .update(productoPatchToRow(body))
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToProducto(data));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await getSupabase().from("productos").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
