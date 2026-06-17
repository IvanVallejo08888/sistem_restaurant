import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  rowToFactura, rowToGasto, rowToLocal, rowToProducto, rowToDomiciliario,
} from "@/lib/mappers";
import { generarReporteMensualWorkbook, rangoFechasMes } from "@/lib/reportesExcel";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mes = Number(url.searchParams.get("mes"));
  const anio = Number(url.searchParams.get("anio"));
  const localId = url.searchParams.get("localId") || undefined;

  if (!mes || mes < 1 || mes > 12 || !anio) {
    return NextResponse.json({ error: "Parámetros mes/anio inválidos." }, { status: 400 });
  }

  const { desde, hasta } = rangoFechasMes({ mes, anio });
  const supabase = getSupabase();

  // La hoja "Ventas" debe mostrar también las canceladas (deleted_at no nulo),
  // por eso esta consulta NO filtra por deleted_at, a diferencia del snapshot
  // que sí lo hace para el resto de la app.
  let facturasQuery = supabase.from("facturas").select("*").gte("creado_en", desde).lt("creado_en", hasta);
  let gastosQuery = supabase.from("gastos").select("*").gte("creado_en", desde).lt("creado_en", hasta);
  if (localId) {
    facturasQuery = facturasQuery.eq("local_id", localId);
    gastosQuery = gastosQuery.eq("local_id", localId);
  }

  const [facturas, gastos, locales, productos, domiciliarios] = await Promise.all([
    facturasQuery,
    gastosQuery,
    supabase.from("locales").select("*").is("deleted_at", null),
    supabase.from("productos").select("*"),
    supabase.from("domiciliarios").select("*"),
  ]);

  const error = facturas.error ?? gastos.error ?? locales.error ?? productos.error ?? domiciliarios.error;
  if (error) {
    console.error("[reportes/mensual] Supabase error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const wb = await generarReporteMensualWorkbook({
    rango: { mes, anio },
    localId,
    facturas: facturas.data!.map(rowToFactura),
    gastos: gastos.data!.map(rowToGasto),
    locales: locales.data!.map(rowToLocal),
    productos: productos.data!.map(rowToProducto),
    domiciliarios: domiciliarios.data!.map(rowToDomiciliario),
  });

  const buffer = await wb.xlsx.writeBuffer();
  const nombreArchivo = `reporte-${anio}-${String(mes).padStart(2, "0")}${localId ? `-${localId}` : ""}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
