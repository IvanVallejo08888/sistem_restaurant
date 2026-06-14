import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToLocal, localToRow } from "@/lib/mappers";
import { uid, now } from "@/lib/utils";
import { Local } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Local, "id" | "creadoEn">;
  const item: Local = { ...body, id: uid(), creadoEn: now() };

  const { data, error } = await getSupabase()
    .from("locales")
    .insert(localToRow(item))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToLocal(data));
}
