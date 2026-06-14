import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToFactura, facturaToRow } from "@/lib/mappers";
import { uid, now } from "@/lib/utils";
import { Factura } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Factura, "id" | "creadoEn">;
  const item: Factura = { ...body, id: uid(), creadoEn: now() };

  const { data, error } = await getSupabase()
    .from("facturas")
    .insert(facturaToRow(item))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToFactura(data));
}
