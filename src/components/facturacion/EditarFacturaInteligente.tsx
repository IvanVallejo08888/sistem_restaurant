"use client";
import { useState } from "react";
import { Trash2, MessageSquarePlus } from "lucide-react";
import { useData } from "@/store/dataStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductPicker } from "./ProductPicker";
import { cx, formatCOP } from "@/lib/utils";
import { folio, metodosPago, subtotalDe, totalDe } from "@/lib/factura";
import { Factura, ItemFactura, MetodoPago } from "@/types";

// Edición inteligente:
// - Si se agregan productos a una factura ya preparada (estado "listo" o "completado"),
//   los nuevos ítems se marcan con `nuevo: true` (fondo rosado) y la factura vuelve a "pendiente" (cocina).
// - Si solo cambian método de pago / barrio / datos, NO vuelve a cocina:
//   si estaba completada o lista, se deja lista para el despachador.
export function EditarFacturaInteligente({
  factura, onClose,
}: {
  factura: Factura;
  onClose: () => void;
}) {
  const updateFactura = useData((s) => s.updateFactura);

  const [items, setItems] = useState<ItemFactura[]>(factura.items.map((it) => ({ ...it, nuevo: false })));
  const [metodo, setMetodo] = useState<MetodoPago>(factura.metodoPago);
  const [barrio, setBarrio] = useState(factura.barrio || "");
  const [valorDom, setValorDom] = useState(factura.valorDomicilio || 0);

  const preparada = factura.estado !== "pendiente";

  const addItem = (it: ItemFactura) =>
    setItems((prev) => [...prev, { ...it, nuevo: preparada }]);
  const setCant = (i: number, c: number) =>
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, cantidad: Math.max(1, c) } : x)));
  const setObs = (i: number, obs: string) =>
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, observacion: obs } : x)));
  const quitar = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const seAgregaronProductos = items.some((it) => it.nuevo);
  const subtotal = subtotalDe(items);
  const total = totalDe(items, factura.tipo === "domicilio" ? valorDom : 0);

  const guardar = () => {
    const base: Partial<Factura> = {
      items,
      metodoPago: metodo,
      barrio: factura.tipo === "domicilio" ? barrio : undefined,
      valorDomicilio: factura.tipo === "domicilio" ? valorDom : undefined,
      subtotal,
      total,
    };

    if (seAgregaronProductos) {
      // Vuelve a cocina; los ítems nuevos conservan su marca rosada.
      updateFactura(factura.id, { ...base, estado: "pendiente", despachado: false });
    } else if (preparada) {
      // Solo cambios administrativos: directo al despachador (estado "listo").
      updateFactura(factura.id, { ...base, estado: "listo" });
    } else {
      updateFactura(factura.id, base);
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar ${folio(factura)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-5">
        {preparada && (
          <p className="rounded-xl bg-raspberry-light/50 px-4 py-2 text-sm font-semibold text-raspberry-dark">
            Esta factura ya estaba preparada. Si agregas productos, volverá a cocina; los nuevos se marcan en rosado.
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-bold text-cocoa/80">Productos</p>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div
                key={i}
                className={cx(
                  "rounded-xl border p-3",
                  it.nuevo ? "border-raspberry bg-raspberry-light/40" : "border-sand"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cocoa">
                    {it.nombre}{it.nuevo && <span className="ml-2 rounded-full bg-raspberry px-2 py-0.5 text-[10px] font-bold text-white">NUEVO</span>}
                  </span>
                  <button onClick={() => quitar(i)} className="text-cocoa/40 hover:text-raspberry"><Trash2 size={15} /></button>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-sand">
                    <button onClick={() => setCant(i, it.cantidad - 1)} className="px-3 py-1 text-cocoa/70">−</button>
                    <span className="w-8 text-center font-bold">{it.cantidad}</span>
                    <button onClick={() => setCant(i, it.cantidad + 1)} className="px-3 py-1 text-cocoa/70">+</button>
                  </div>
                  <span className="ml-auto text-sm font-bold text-raspberry-dark">{formatCOP(it.valor * it.cantidad)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <MessageSquarePlus size={15} className="text-cocoa/40" />
                  <input
                    value={it.observacion || ""}
                    onChange={(e) => setObs(i, e.target.value)}
                    placeholder="Observación"
                    className="w-full rounded-lg border border-sand bg-vanilla px-3 py-1.5 text-sm focus:border-raspberry focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-cocoa/80">Agregar producto</p>
          <ProductPicker localId={factura.localId} onAdd={addItem} />
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-cocoa/80">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {metodosPago.map((m) => (
              <button
                key={m.value}
                onClick={() => setMetodo(m.value)}
                className={cx(
                  "rounded-xl border px-3 py-2 text-sm font-bold transition",
                  metodo === m.value ? "border-raspberry bg-raspberry text-white" : "border-sand bg-white text-cocoa"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {factura.tipo === "domicilio" && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Barrio" value={barrio} onChange={(e) => setBarrio(e.target.value)} />
            <Input label="Valor domicilio" type="number" value={valorDom || ""} onChange={(e) => setValorDom(Number(e.target.value) || 0)} />
          </div>
        )}

        <div className="flex justify-between border-t border-sand pt-3 text-lg font-black text-cocoa">
          <span>Total</span><span>{formatCOP(total)}</span>
        </div>
      </div>
    </Modal>
  );
}
