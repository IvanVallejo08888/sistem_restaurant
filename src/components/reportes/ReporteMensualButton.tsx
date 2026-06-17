"use client";
import { useState } from "react";
import { FileSpreadsheet, Download, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// Botón + modal reutilizable para descargar el "Reporte del mes" (.xlsx).
// Si se pasa `localId`, el Excel queda acotado a ese local; si no, combina todos.
export function ReporteMensualButton({ localId, label = "Reporte del mes" }: { localId?: string; label?: string }) {
  const hoy = new Date();
  const [open, setOpen] = useState(false);
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const descargar = async () => {
    setGenerando(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mes: String(mes), anio: String(anio) });
      if (localId) params.set("localId", localId);
      const res = await fetch(`/api/reportes/mensual?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${anio}-${String(mes).padStart(2, "0")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el reporte.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <>
      {/* Cuadrado con esquinas redondeadas (no la píldora del Button genérico)
          y color dorado/mostaza llamativo, distinto del rosa de marca, para
          diferenciar visualmente las acciones de reporte del resto de botones. */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-card transition hover:bg-amber-600"
      >
        <FileSpreadsheet size={18} /> {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Reporte del mes">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
              <CircleAlert size={16} /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-bold text-cocoa/80">Mes</label>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-cocoa focus:border-raspberry focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleDateString("es-CO", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-cocoa/80">Año</label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value) || hoy.getFullYear())}
                className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-cocoa focus:border-raspberry focus:outline-none"
              />
            </div>
          </div>
          <Button className="w-full" disabled={generando} onClick={descargar}>
            <Download size={16} /> {generando ? "Generando…" : "Descargar Excel"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
