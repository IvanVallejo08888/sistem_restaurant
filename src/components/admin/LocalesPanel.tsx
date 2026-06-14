"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Power, KeyRound, RotateCcw, Store } from "lucide-react";
import { useData } from "@/store/dataStore";
import { localSchema, LocalForm } from "@/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Local } from "@/types";

const genPassword = () =>
  Math.random().toString(36).slice(2, 6) + Math.floor(Math.random() * 90 + 10);

export function LocalesPanel() {
  const { locales, addLocal, updateLocal, toggleLocal } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Local | null>(null);

  const form = useForm<LocalForm>({ resolver: zodResolver(localSchema) });

  const abrirNuevo = () => {
    setEditing(null);
    form.reset({ nombre: "", direccion: "", password: genPassword() });
    setOpen(true);
  };
  const abrirEditar = (l: Local) => {
    setEditing(l);
    form.reset({ nombre: l.nombre, direccion: l.direccion, password: l.password });
    setOpen(true);
  };
  const onSubmit = (d: LocalForm) => {
    if (editing) updateLocal(editing.id, d);
    else addLocal({ ...d, activo: true });
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-cocoa">Locales</h2>
        <Button onClick={abrirNuevo}><Plus size={18} /> Nuevo local</Button>
      </div>

      {locales.length === 0 ? (
        <Empty icon={<Store size={40} />} title="Aún no hay locales" hint="Crea el primer local para empezar." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locales.map((l) => (
            <Card key={l.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-cocoa">{l.nombre}</h3>
                  <p className="text-sm text-cocoa/60">{l.direccion}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${l.activo ? "bg-pistachio/30 text-cocoa" : "bg-sand text-cocoa/50"}`}>
                  {l.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-sand/60 px-3 py-2">
                <KeyRound size={15} className="text-raspberry" />
                <code className="text-sm font-bold tracking-wider text-cocoa">{l.password}</code>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => abrirEditar(l)}>
                  <Pencil size={14} /> Editar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => updateLocal(l.id, { password: genPassword() })}>
                  <RotateCcw size={14} /> Restablecer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleLocal(l.id)}>
                  <Power size={14} /> {l.activo ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar local" : "Nuevo local"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={form.handleSubmit(onSubmit)}>Guardar</Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" {...form.register("nombre")} error={form.formState.errors.nombre?.message} />
          <Input label="Dirección" {...form.register("direccion")} error={form.formState.errors.direccion?.message} />
          <div className="flex items-end gap-2">
            <Input label="Contraseña" {...form.register("password")} error={form.formState.errors.password?.message} />
            <Button type="button" variant="secondary" onClick={() => form.setValue("password", genPassword())}>
              Generar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
