"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Search, Croissant } from "lucide-react";
import { useData } from "@/store/dataStore";
import { productoSchema, ProductoForm } from "@/schemas";
import { formatCOP, normalize, cx } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { CategoriaProducto, Producto } from "@/types";

const CATEGORIAS: { value: CategoriaProducto; label: string; emoji: string }[] = [
  { value: "heladeria", label: "Heladería", emoji: "🍦" },
  { value: "comidas-rapidas", label: "Comidas Rápidas", emoji: "🍔" },
];

function CategoriaBadge({ categoria }: { categoria: CategoriaProducto }) {
  return (
    <span className={cx(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
      categoria === "heladeria"
        ? "bg-blue-100 text-blue-700"
        : "bg-orange-100 text-orange-700"
    )}>
      {CATEGORIAS.find((c) => c.value === categoria)?.emoji}{" "}
      {CATEGORIAS.find((c) => c.value === categoria)?.label}
    </span>
  );
}

export function CartaPanel({ localId }: { localId: string }) {
  const { productos, addProducto, updateProducto, removeProducto } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [borrar, setBorrar] = useState<Producto | null>(null);
  const [q, setQ] = useState("");

  const form = useForm<ProductoForm>({ resolver: zodResolver(productoSchema) });
  const categoriaSeleccionada = form.watch("categoria");

  const lista = useMemo(() => {
    const base = productos.filter((p) => p.localId === localId);
    if (!q) return base;
    const nq = normalize(q);
    return base.filter((p) => normalize(p.nombre).includes(nq));
  }, [productos, localId, q]);

  const abrirNuevo = () => {
    setEditing(null);
    form.reset({ nombre: "", valor: 0 });
    setOpen(true);
  };
  const abrirEditar = (p: Producto) => {
    setEditing(p);
    form.reset({ nombre: p.nombre, valor: p.valor, categoria: p.categoria });
    setOpen(true);
  };
  const onSubmit = (d: ProductoForm) => {
    if (editing) updateProducto(editing.id, d);
    else addProducto({ ...d, localId });
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-cocoa">Carta</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto…"
              className="rounded-full border border-sand bg-white py-2 pl-9 pr-4 text-sm focus:border-raspberry focus:outline-none"
            />
          </div>
          <Button onClick={abrirNuevo}><Plus size={18} /> Producto</Button>
        </div>
      </div>

      {lista.length === 0 ? (
        <Empty icon={<Croissant size={40} />} title="Sin productos" hint="Agrega productos a la carta de este local." />
      ) : (
        <div className="grid gap-3">
          {lista.map((p) => (
            <Card key={p.id} className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="font-bold text-cocoa">{p.nombre}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-raspberry-dark">{formatCOP(p.valor)}</p>
                  {p.categoria && <CategoriaBadge categoria={p.categoria} />}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => abrirEditar(p)}><Pencil size={14} /></Button>
                <Button size="sm" variant="danger" onClick={() => setBorrar(p)}><Trash2 size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar producto" : "Nuevo producto"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={form.handleSubmit(onSubmit)}>Guardar</Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de categoría */}
          <div>
            <p className="mb-2 text-sm font-bold text-cocoa">¿Qué tipo de producto es?</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => form.setValue("categoria", c.value, { shouldValidate: true })}
                  className={cx(
                    "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition",
                    categoriaSeleccionada === c.value
                      ? c.value === "heladeria"
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-sand bg-white text-cocoa/70 hover:border-raspberry-light"
                  )}
                >
                  <span className="text-lg">{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
            {form.formState.errors.categoria && (
              <p className="mt-1 text-xs text-raspberry-dark">
                {form.formState.errors.categoria.message}
              </p>
            )}
          </div>

          <Input
            label="Nombre"
            {...form.register("nombre")}
            error={form.formState.errors.nombre?.message}
          />
          <Input
            label="Valor (COP)"
            type="number"
            {...form.register("valor")}
            error={form.formState.errors.valor?.message}
          />
        </form>
      </Modal>

      <Confirm
        open={!!borrar}
        onClose={() => setBorrar(null)}
        onConfirm={() => borrar && removeProducto(borrar.id)}
        title="Eliminar producto"
        message={`¿Eliminar "${borrar?.nombre}" de la carta?`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
