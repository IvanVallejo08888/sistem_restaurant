import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rowToProducto, productoToRow } from "@/lib/mappers";
import { uid, now } from "@/lib/utils";
import { Producto } from "@/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Producto, "id" | "creadoEn">;
  const item: Producto = { ...body, id: uid(), creadoEn: now() };

  const { data, error } = await getSupabase()
    .from("productos")
    .insert(productoToRow(item))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToProducto(data));
}
