import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToMesa, mesaPatchToRow } from "@/lib/mappers";
import { Mesa } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<Mesa>;

  const { data, error } = await getSupabase()
    .from("mesas")
    .update(mesaPatchToRow(body))
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToMesa(data));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await getSupabase().from("mesas").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
