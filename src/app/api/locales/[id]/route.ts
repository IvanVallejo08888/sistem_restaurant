import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToLocal, localPatchToRow } from "@/lib/mappers";
import { Local } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<Local>;

  const { data, error } = await getSupabase()
    .from("locales")
    .update(localPatchToRow(body))
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToLocal(data));
}
