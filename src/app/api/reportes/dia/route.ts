import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  rowToFactura, rowToGasto, rowToLocal, rowToProducto, rowToDomiciliario,
} from "@/lib/mappers";
import { esDeHoy } from "@/lib/reportes";
import { generarReporteDiaWorkbook } from "@/lib/reportesExcel";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const localId = url.searchParams.get("localId");
  if (!localId) return NextResponse.json({ error: "Falta el parámetro localId." }, { status: 400 });

  const supabase = getSupabase();
  // La hoja "Facturas" debe listar también las canceladas, por eso esta consulta
  // NO filtra por deleted_at (a diferencia del snapshot que sí lo hace).
  const [facturas, gastos, locales, productos, domiciliarios] = await Promise.all([
    supabase.from("facturas").select("*").eq("local_id", localId),
    supabase.from("gastos").select("*").eq("local_id", localId),
    supabase.from("locales").select("*").eq("id", localId).single(),
    supabase.from("productos").select("*").eq("local_id", localId),
    supabase.from("domiciliarios").select("*").eq("local_id", localId),
  ]);

  const error = facturas.error ?? gastos.error ?? locales.error ?? productos.error ?? domiciliarios.error;
  if (error) {
    console.error("[reportes/dia] Supabase error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const todasHoy = facturas.data!.map(rowToFactura).filter((f) => esDeHoy(f.creadoEn));
  const activasHoy = todasHoy.filter((f) => !f.deletedAt);
  const gastosHoy = gastos.data!.map(rowToGasto).filter((g) => esDeHoy(g.creadoEn));
  const local = rowToLocal(locales.data!);

  // Esta API corre en el servidor de Vercel (UTC), así que la fecha/hora de
  // Bogotá debe fijarse explícitamente; de lo contrario el reporte se rotula
  // con el día equivocado cerca de la medianoche.
  const hoy = new Date();
  const wb = await generarReporteDiaWorkbook({
    nombreLocal: local.nombre,
    fechaLabel: hoy.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Bogota" }),
    facturasDelDiaTodas: todasHoy,
    facturasDelDiaActivas: activasHoy,
    gastosDelDia: gastosHoy,
    productos: productos.data!.map(rowToProducto),
    domiciliarios: domiciliarios.data!.map(rowToDomiciliario),
  });

  const buffer = await wb.xlsx.writeBuffer();
  const fechaArchivo = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(hoy);
  const nombreSeguro = local.nombre.replace(/[^a-zA-Z0-9-]+/g, "-");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporte-dia-${fechaArchivo}-${nombreSeguro}.xlsx"`,
    },
  });
}
