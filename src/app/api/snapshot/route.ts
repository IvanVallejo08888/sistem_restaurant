import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  rowToLocal, rowToProducto, rowToDomiciliario, rowToMesa, rowToFactura, rowToGasto,
} from "@/lib/mappers";
import { Snapshot } from "@/services/types";

// Sin esto, Next.js intenta pre-renderizar esta ruta en build time
// (no usa nada de `Request`) y falla porque las credenciales de Supabase
// solo existen en runtime.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  const [locales, productos, domiciliarios, mesas, facturas, gastos] = await Promise.all([
    supabase.from("locales").select("*").is("deleted_at", null),
    supabase.from("productos").select("*"),
    supabase.from("domiciliarios").select("*"),
    supabase.from("mesas").select("*"),
    supabase.from("facturas").select("*"),
    supabase.from("gastos").select("*"),
  ]);

  const error = locales.error ?? productos.error ?? domiciliarios.error ?? mesas.error ?? facturas.error ?? gastos.error;
  if (error) {
    console.error("[snapshot] Supabase error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const snapshot: Snapshot = {
    locales: locales.data!.map(rowToLocal),
    productos: productos.data!.map(rowToProducto),
    domiciliarios: domiciliarios.data!.map(rowToDomiciliario),
    mesas: mesas.data!.map(rowToMesa),
    facturas: facturas.data!.map(rowToFactura),
    gastos: gastos.data!.map(rowToGasto),
  };

  return NextResponse.json(snapshot);
}
