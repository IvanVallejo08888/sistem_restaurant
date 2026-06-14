"use client";
import { useMemo, useState } from "react";
import { Trash2, MessageSquarePlus, Armchair, Bike, Check } from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { ProductPicker } from "./ProductPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { formatCOP, cx } from "@/lib/utils";
import { subtotalDe, totalDe, metodosPago } from "@/lib/factura";
import { ItemFactura, MetodoPago, TipoFactura } from "@/types";

export function Facturar() {
  const localId = useSession((s) => s.localId)!;
  const mesas = useData((s) => s.mesas.filter((m) => m.localId === localId));
  const addFactura = useData((s) => s.addFactura);

  const [tipo, setTipo] = useState<TipoFactura | null>(null);
  const [mesaId, setMesaId] = useState("");
  const [cliente, setCliente] = useState({ nombre: "", whatsapp: "", direccion: "", barrio: "" });
  const [items, setItems] = useState<ItemFactura[]>([]);
  const [valorDomicilio, setValorDomicilio] = useState(0);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [ok, setOk] = useState(false);

  const subtotal = useMemo(() => subtotalDe(items), [items]);
  const total = useMemo(
    () => totalDe(items, tipo === "domicilio" ? valorDomicilio : 0),
    [items, valorDomicilio, tipo]
  );

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
    setTipo(null); setMesaId(""); setItems([]); setValorDomicilio(0);
    setMetodo("efectivo"); setCliente({ nombre: "", whatsapp: "", direccion: "", barrio: "" });
  };

  const puedeRegistrar =
    items.length > 0 &&
    (tipo === "mesa" ? !!mesaId : !!cliente.nombre && !!cliente.direccion);

  const registrar = () => {
    if (!tipo || !puedeRegistrar) return;
    const mesa = mesas.find((m) => m.id === mesaId);
    addFactura({
      localId,
      tipo,
      estado: "pendiente",
      despachado: false,
      mesaId: tipo === "mesa" ? mesaId : undefined,
      mesaNombre: tipo === "mesa" ? mesa?.nombre : undefined,
      clienteNombre: tipo === "domicilio" ? cliente.nombre : undefined,
      clienteWhatsapp: tipo === "domicilio" ? cliente.whatsapp : undefined,
      direccion: tipo === "domicilio" ? cliente.direccion : undefined,
      barrio: tipo === "domicilio" ? cliente.barrio : undefined,
      valorDomicilio: tipo === "domicilio" ? valorDomicilio : undefined,
      items,
      metodoPago: metodo,
      subtotal,
      total,
    });
    setOk(true);
    reset();
    setTimeout(() => setOk(false), 2500);
  };

  // Paso 1: elegir tipo
  if (!tipo) {
    return (
      <div className="mx-auto max-w-xl">
        {ok && <Banner />}
        <h2 className="mb-6 font-display text-2xl font-semibold text-cocoa">¿Qué deseas facturar?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setTipo("mesa")}
            className="group rounded-xl2 border border-sand bg-gradient-to-br from-mint/10 to-mint/30 p-8 text-left transition hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-mint shadow-card"><Armchair size={28} /></div>
            <p className="font-display text-xl font-semibold text-cocoa">Mesa</p>
            <p className="text-sm text-cocoa/60">Consumo en el local</p>
          </button>
          <button
            onClick={() => setTipo("domicilio")}
            className="group rounded-xl2 border border-sand bg-gradient-to-br from-raspberry/10 to-raspberry-light/40 p-8 text-left transition hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-raspberry shadow-card"><Bike size={28} /></div>
            <p className="font-display text-xl font-semibold text-cocoa">Domicilio</p>
            <p className="text-sm text-cocoa/60">Entrega a domicilio</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {ok && <div className="lg:col-span-2"><Banner /></div>}

      {/* Columna izquierda: datos + selección */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className={cx("rounded-full px-3 py-1 text-sm font-bold", tipo === "mesa" ? "bg-mint/20 text-cocoa" : "bg-raspberry-light text-raspberry-dark")}>
            {tipo === "mesa" ? "Mesa" : "Domicilio"}
          </span>
          <button onClick={reset} className="text-sm font-semibold text-cocoa/60 hover:text-raspberry">Cambiar</button>
        </div>

        {tipo === "mesa" ? (
          <Card className="p-5">
            <p className="mb-3 font-bold text-cocoa">Selecciona la mesa</p>
            {mesas.length === 0 ? (
              <p className="text-sm text-cocoa/60">No hay mesas registradas. Pídele al admin que las cree.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {mesas.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMesaId(m.id)}
                    className={cx(
                      "rounded-xl border px-3 py-3 text-sm font-bold transition",
                      mesaId === m.id ? "border-raspberry bg-raspberry text-white" : "border-sand bg-white text-cocoa hover:border-raspberry"
                    )}
                  >
                    {m.nombre}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-cocoa/50">Se permite repetir mesas en distintas facturas.</p>
          </Card>
        ) : (
          <Card className="space-y-3 p-5">
            <p className="font-bold text-cocoa">Datos del cliente</p>
            <Input label="Nombre" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            <Input label="WhatsApp" value={cliente.whatsapp} onChange={(e) => setCliente({ ...cliente, whatsapp: e.target.value })} />
            <Input label="Dirección" value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} />
            <Input label="Barrio" value={cliente.barrio} onChange={(e) => setCliente({ ...cliente, barrio: e.target.value })} />
          </Card>
        )}

        <Card className="p-5">
          <p className="mb-3 font-bold text-cocoa">Agregar productos</p>
          <ProductPicker localId={localId} onAdd={addItem} />
        </Card>
      </div>

      {/* Columna derecha: pedido + pago */}
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

        {tipo === "domicilio" && (
          <Card className="p-5">
            <Input
              label="Valor del domicilio (COP)"
              type="number"
              value={valorDomicilio || ""}
              onChange={(e) => setValorDomicilio(Number(e.target.value) || 0)}
            />
          </Card>
        )}

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
            {tipo === "domicilio" && valorDomicilio > 0 && (
              <div className="flex justify-between text-cocoa/70"><span>Domicilio</span><span>{formatCOP(valorDomicilio)}</span></div>
            )}
            <div className="flex justify-between border-t border-sand pt-2 text-lg font-black text-cocoa">
              <span>Total</span><span>{formatCOP(total)}</span>
            </div>
          </div>
          <Button className="mt-4 w-full" size="lg" disabled={!puedeRegistrar} onClick={registrar}>
            Registrar factura
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-pistachio/30 px-4 py-3 font-bold text-cocoa animate-fade-up">
      <Check size={18} /> Factura registrada y enviada a cocina.
    </div>
  );
}
