import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToMesa, mesaToRow } from "@/lib/mappers";
import { uid, now } from "@/lib/utils";
import { Mesa } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Mesa, "id" | "creadoEn">;
  const item: Mesa = { ...body, id: uid(), creadoEn: now() };

  const { data, error } = await getSupabase()
    .from("mesas")
    .insert(mesaToRow(item))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToMesa(data));
}
