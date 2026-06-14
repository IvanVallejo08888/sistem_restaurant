"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Bike, Mail, Phone } from "lucide-react";
import { useData } from "@/store/dataStore";
import { domiciliarioSchema, DomiciliarioForm } from "@/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { PhotoInput } from "@/components/ui/PhotoInput";
import { Domiciliario } from "@/types";

export function DomiciliariosPanel({ localId }: { localId: string }) {
  const { domiciliarios, addDomiciliario, updateDomiciliario, removeDomiciliario } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Domiciliario | null>(null);
  const [borrar, setBorrar] = useState<Domiciliario | null>(null);
  const [foto, setFoto] = useState("");

  const form = useForm<DomiciliarioForm>({ resolver: zodResolver(domiciliarioSchema) });

  const lista = useMemo(
    () => domiciliarios.filter((d) => d.localId === localId),
    [domiciliarios, localId]
  );

  const abrirNuevo = () => {
    setEditing(null); setFoto("");
    form.reset({ nombreCompleto: "", correo: "", whatsapp: "", identificacion: "", fotoUrl: "" });
    setOpen(true);
  };
  const abrirEditar = (d: Domiciliario) => {
    setEditing(d); setFoto(d.fotoUrl);
    form.reset({ nombreCompleto: d.nombreCompleto, correo: d.correo, whatsapp: d.whatsapp, identificacion: d.identificacion, fotoUrl: d.fotoUrl });
    setOpen(true);
  };
  const onSubmit = (d: DomiciliarioForm) => {
    const payload = { ...d, fotoUrl: foto };
    if (editing) updateDomiciliario(editing.id, payload);
    else addDomiciliario({ ...payload, localId });
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar domiciliario" : "Nuevo domiciliario"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={form.handleSubmit(onSubmit)}>Guardar</Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <PhotoInput value={foto} onChange={setFoto} />
          <Input label="Nombre completo" {...form.register("nombreCompleto")} error={form.formState.errors.nombreCompleto?.message} />
          <Input label="Correo" type="email" {...form.register("correo")} error={form.formState.errors.correo?.message} />
          <Input label="WhatsApp" {...form.register("whatsapp")} error={form.formState.errors.whatsapp?.message} />
          <Input label="Identificación" {...form.register("identificacion")} error={form.formState.errors.identificacion?.message} />
        </form>
      </Modal>

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
