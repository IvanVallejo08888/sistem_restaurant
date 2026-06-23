"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { domiciliarioSchema, DomiciliarioForm } from "@/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PhotoInput } from "@/components/ui/PhotoInput";
import { Domiciliario, TIPOS_SANGRE } from "@/types";

// Formulario "Nuevo/Editar domiciliario" reutilizado por el panel Admin y
// por el alta rápida desde Despachador, para no duplicar la lógica del form.
export function DomiciliarioFormModal({
  open,
  onClose,
  onSubmit,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DomiciliarioForm) => void;
  editing?: Domiciliario | null;
}) {
  const [foto, setFoto] = useState("");
  const form = useForm<DomiciliarioForm>({ resolver: zodResolver(domiciliarioSchema) });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setFoto(editing.fotoUrl);
      form.reset({
        nombreCompleto: editing.nombreCompleto,
        correo: editing.correo,
        whatsapp: editing.whatsapp,
        identificacion: editing.identificacion,
        fotoUrl: editing.fotoUrl,
        tipoSangre: editing.tipoSangre,
      });
    } else {
      setFoto("");
      form.reset({ nombreCompleto: "", correo: "", whatsapp: "", identificacion: "", fotoUrl: "", tipoSangre: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const handleSubmit = (d: DomiciliarioForm) => onSubmit({ ...d, fotoUrl: foto });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar domiciliario" : "Nuevo domiciliario"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={form.handleSubmit(handleSubmit)}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <PhotoInput value={foto} onChange={setFoto} />
        <Input label="Nombre completo" {...form.register("nombreCompleto")} error={form.formState.errors.nombreCompleto?.message} />
        <Input label="Correo" type="email" {...form.register("correo")} error={form.formState.errors.correo?.message} />
        <Input label="WhatsApp" {...form.register("whatsapp")} error={form.formState.errors.whatsapp?.message} />
        <Input label="Identificación" {...form.register("identificacion")} error={form.formState.errors.identificacion?.message} />
        <div>
          <label className="mb-1 block text-sm font-bold text-cocoa/80">Tipo de sangre</label>
          <select
            {...form.register("tipoSangre")}
            defaultValue=""
            className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-cocoa transition focus:border-raspberry focus:outline-none"
          >
            <option value="">Seleccione tipo de sangre</option>
            {TIPOS_SANGRE.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
