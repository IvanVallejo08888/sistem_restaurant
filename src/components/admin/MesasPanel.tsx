"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Armchair } from "lucide-react";
import { useData } from "@/store/dataStore";
import { mesaSchema, MesaForm } from "@/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Mesa } from "@/types";

export function MesasPanel({ localId }: { localId: string }) {
  const { mesas, addMesa, updateMesa, removeMesa } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mesa | null>(null);
  const [borrar, setBorrar] = useState<Mesa | null>(null);

  const form = useForm<MesaForm>({ resolver: zodResolver(mesaSchema) });

  const lista = useMemo(() => mesas.filter((m) => m.localId === localId), [mesas, localId]);

  const abrirNuevo = () => {
    setEditing(null);
    form.reset({ nombre: `Mesa ${lista.length + 1}` });
    setOpen(true);
  };
  const abrirEditar = (m: Mesa) => { setEditing(m); form.reset({ nombre: m.nombre }); setOpen(true); };
  const onSubmit = (d: MesaForm) => {
    if (editing) updateMesa(editing.id, d);
    else addMesa({ ...d, localId });
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-cocoa">Mesas</h2>
        <Button onClick={abrirNuevo}><Plus size={18} /> Mesa</Button>
      </div>

      {lista.length === 0 ? (
        <Empty icon={<Armchair size={40} />} title="Sin mesas" hint="Crea las mesas del local." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {lista.map((m) => (
            <Card key={m.id} className="flex flex-col items-center gap-3 p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/20 text-mint">
                <Armchair size={24} />
              </div>
              <p className="font-bold text-cocoa">{m.nombre}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => abrirEditar(m)}><Pencil size={13} /></Button>
                <Button size="sm" variant="danger" onClick={() => setBorrar(m)}><Trash2 size={13} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar mesa" : "Nueva mesa"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={form.handleSubmit(onSubmit)}>Guardar</Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Nombre" {...form.register("nombre")} error={form.formState.errors.nombre?.message} />
        </form>
      </Modal>

      <Confirm
        open={!!borrar}
        onClose={() => setBorrar(null)}
        onConfirm={() => borrar && removeMesa(borrar.id)}
        title="Eliminar mesa"
        message={`¿Eliminar "${borrar?.nombre}"?`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
