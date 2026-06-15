"use client";
import { useMemo, useState } from "react";
import { Trash2, MessageSquarePlus, CalendarClock, Check } from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { ProductPicker } from "./ProductPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { formatCOP, now, cx } from "@/lib/utils";
import { subtotalDe, totalDe, metodosPago } from "@/lib/factura";
import { ItemFactura, MetodoPago } from "@/types";

export function ReservaDomicilio() {
  const localId = useSession((s) => s.localId)!;
  const addFactura = useData((s) => s.addFactura);

  const hoy = now().slice(0, 10);

  const [cliente, setCliente] = useState({ nombre: "", whatsapp: "", direccion: "", barrio: "" });
  const [items, setItems] = useState<ItemFactura[]>([]);
  const [valorDomicilio, setValorDomicilio] = useState(0);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [fecha, setFecha] = useState("");
  const [ok, setOk] = useState(false);

  const subtotal = useMemo(() => subtotalDe(items), [items]);
  const total = useMemo(() => totalDe(items, valorDomicilio), [items, valorDomicilio]);

  const addItem = (it: ItemFactura) =>
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productoId === it.productoId && !x.observacion);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
        return copy;
      }
      return [...prev, it];
    });

  const setObs = (i: number, obs: string) =>
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, observacion: obs } : x)));
  const setCant = (i: number, c: number) =>
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, cantidad: Math.max(1, c) } : x)));
  const quitar = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const reset = () => {
    setCliente({ nombre: "", whatsapp: "", direccion: "", barrio: "" });
    setItems([]);
    setValorDomicilio(0);
    setMetodo("efectivo");
    setFecha("");
  };

  const puedeRegistrar =
    items.length > 0 && !!cliente.nombre && !!cliente.direccion && !!fecha;

  const registrar = () => {
    if (!puedeRegistrar) return;
    addFactura({
      localId,
      tipo: "domicilio",
      estado: "pendiente",
      despachado: false,
      clienteNombre: cliente.nombre,
      clienteWhatsapp: cliente.whatsapp,
      direccion: cliente.direccion,
      barrio: cliente.barrio,
      valorDomicilio,
      items,
      metodoPago: metodo,
      subtotal,
      total,
      fechaProgramada: fecha,
    });
    setOk(true);
    reset();
    setTimeout(() => setOk(false), 2500);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {ok && <div className="lg:col-span-2"><Banner /></div>}

      <div className="space-y-5">
        <Card className="space-y-3 p-5">
          <p className="font-bold text-cocoa">Datos del cliente</p>
          <Input label="Nombre" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
          <Input label="WhatsApp" value={cliente.whatsapp} onChange={(e) => setCliente({ ...cliente, whatsapp: e.target.value })} />
          <Input label="Dirección" value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} />
          <Input label="Barrio" value={cliente.barrio} onChange={(e) => setCliente({ ...cliente, barrio: e.target.value })} />
        </Card>

        <Card className="p-5">
          <p className="mb-3 flex items-center gap-2 font-bold text-cocoa">
            <CalendarClock size={18} className="text-raspberry" /> Fecha para preparar
          </p>
          <Input type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <p className="mt-2 text-xs text-cocoa/50">
            El pedido aparecerá en Cocina hasta el día seleccionado.
          </p>
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-bold text-cocoa">Agregar productos</p>
          <ProductPicker localId={localId} onAdd={addItem} />
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="p-5">
          <p className="mb-3 font-bold text-cocoa">Pedido</p>
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-cocoa/50">Aún no hay productos.</p>
          ) : (
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="rounded-xl border border-sand p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-cocoa">{it.nombre}</p>
                    <button onClick={() => quitar(i)} className="text-cocoa/40 hover:text-raspberry"><Trash2 size={16} /></button>
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
                      placeholder="Observación (ej: sin queso, sin cebolla)"
                      className="w-full rounded-lg border border-sand bg-vanilla px-3 py-1.5 text-sm focus:border-raspberry focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <Input
            label="Valor del domicilio (COP)"
            type="number"
            value={valorDomicilio || ""}
            onChange={(e) => setValorDomicilio(Number(e.target.value) || 0)}
          />
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-bold text-cocoa">Método de pago</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metodosPago.map((m) => (
              <button
                key={m.value}
                onClick={() => setMetodo(m.value)}
                className={cx(
                  "rounded-xl border px-3 py-2.5 text-sm font-bold transition",
                  metodo === m.value ? "border-raspberry bg-raspberry text-white" : "border-sand bg-white text-cocoa hover:border-raspberry"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-cocoa/70"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
            {valorDomicilio > 0 && (
              <div className="flex justify-between text-cocoa/70"><span>Domicilio</span><span>{formatCOP(valorDomicilio)}</span></div>
            )}
            <div className="flex justify-between border-t border-sand pt-2 text-lg font-black text-cocoa">
              <span>Total</span><span>{formatCOP(total)}</span>
            </div>
          </div>
          <Button className="mt-4 w-full" size="lg" disabled={!puedeRegistrar} onClick={registrar}>
            Registrar reserva
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-pistachio/30 px-4 py-3 font-bold text-cocoa animate-fade-up">
      <Check size={18} /> Reserva registrada. Aparecerá en Cocina el día programado.
    </div>
  );
}
