import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToRecomendacion, recomendacionToRow } from "@/lib/mappers";
import { uid, now } from "@/lib/utils";
import { Recomendacion } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Recomendacion, "id" | "creadoEn">;
  const item: Recomendacion = { ...body, id: uid(), creadoEn: now() };

  const { data, error } = await getSupabase()
    .from("recomendaciones")
    .insert(recomendacionToRow(item))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToRecomendacion(data));
}
