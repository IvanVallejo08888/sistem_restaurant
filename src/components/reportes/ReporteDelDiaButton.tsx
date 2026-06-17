"use client";
import { useMemo, useState } from "react";
import { FileBarChart, Bike, Download, CircleAlert } from "lucide-react";
import { useData } from "@/store/dataStore";
import { formatCOP } from "@/lib/utils";
import {
  facturasDelDia, gastosDelDia, cajaPorCategoria, utilidadDelDia, totalGastos, cuadreDomiciliario,
} from "@/lib/reportes";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { Card } from "@/components/ui/Card";
import { SaldoDomiciliarioCard } from "@/components/cajero/CajeroBoard";

// Botón + modal "Reporte del día": reutiliza EXACTAMENTE las mismas funciones
// de reportes.ts que ya alimentan Cajero/Reportes (facturasDelDia, gastosDelDia,
// utilidadDelDia, cuadreDomiciliario), así que los números nunca pueden
// quedar desincronizados respecto a esas pantallas — es la misma fuente.
export function ReporteDelDiaButton({ localId }: { localId: string }) {
  const [open, setOpen] = useState(false);
  const facturas = useData((s) => s.facturas);
  const gastos = useData((s) => s.gastos);
  const productos = useData((s) => s.productos);
  const domiciliarios = useData((s) => s.domiciliarios.filter((d) => d.localId === localId));

  const delDia = useMemo(() => facturasDelDia(facturas, localId), [facturas, localId]);
  const gastosHoy = useMemo(() => gastosDelDia(gastos, localId), [gastos, localId]);
  const { utilidad } = useMemo(() => utilidadDelDia(delDia, gastosHoy), [delDia, gastosHoy]);
  const { heladeria, comidas } = useMemo(() => cajaPorCategoria(delDia, productos), [delDia, productos]);
  const gastosTotal = totalGastos(gastosHoy);
  const conActividad = domiciliarios.filter((d) => delDia.some((f) => f.domiciliarioId === d.id));

  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  const descargarExcel = async () => {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      const res = await fetch(`/api/reportes/dia?localId=${encodeURIComponent(localId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-dia-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrorDescarga(e instanceof Error ? e.message : "No se pudo generar el Excel.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-card transition hover:bg-amber-600"
      >
        <FileBarChart size={18} /> Reporte del día
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Reporte del día">
        <div className="space-y-5">
          {errorDescarga && (
            <div className="flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
              <CircleAlert size={16} /> {errorDescarga}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={descargarExcel}
              disabled={descargando}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-card transition hover:bg-amber-600 disabled:opacity-60"
            >
              <Download size={14} /> {descargando ? "Generando…" : "Descargar Excel"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl2 border border-pistachio/40 bg-pistachio/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">Heladería</p>
              <p className="mt-1 font-display text-xl font-black text-cocoa">{formatCOP(heladeria.total)}</p>
            </div>
            <div className="rounded-xl2 border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">Comidas rápidas</p>
              <p className="mt-1 font-display text-xl font-black text-cocoa">{formatCOP(comidas.total)}</p>
            </div>
            <div className="rounded-xl2 border border-sand bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">Gastos del día</p>
              <p className="mt-1 font-display text-xl font-black text-cocoa">{formatCOP(gastosTotal)}</p>
            </div>
            <div className="rounded-xl2 border border-raspberry-light bg-raspberry-light/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">Utilidad del día</p>
              <p className="mt-1 font-display text-xl font-black text-cocoa">{formatCOP(utilidad)}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 font-bold text-cocoa"><Bike size={16} className="text-raspberry" /> Domiciliarios del día</p>
            {conActividad.length === 0 ? (
              <Empty icon={<Bike size={32} />} title="Sin actividad hoy" hint="Los domiciliarios con pedidos hoy aparecerán aquí." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {conActividad.map((d) => {
                  const suyas = delDia.filter((f) => f.domiciliarioId === d.id);
                  const cuadre = cuadreDomiciliario(suyas);
                  return (
                    <Card key={d.id} className="p-4">
                      <p className="font-bold text-cocoa">{d.nombreCompleto}</p>
                      <p className="mb-2 text-xs text-cocoa/60">{cuadre.totalDomicilios} factura(s)</p>
                      <SaldoDomiciliarioCard saldo={cuadre.efectivoAEntregar} />
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
