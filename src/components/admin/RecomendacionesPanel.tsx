"use client";
import { useState } from "react";
import { ListChecks, Trash2, Share2 } from "lucide-react";
import { useData } from "@/store/dataStore";
import { formatFechaCO, formatHoraCO } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { CompartirRecomendacion } from "./CompartirRecomendacion";
import { Recomendacion } from "@/types";

export function RecomendacionesPanel() {
  const recomendaciones = useData((s) => s.recomendaciones);
  const removeRecomendacion = useData((s) => s.removeRecomendacion);
  const [detalle, setDetalle] = useState<Recomendacion | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);

  const lista = [...recomendaciones].sort((a, b) => +new Date(b.creadoEn) - +new Date(a.creadoEn));

  const cerrar = () => {
    setDetalle(null);
    setConfirmando(false);
    setCompartiendo(false);
  };

  const eliminar = async () => {
    if (!detalle) return;
    await removeRecomendacion(detalle.id);
    cerrar();
  };

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-semibold text-cocoa">Recomendaciones</h2>
      <p className="mb-5 text-sm text-cocoa/60">Sugerencias del personal para el administrador.</p>

      {lista.length === 0 ? (
        <Empty icon={<ListChecks size={40} />} title="Sin recomendaciones" hint="Las sugerencias del personal aparecerán aquí." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((r) => (
            <button key={r.id} onClick={() => setDetalle(r)} className="text-left">
              <Card className="p-5 transition hover:-translate-y-1 hover:shadow-soft">
                <h3 className="font-display text-lg font-semibold text-cocoa">{r.localNombre}</h3>
                <p className="mt-1 text-xs font-semibold text-cocoa/50">
                  {formatFechaCO(r.creadoEn)} · {formatHoraCO(r.creadoEn)}
                </p>
                <p className="mt-3 line-clamp-2 text-sm text-cocoa/80">{r.mensaje}</p>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!detalle && !compartiendo}
        onClose={cerrar}
        title={detalle ? `${detalle.localNombre} · ${formatFechaCO(detalle.creadoEn)} ${formatHoraCO(detalle.creadoEn)}` : ""}
        footer={detalle ? (
          confirmando ? (
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-semibold text-raspberry-dark">¿Eliminar esta recomendación?</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)}>No, cancelar</Button>
                <Button variant="danger" size="sm" onClick={eliminar}>Sí, eliminar</Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Button variant="danger" size="sm" onClick={() => setConfirmando(true)}>
                <Trash2 size={14} /> Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={cerrar}>Mantener</Button>
                <Button variant="secondary" size="sm" onClick={() => setCompartiendo(true)}>
                  <Share2 size={14} /> Compartir
                </Button>
              </div>
            </div>
          )
        ) : undefined}
      >
        {detalle && <p className="whitespace-pre-wrap text-cocoa/80">{detalle.mensaje}</p>}
      </Modal>

      <Modal open={!!detalle && compartiendo} onClose={cerrar} title="Compartir recomendación">
        {detalle && <CompartirRecomendacion recomendacion={detalle} />}
      </Modal>
    </div>
  );
}
