import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  rowToLocal, rowToProducto, rowToDomiciliario, rowToMesa, rowToFactura,
} from "@/lib/mappers";
import { Snapshot } from "@/services/types";

// Sin esto, Next.js intenta pre-renderizar esta ruta en build time
// (no usa nada de `Request`) y falla porque las credenciales de Supabase
// solo existen en runtime.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  const [locales, productos, domiciliarios, mesas, facturas] = await Promise.all([
    supabase.from("locales").select("*"),
    supabase.from("productos").select("*"),
    supabase.from("domiciliarios").select("*"),
    supabase.from("mesas").select("*"),
    supabase.from("facturas").select("*"),
  ]);

  const error = locales.error ?? productos.error ?? domiciliarios.error ?? mesas.error ?? facturas.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const snapshot: Snapshot = {
    locales: locales.data!.map(rowToLocal),
    productos: productos.data!.map(rowToProducto),
    domiciliarios: domiciliarios.data!.map(rowToDomiciliario),
    mesas: mesas.data!.map(rowToMesa),
    facturas: facturas.data!.map(rowToFactura),
  };

  return NextResponse.json(snapshot);
}
