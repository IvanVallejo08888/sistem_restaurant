import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToDomiciliario, domiciliarioToRow } from "@/lib/mappers";
import { uid, now } from "@/lib/utils";
import { Domiciliario } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Domiciliario, "id" | "creadoEn">;
  const item: Domiciliario = { ...body, id: uid(), creadoEn: now() };

  const { data, error } = await getSupabase()
    .from("domiciliarios")
    .insert(domiciliarioToRow(item))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToDomiciliario(data));
}
