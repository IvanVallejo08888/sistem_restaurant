"use client";
import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Plus, Pencil, Trash2, Bike, Mail, Phone, FileDown, Loader2 } from "lucide-react";
import { useData } from "@/store/dataStore";
import { DomiciliarioForm } from "@/schemas";
import { normalize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { DomiciliarioFormModal } from "@/components/domiciliarios/DomiciliarioFormModal";
import { CarnetDomiciliario } from "@/components/domiciliarios/CarnetDomiciliario";
import { Domiciliario } from "@/types";

export function DomiciliariosPanel({ localId }: { localId: string }) {
  const { domiciliarios, addDomiciliario, updateDomiciliario, removeDomiciliario } = useData();
  const nombreLocal = useData((s) => s.locales.find((l) => l.id === localId)?.nombre) ?? "";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Domiciliario | null>(null);
  const [borrar, setBorrar] = useState<Domiciliario | null>(null);
  // Un nodo de carnet oculto por domiciliario (fuera de pantalla, pero
  // renderizado) para poder rasterizarlo con html-to-image sin esperar un
  // re-render cuando se pulsa "Generar PDF".
  const carnetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [generandoPdfId, setGenerandoPdfId] = useState<string | null>(null);

  const lista = useMemo(
    () => domiciliarios.filter((d) => d.localId === localId),
    [domiciliarios, localId]
  );

  const generarCarnetPDF = async (d: Domiciliario) => {
    const nodo = carnetRefs.current[d.id];
    if (!nodo) return;
    setGenerandoPdfId(d.id);
    try {
      const dataUrl = await toPng(nodo, { pixelRatio: 2, backgroundColor: "#FFFBF4" });
      const { default: JsPDF } = await import("jspdf");
      // Mismo aspecto que el carnet (320x520 px) para que la imagen no se
      // estire ni se deforme al insertarla en el PDF.
      const anchoMm = 70;
      const altoMm = anchoMm * (520 / 320);
      const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: [anchoMm, altoMm] });
      doc.addImage(dataUrl, "PNG", 0, 0, anchoMm, altoMm);
      const slug = normalize(d.nombreCompleto).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      doc.save(`carnet_${slug || "domiciliario"}.pdf`);
    } catch (e) {
      console.error("No se pudo generar el carnet PDF:", e);
    } finally {
      setGenerandoPdfId(null);
    }
  };

  const abrirNuevo = () => {
    setEditing(null);
    setOpen(true);
  };
  const abrirEditar = (d: Domiciliario) => {
    setEditing(d);
    setOpen(true);
  };
  const onSubmit = (d: DomiciliarioForm) => {
    if (editing) updateDomiciliario(editing.id, d);
    else addDomiciliario({ ...d, localId });
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-cocoa">Domiciliarios</h2>
        <Button onClick={abrirNuevo}><Plus size={18} /> Domiciliario</Button>
      </div>

      {lista.length === 0 ? (
        <Empty icon={<Bike size={40} />} title="Sin domiciliarios" hint="Registra a tu equipo de domicilios." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-sand">
                  {d.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.fotoUrl} alt={d.nombreCompleto} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-cocoa/30"><Bike size={22} /></div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-cocoa">{d.nombreCompleto}</p>
                  <p className="truncate text-xs text-cocoa/60">{d.identificacion}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-cocoa/70">
                <p className="flex items-center gap-2"><Mail size={14} /> {d.correo}</p>
                <p className="flex items-center gap-2"><Phone size={14} /> {d.whatsapp}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => abrirEditar(d)}><Pencil size={14} /> Editar</Button>
                <Button size="sm" variant="outline" onClick={() => generarCarnetPDF(d)} disabled={generandoPdfId === d.id}>
                  {generandoPdfId === d.id ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  Generar PDF
                </Button>
                <Button size="sm" variant="danger" onClick={() => setBorrar(d)}><Trash2 size={14} /></Button>
              </div>

              {/* Carnet oculto (fuera de pantalla) usado solo para generar el PDF */}
              <div style={{ position: "absolute", left: -9999, top: 0 }} aria-hidden>
                <div ref={(el) => { carnetRefs.current[d.id] = el; }}>
                  <CarnetDomiciliario domiciliario={d} nombreLocal={nombreLocal} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DomiciliarioFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
        editing={editing}
      />

      <Confirm
        open={!!borrar}
        onClose={() => setBorrar(null)}
        onConfirm={() => borrar && removeDomiciliario(borrar.id)}
        title="Eliminar domiciliario"
        message={`¿Eliminar a "${borrar?.nombreCompleto}"?`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
