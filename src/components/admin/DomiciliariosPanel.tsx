"use client";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Bike, Mail, Phone } from "lucide-react";
import { useData } from "@/store/dataStore";
import { DomiciliarioForm } from "@/schemas";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { DomiciliarioFormModal } from "@/components/domiciliarios/DomiciliarioFormModal";
import { Domiciliario } from "@/types";

export function DomiciliariosPanel({ localId }: { localId: string }) {
  const { domiciliarios, addDomiciliario, updateDomiciliario, removeDomiciliario } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Domiciliario | null>(null);
  const [borrar, setBorrar] = useState<Domiciliario | null>(null);

  const lista = useMemo(
    () => domiciliarios.filter((d) => d.localId === localId),
    [domiciliarios, localId]
  );

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
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => abrirEditar(d)}><Pencil size={14} /> Editar</Button>
                <Button size="sm" variant="danger" onClick={() => setBorrar(d)}><Trash2 size={14} /></Button>
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
