"use client";
import { useState } from "react";
import { Trash2, MessageSquarePlus } from "lucide-react";
import { useData } from "@/store/dataStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductPicker } from "./ProductPicker";
import { cx, formatCOP } from "@/lib/utils";
import {
  esDomicilioLike, folio, metodosPagoOrden, metodosPagoFavor, mediosTransferencia,
  combosMixtoFavor, comboFavorIncluye, calcFavorMixto, subtotalDe, totalDe,
} from "@/lib/factura";
import { Factura, ItemFactura, MetodoPago, MedioTransferencia, TipoMixtoFavor } from "@/types";

// Edición inteligente:
// - Si se agregan productos a una factura ya preparada (estado "listo" o "completado"),
//   los nuevos ítems se marcan con `nuevo: true` (fondo rosado) y la factura vuelve a "pendiente" (cocina).
// - Si solo cambian método de pago / barrio / datos, NO vuelve a cocina:
//   si estaba completada o lista, se deja lista para el despachador.
// - Tipo "favor": usa metodosPagoFavor (incluye "Domiciliario") y, para Mixto,
//   el mismo selector de combinaciones que Facturar.tsx (ver registrarFavor),
//   en vez del split genérico efectivo/transferencia de los demás tipos.
export function EditarFacturaInteligente({
  factura, onClose,
}: {
  factura: Factura;
  onClose: () => void;
}) {
  const updateFactura = useData((s) => s.updateFactura);
  const esFavor = factura.tipo === "favor";

  const [items, setItems] = useState<ItemFactura[]>(factura.items.map((it) => ({ ...it, nuevo: false })));
  const [metodo, setMetodo] = useState<MetodoPago>(factura.metodoPago);
  const [barrio, setBarrio] = useState(factura.barrio || "");
  const [valorDom, setValorDom] = useState(factura.valorDomicilio || 0);
  // Pago Mixto: carga los valores exactos ya guardados, sin recalcular.
  const [valorEfectivo, setValorEfectivo] = useState(factura.valorEfectivo ?? 0);
  const [medioTransferencia, setMedioTransferencia] = useState<MedioTransferencia | "">(factura.medioTransferencia ?? "");
  // Pago Mixto en Favor: combinación elegida + sus campos propios.
  const [tipoMixtoFavor, setTipoMixtoFavor] = useState<TipoMixtoFavor | "">(factura.tipoMixtoFavor ?? "");
  const [valorTransferenciaFavor, setValorTransferenciaFavor] = useState(
    factura.tipoMixtoFavor === "transferencia-domiciliario" ? (factura.valorTransferencia ?? 0) : 0
  );
  const [valorAdelantado, setValorAdelantado] = useState(factura.valorDomiciliarioAdelantado ?? 0);

  const resetFavorMixto = () => {
    setTipoMixtoFavor("");
    setValorEfectivo(0);
    setValorTransferenciaFavor(0);
    setMedioTransferencia("");
    setValorAdelantado(0);
  };

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
  const esDomicilioTipo = esDomicilioLike(factura.tipo);
  const total = totalDe(items, (esDomicilioTipo || esFavor) ? valorDom : 0);

  // ── Mixto genérico (mesa/domicilio/reserva-*): transferencia = total - efectivo ──
  const valorTransferencia = !esFavor && metodo === "mixto" ? Math.max(0, total - valorEfectivo) : 0;

  // ── Mixto en Favor: mismas fórmulas que registrarFavor() en Facturar.tsx ──
  const transferenciaFavorEsAuto = tipoMixtoFavor === "efectivo-transferencia";
  const valorTransferenciaFavorCalculado = transferenciaFavorEsAuto
    ? Math.max(0, subtotal - valorEfectivo)
    : valorTransferenciaFavor;
  const valorAdelantadoCalculado =
    tipoMixtoFavor === "transferencia-domiciliario"
      ? Math.max(0, subtotal - valorTransferenciaFavor)
      : tipoMixtoFavor === "efectivo-domiciliario"
      ? Math.max(0, subtotal - valorEfectivo)
      : valorAdelantado;
  const favorMixtoCalc =
    esFavor && metodo === "mixto" && tipoMixtoFavor
      ? calcFavorMixto(tipoMixtoFavor, valorDom || 0, valorAdelantadoCalculado)
      : { descuento: 0, sobranteEfectivo: 0 };
  const favorMixtoValido =
    !esFavor || metodo !== "mixto" || (
      !!tipoMixtoFavor &&
      (!comboFavorIncluye(tipoMixtoFavor, "efectivo") || valorEfectivo > 0) &&
      (!comboFavorIncluye(tipoMixtoFavor, "transferencia") || (
        transferenciaFavorEsAuto
          ? !!medioTransferencia
          : (valorTransferenciaFavor > 0 && !!medioTransferencia)
      ))
    );

  const mixtoValido = esFavor
    ? favorMixtoValido
    : metodo !== "mixto" || valorTransferencia === 0 || !!medioTransferencia;

  const guardar = () => {
    if (!mixtoValido) return;

    const esMixtoFavor = esFavor && metodo === "mixto" && !!tipoMixtoFavor;
    const descuentoFavor = esMixtoFavor
      ? favorMixtoCalc.descuento
      : metodo === "domiciliario" ? total : (valorDom || 0);
    const sobranteFavor = esMixtoFavor ? favorMixtoCalc.sobranteEfectivo : 0;
    const incluyeEfectivo = esMixtoFavor && comboFavorIncluye(tipoMixtoFavor as TipoMixtoFavor, "efectivo");
    const incluyeTransferencia = esMixtoFavor && comboFavorIncluye(tipoMixtoFavor as TipoMixtoFavor, "transferencia");
    const incluyeDomiciliario = esMixtoFavor && comboFavorIncluye(tipoMixtoFavor as TipoMixtoFavor, "domiciliario");

    const base: Partial<Factura> = esFavor ? {
      items,
      metodoPago: metodo,
      valorDomicilio: valorDom || undefined,
      subtotal,
      total,
      descuentoDomiciliario: descuentoFavor > 0 ? descuentoFavor : undefined,
      tipoMixtoFavor: esMixtoFavor ? tipoMixtoFavor : undefined,
      valorEfectivo: incluyeEfectivo ? valorEfectivo : undefined,
      valorTransferencia: incluyeTransferencia ? valorTransferenciaFavorCalculado : undefined,
      medioTransferencia: incluyeTransferencia ? (medioTransferencia as MedioTransferencia) : undefined,
      valorDomiciliarioAdelantado: incluyeDomiciliario ? valorAdelantadoCalculado : undefined,
      efectivoSobranteFavor: sobranteFavor > 0 ? sobranteFavor : undefined,
    } : {
      items,
      metodoPago: metodo,
      barrio: esDomicilioTipo ? barrio : undefined,
      valorDomicilio: esDomicilioTipo ? valorDom : undefined,
      subtotal,
      total,
      valorEfectivo: metodo === "mixto" ? valorEfectivo : undefined,
      valorTransferencia: metodo === "mixto" ? valorTransferencia : undefined,
      medioTransferencia: metodo === "mixto" ? (medioTransferencia as MedioTransferencia) : undefined,
    };

    if (seAgregaronProductos) {
      // Vuelve a cocina; los ítems nuevos conservan su marca rosada.
      // Se resetean las validaciones de categoría para que cocina vuelva a completarlas.
      updateFactura(factura.id, { ...base, estado: "pendiente", despachado: false, heladeriaLista: false, comidasListas: false });
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
          <Button onClick={guardar} disabled={!mixtoValido}>Guardar</Button>
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

        {!esFavor && (
          <div>
            <p className="mb-2 text-sm font-bold text-cocoa/80">Agregar producto</p>
            <ProductPicker localId={factura.localId} onAdd={addItem} />
          </div>
        )}

        {esFavor && (
          <Input
            label="Valor del domicilio (COP)"
            type="number"
            value={valorDom || ""}
            onChange={(e) => setValorDom(Number(e.target.value) || 0)}
          />
        )}

        <div>
          <p className="mb-2 text-sm font-bold text-cocoa/80">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {(esFavor ? metodosPagoFavor : metodosPagoOrden).map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  if (m.value === metodo) return;
                  setMetodo(m.value);
                  setValorEfectivo(0);
                  setMedioTransferencia("");
                  if (esFavor) resetFavorMixto();
                }}
                className={cx(
                  "rounded-xl border px-3 py-2 text-sm font-bold transition",
                  metodo === m.value ? "border-raspberry bg-raspberry text-white" : "border-sand bg-white text-cocoa"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Mixto genérico (mesa/domicilio/reserva-*) */}
          {!esFavor && metodo === "mixto" && (
            <div className="mt-4 space-y-3 rounded-xl border border-raspberry/20 bg-raspberry-light/20 p-3 animate-fade-up">
              <Input
                label="Valor en efectivo (COP)"
                type="number"
                value={valorEfectivo || ""}
                onChange={(e) => setValorEfectivo(Math.min(Number(e.target.value) || 0, total))}
              />
              <div className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-2.5">
                <span className="text-sm text-cocoa/70">Valor en transferencia</span>
                <span className="font-bold text-cocoa">{formatCOP(valorTransferencia)}</span>
              </div>
              {valorTransferencia > 0 && (
                <>
                  <p className="text-sm font-bold text-cocoa/80">¿Por qué medio de transferencia?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {mediosTransferencia.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMedioTransferencia(m.value)}
                        className={cx(
                          "rounded-xl border px-3 py-2 text-sm font-bold transition",
                          medioTransferencia === m.value
                            ? "border-raspberry bg-raspberry text-white"
                            : "border-sand bg-white text-cocoa hover:border-raspberry"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mixto en Favor: combinación Efectivo/Transferencia/Domiciliario */}
          {esFavor && metodo === "mixto" && (
            <div className="mt-4 space-y-3 rounded-xl border border-raspberry/20 bg-raspberry-light/20 p-3 animate-fade-up">
              <p className="text-sm font-bold text-cocoa/80">¿Qué combinación de pago fue?</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {combosMixtoFavor.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setTipoMixtoFavor(c.value);
                      setValorEfectivo(0);
                      setValorTransferenciaFavor(0);
                      setMedioTransferencia("");
                      setValorAdelantado(0);
                    }}
                    className={cx(
                      "rounded-xl border px-3 py-2 text-sm font-bold transition",
                      tipoMixtoFavor === c.value
                        ? "border-raspberry bg-raspberry text-white"
                        : "border-sand bg-white text-cocoa hover:border-raspberry"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {tipoMixtoFavor && (
                <div className="space-y-3 animate-fade-up">
                  {comboFavorIncluye(tipoMixtoFavor, "efectivo") && (
                    <Input
                      label="Valor en efectivo (COP)"
                      type="number"
                      value={valorEfectivo || ""}
                      onChange={(e) => setValorEfectivo(Number(e.target.value) || 0)}
                    />
                  )}
                  {comboFavorIncluye(tipoMixtoFavor, "transferencia") && (
                    <>
                      {transferenciaFavorEsAuto ? (
                        <div className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-2.5">
                          <span className="text-sm text-cocoa/70">Valor en transferencia</span>
                          <span className="font-bold text-cocoa">{formatCOP(valorTransferenciaFavorCalculado)}</span>
                        </div>
                      ) : (
                        <Input
                          label="Valor en transferencia (COP)"
                          type="number"
                          value={valorTransferenciaFavor || ""}
                          onChange={(e) => setValorTransferenciaFavor(Number(e.target.value) || 0)}
                        />
                      )}
                      <p className="text-sm font-bold text-cocoa/80">¿Por qué medio de transferencia?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {mediosTransferencia.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setMedioTransferencia(m.value)}
                            className={cx(
                              "rounded-xl border px-3 py-2 text-sm font-bold transition",
                              medioTransferencia === m.value
                                ? "border-raspberry bg-raspberry text-white"
                                : "border-sand bg-white text-cocoa hover:border-raspberry"
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {comboFavorIncluye(tipoMixtoFavor, "domiciliario") && (
                    <div className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-2.5">
                      <span className="text-sm text-cocoa/70">Valor pagado por el domiciliario</span>
                      <span className="font-bold text-cocoa">{formatCOP(valorAdelantadoCalculado)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
