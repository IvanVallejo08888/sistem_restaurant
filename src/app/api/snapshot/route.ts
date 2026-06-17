import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  rowToLocal, rowToProducto, rowToDomiciliario, rowToMesa, rowToFactura, rowToGasto, rowToRecomendacion,
} from "@/lib/mappers";
import { Snapshot } from "@/services/types";

// Sin esto, Next.js intenta pre-renderizar esta ruta en build time
// (no usa nada de `Request`) y falla porque las credenciales de Supabase
// solo existen en runtime.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  const [locales, productos, domiciliarios, mesas, facturas, gastos, recomendaciones] = await Promise.all([
    supabase.from("locales").select("*").is("deleted_at", null),
    supabase.from("productos").select("*"),
    supabase.from("domiciliarios").select("*"),
    supabase.from("mesas").select("*"),
    // Las facturas "canceladas" (deleted_at no nulo) no deben aparecer en ningún
    // flujo operativo (Cocina, Despachador, Cajero, Historial); solo el reporte
    // mensual las consulta aparte, directo a Supabase, para mostrarlas como
    // "Cancelada" en el histórico sin que reaparezcan en el resto de la app.
    supabase.from("facturas").select("*").is("deleted_at", null),
    supabase.from("gastos").select("*"),
    supabase.from("recomendaciones").select("*"),
  ]);

  const error = locales.error ?? productos.error ?? domiciliarios.error ?? mesas.error ?? facturas.error ?? gastos.error ?? recomendaciones.error;
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
    recomendaciones: recomendaciones.data!.map(rowToRecomendacion),
  };

  return NextResponse.json(snapshot);
}
