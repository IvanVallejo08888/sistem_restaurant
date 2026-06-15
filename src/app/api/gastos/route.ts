import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToGasto, gastoToRow } from "@/lib/mappers";
import { uid, now } from "@/lib/utils";
import { Gasto } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Gasto, "id" | "creadoEn">;
  const item: Gasto = { ...body, id: uid(), creadoEn: now() };

  const { data, error } = await getSupabase()
    .from("gastos")
    .insert(gastoToRow(item))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToGasto(data));
}
