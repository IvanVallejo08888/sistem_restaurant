"use client";
import { useMemo, useState } from "react";
import {
  Trash2, MessageSquarePlus, Armchair, Bike, Check,
  Gift, CalendarClock, Plus, CircleAlert,
} from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { ProductPicker } from "./ProductPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { formatCOP, cx, uid, now } from "@/lib/utils";
import {
  subtotalDe, totalDe, metodosPagoOrden, metodosPagoFavor, mediosTransferencia,
  combosMixtoFavor, comboFavorIncluye, calcFavorMixto,
} from "@/lib/factura";
import { ItemFactura, MetodoPago, MedioTransferencia, TipoFactura, TipoMixtoFavor } from "@/types";

export function Facturar() {
  const localId = useSession((s) => s.localId)!;
  const mesas = useData((s) => s.mesas.filter((m) => m.localId === localId));
  const addFactura = useData((s) => s.addFactura);

  const hoy = now().slice(0, 10);

  // ── tipo elegido ──────────────────────────────────────────────────────
  const [tipo, setTipo] = useState<TipoFactura | null>(null);

  // ── estado compartido mesa / domicilio / reserva-* ───────────────────
  const [mesaId, setMesaId] = useState("");
  const [cliente, setCliente] = useState({ nombre: "", whatsapp: "", direccion: "", barrio: "" });
  const [items, setItems] = useState<ItemFactura[]>([]);
  const [valorDomicilio, setValorDomicilio] = useState(0);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  // Para pago Mixto en órdenes normales:
  const [valorEfectivo, setValorEfectivo] = useState(0);
  const [medioOrden, setMedioOrden] = useState<MedioTransferencia | "">("");

  // ── estado para reservas ─────────────────────────────────────────────
  const [fechaReserva, setFechaReserva] = useState("");
  const [horaReserva, setHoraReserva] = useState("");
  const [reservaFechaOk, setReservaFechaOk] = useState(false);

  // ── estado para Favor ────────────────────────────────────────────────
  const [nombreFavor, setNombreFavor] = useState("");
  const [itemsFavor, setItemsFavor] = useState<{ id: string; nombre: string; precio: number }[]>([
    { id: "1", nombre: "", precio: 0 },
  ]);
  const [metodoFavor, setMetodoFavor] = useState<MetodoPago>("efectivo");
  const [favorValorDom, setFavorValorDom] = useState(0);
  // Para pago Mixto en favores:
  const [tipoMixtoFavor, setTipoMixtoFavor] = useState<TipoMixtoFavor | "">("");
  const [favorValorEfectivoMixto, setFavorValorEfectivoMixto] = useState(0);
  const [favorValorTransferenciaMixto, setFavorValorTransferenciaMixto] = useState(0);
  const [favorMedioTransferenciaMixto, setFavorMedioTransferenciaMixto] = useState<MedioTransferencia | "">("");
  const [favorValorAdelantado, setFavorValorAdelantado] = useState(0);

  const resetFavorMixto = () => {
    setTipoMixtoFavor("");
    setFavorValorEfectivoMixto(0);
    setFavorValorTransferenciaMixto(0);
    setFavorMedioTransferenciaMixto("");
    setFavorValorAdelantado(0);
  };

  const [ok, setOk] = useState(false);
  // Causa raíz del bug "Favor no aparece en Despachador": registrar()/registrarFavor()
  // llamaban a addFactura() sin esperar el resultado ni capturar errores, así que si el
  // insert a Supabase fallaba (p. ej. columna inexistente) la UI igual mostraba éxito y
  // limpiaba el formulario, dando la falsa impresión de que la factura se había guardado.
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // ── cálculos ──────────────────────────────────────────────────────────
  const subtotal = useMemo(() => subtotalDe(items), [items]);
  const esDomicilioTipo = tipo === "domicilio" || tipo === "reserva-domicilio";
  const total = useMemo(
    () => totalDe(items, esDomicilioTipo ? valorDomicilio : 0),
    [items, valorDomicilio, esDomicilioTipo]
  );
  // Mixto: transferencia = total - efectivo
  const valorTransferencia = metodo === "mixto" ? Math.max(0, total - valorEfectivo) : 0;

  // ── acciones sobre items ─────────────────────────────────────────────
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

  // ── acciones sobre items de favor ────────────────────────────────────
  const agregarItemFavor = () =>
    setItemsFavor((prev) => [...prev, { id: uid(), nombre: "", precio: 0 }]);
  const quitarItemFavor = (id: string) =>
    setItemsFavor((prev) => prev.filter((it) => it.id !== id));
  const updateItemFavor = (id: string, field: "nombre" | "precio", value: string | number) =>
    setItemsFavor((prev) => prev.map((it) => it.id === id ? { ...it, [field]: value } : it));

  // ── reset ─────────────────────────────────────────────────────────────
  const reset = () => {
    setTipo(null);
    setMesaId("");
    setItems([]);
    setValorDomicilio(0);
    setMetodo("efectivo");
    setValorEfectivo(0);
    setMedioOrden("");
    setCliente({ nombre: "", whatsapp: "", direccion: "", barrio: "" });
    setFechaReserva("");
    setHoraReserva("");
    setReservaFechaOk(false);
    setNombreFavor("");
    setItemsFavor([{ id: "1", nombre: "", precio: 0 }]);
    setMetodoFavor("efectivo");
    setFavorValorDom(0);
    resetFavorMixto();
    setError(null);
  };

  // ── validaciones ──────────────────────────────────────────────────────
  const esMesaTipo = tipo === "mesa" || tipo === "reserva-mesa";

  // Mixto válido: valorEfectivo >= 0, valorEfectivo <= total, y medioOrden seleccionado
  const mixtoValido =
    metodo !== "mixto" ||
    (valorEfectivo >= 0 && valorEfectivo <= total && !!medioOrden);

  const puedeRegistrar =
    !!tipo &&
    tipo !== "favor" &&
    items.length > 0 &&
    (esMesaTipo ? !!mesaId : !!cliente.nombre && !!cliente.direccion) &&
    ((tipo === "reserva-mesa" || tipo === "reserva-domicilio") ? !!fechaReserva : true) &&
    mixtoValido;

  const itemsFavorValidos = itemsFavor.filter((it) => it.nombre.trim() && it.precio > 0);
  const subtotalFavor = itemsFavorValidos.reduce((s, it) => s + it.precio, 0);

  // Combinación "Efectivo y Transferencia": la transferencia se autocalcula
  // como el restante del subtotal del producto, igual que en el mixto normal.
  const transferenciaFavorEsAuto = tipoMixtoFavor === "efectivo-transferencia";
  const favorValorTransferenciaCalculado = transferenciaFavorEsAuto
    ? Math.max(0, subtotalFavor - favorValorEfectivoMixto)
    : favorValorTransferenciaMixto;

  // Combinaciones con Domiciliario: el adelanto siempre es el restante del
  // subtotal del producto frente al otro medio (transferencia o efectivo).
  const favorValorAdelantadoCalculado =
    tipoMixtoFavor === "transferencia-domiciliario"
      ? Math.max(0, subtotalFavor - favorValorTransferenciaMixto)
      : tipoMixtoFavor === "efectivo-domiciliario"
      ? Math.max(0, subtotalFavor - favorValorEfectivoMixto)
      : favorValorAdelantado;

  // Favor con pago Mixto: descuento al domiciliario + sobrante de efectivo según combinación
  const favorMixtoCalc = useMemo(() => {
    if (metodoFavor !== "mixto" || !tipoMixtoFavor) return { descuento: 0, sobranteEfectivo: 0 };
    return calcFavorMixto(tipoMixtoFavor, favorValorDom || 0, favorValorEfectivoMixto, favorValorAdelantadoCalculado);
  }, [metodoFavor, tipoMixtoFavor, favorValorDom, favorValorEfectivoMixto, favorValorAdelantadoCalculado]);

  // Mixto válido: combinación elegida y todos sus campos de valor presentes
  const favorMixtoValido =
    metodoFavor !== "mixto" ||
    (
      !!tipoMixtoFavor &&
      (!comboFavorIncluye(tipoMixtoFavor, "efectivo") || favorValorEfectivoMixto > 0) &&
      (!comboFavorIncluye(tipoMixtoFavor, "transferencia") || (
        transferenciaFavorEsAuto
          ? !!favorMedioTransferenciaMixto
          : (favorValorTransferenciaMixto > 0 && !!favorMedioTransferenciaMixto)
      ))
    );

  const puedeRegistrarFavor =
    !!nombreFavor.trim() &&
    itemsFavorValidos.length > 0 &&
    !!metodoFavor &&
    favorMixtoValido;

  // ── submit normal (mesa/domicilio/reserva-*) ──────────────────────────
  const registrar = async () => {
    if (!tipo || tipo === "favor" || !puedeRegistrar || guardando) return;
    const mesa = mesas.find((m) => m.id === mesaId);
    setError(null);
    setGuardando(true);
    try {
      await addFactura({
        localId,
        tipo,
        estado: "pendiente",
        despachado: false,
        mesaId: esMesaTipo ? mesaId : undefined,
        mesaNombre: esMesaTipo ? mesa?.nombre : undefined,
        clienteNombre: esDomicilioTipo ? cliente.nombre : undefined,
        clienteWhatsapp: esDomicilioTipo ? cliente.whatsapp : undefined,
        direccion: esDomicilioTipo ? cliente.direccion : undefined,
        barrio: esDomicilioTipo ? cliente.barrio : undefined,
        valorDomicilio: esDomicilioTipo ? valorDomicilio : undefined,
        items,
        metodoPago: metodo,
        // Pago mixto
        valorEfectivo: metodo === "mixto" ? valorEfectivo : undefined,
        valorTransferencia: metodo === "mixto" ? valorTransferencia : undefined,
        medioTransferencia: metodo === "mixto" ? (medioOrden as MedioTransferencia) : undefined,
        subtotal,
        total,
        fechaProgramada: (tipo === "reserva-mesa" || tipo === "reserva-domicilio") ? fechaReserva : undefined,
        horaReserva: (tipo === "reserva-mesa" || tipo === "reserva-domicilio") ? (horaReserva || undefined) : undefined,
      });
      setOk(true);
      reset();
      setTimeout(() => setOk(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la factura.");
    } finally {
      setGuardando(false);
    }
  };

  // ── submit favor ──────────────────────────────────────────────────────
  const registrarFavor = async () => {
    if (!puedeRegistrarFavor || guardando) return;
    const totalFavor = subtotalFavor + (favorValorDom || 0);
    // Descuento al domiciliario:
    // "domiciliario" → descuenta todo (producto + domicilio) al domiciliario.
    // "mixto" → según la combinación elegida (ver calcFavorMixto).
    // otro método → solo se descuenta el domicilio al domiciliario.
    const esMixtoFavor = metodoFavor === "mixto" && !!tipoMixtoFavor;
    const descuento = esMixtoFavor
      ? favorMixtoCalc.descuento
      : metodoFavor === "domiciliario" ? totalFavor : (favorValorDom || 0);
    const sobranteFavor = esMixtoFavor ? favorMixtoCalc.sobranteEfectivo : 0;
    const incluyeEfectivo = esMixtoFavor && comboFavorIncluye(tipoMixtoFavor, "efectivo");
    const incluyeTransferencia = esMixtoFavor && comboFavorIncluye(tipoMixtoFavor, "transferencia");
    const incluyeDomiciliario = esMixtoFavor && comboFavorIncluye(tipoMixtoFavor, "domiciliario");

    setError(null);
    setGuardando(true);
    try {
      await addFactura({
        localId,
        tipo: "favor",
        estado: "listo",
        despachado: false,
        nombreFavor: nombreFavor.trim(),
        items: itemsFavorValidos.map((it) => ({
          productoId: uid(),
          nombre: it.nombre.trim(),
          valor: it.precio,
          cantidad: 1,
        })),
        metodoPago: metodoFavor,
        descuentoDomiciliario: descuento > 0 ? descuento : undefined,
        valorDomicilio: favorValorDom > 0 ? favorValorDom : undefined,
        subtotal: subtotalFavor,
        total: totalFavor,
        tipoMixtoFavor: esMixtoFavor ? tipoMixtoFavor : undefined,
        valorEfectivo: incluyeEfectivo ? favorValorEfectivoMixto : undefined,
        valorTransferencia: incluyeTransferencia ? favorValorTransferenciaCalculado : undefined,
        medioTransferencia: incluyeTransferencia ? (favorMedioTransferenciaMixto as MedioTransferencia) : undefined,
        valorDomiciliarioAdelantado: incluyeDomiciliario ? favorValorAdelantadoCalculado : undefined,
        efectivoSobranteFavor: sobranteFavor > 0 ? sobranteFavor : undefined,
      });
      setOk(true);
      reset();
      setTimeout(() => setOk(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el favor.");
    } finally {
      setGuardando(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // PASO 1 — elegir tipo (5 cards)
  // ══════════════════════════════════════════════════════════════════════
  if (!tipo) {
    return (
      <div className="mx-auto max-w-2xl">
        {ok && <Banner />}
        {error && <ErrorBanner mensaje={error} />}
        <h2 className="mb-6 font-display text-2xl font-semibold text-cocoa">¿Qué deseas facturar?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <button
            onClick={() => setTipo("favor")}
            className="group rounded-xl2 border border-sand bg-gradient-to-br from-pistachio/20 to-pistachio/40 p-8 text-left transition hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-cocoa shadow-card"><Gift size={28} /></div>
            <p className="font-display text-xl font-semibold text-cocoa">Favor</p>
            <p className="text-sm text-cocoa/60">Pedido especial</p>
          </button>
          <button
            onClick={() => setTipo("reserva-domicilio")}
            className="group rounded-xl2 border border-sand bg-gradient-to-br from-raspberry/5 to-raspberry-light/30 p-8 text-left transition hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center gap-0.5 rounded-2xl bg-white text-raspberry-dark shadow-card">
              <CalendarClock size={22} /><Bike size={18} />
            </div>
            <p className="font-display text-xl font-semibold text-cocoa">Reserva Domicilio</p>
            <p className="text-sm text-cocoa/60">Con fecha y hora</p>
          </button>
          <button
            onClick={() => setTipo("reserva-mesa")}
            className="group rounded-xl2 border border-sand bg-gradient-to-br from-mint/5 to-pistachio/25 p-8 text-left transition hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center gap-0.5 rounded-2xl bg-white text-mint shadow-card">
              <CalendarClock size={22} /><Armchair size={18} />
            </div>
            <p className="font-display text-xl font-semibold text-cocoa">Reserva Mesa</p>
            <p className="text-sm text-cocoa/60">Con fecha y hora</p>
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // FAVOR — formulario completo de pedido especial
  // ══════════════════════════════════════════════════════════════════════
  if (tipo === "favor") {
    const totalFavor = subtotalFavor + (favorValorDom || 0);
    const descuento = metodoFavor === "mixto"
      ? favorMixtoCalc.descuento
      : metodoFavor === "domiciliario" ? totalFavor : (favorValorDom || 0);
    const sobranteFavor = metodoFavor === "mixto" ? favorMixtoCalc.sobranteEfectivo : 0;

    return (
      <div className="mx-auto max-w-xl space-y-5">
        {ok && <Banner />}
        {error && <ErrorBanner mensaje={error} />}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pistachio/30 px-3 py-1 text-sm font-bold text-cocoa">Favor</span>
          <button onClick={reset} className="text-sm font-semibold text-cocoa/60 hover:text-raspberry">Cambiar</button>
        </div>

        <Card className="p-5">
          <Input
            label="Nombre del favor"
            value={nombreFavor}
            onChange={(e) => setNombreFavor(e.target.value)}
            placeholder="Ej: Helado para domiciliario, cortesía cliente…"
          />
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-bold text-cocoa">Productos</p>
          <div className="space-y-3">
            {itemsFavor.map((it) => (
              <div key={it.id} className="flex items-center gap-2">
                <input
                  value={it.nombre}
                  onChange={(e) => updateItemFavor(it.id, "nombre", e.target.value)}
                  placeholder="Nombre del producto"
                  className="flex-1 rounded-xl border border-sand bg-vanilla px-3 py-2 text-sm focus:border-raspberry focus:outline-none"
                />
                <input
                  type="number"
                  value={it.precio || ""}
                  onChange={(e) => updateItemFavor(it.id, "precio", Number(e.target.value) || 0)}
                  placeholder="Precio"
                  className="w-28 rounded-xl border border-sand bg-vanilla px-3 py-2 text-sm focus:border-raspberry focus:outline-none"
                />
                {itemsFavor.length > 1 && (
                  <button onClick={() => quitarItemFavor(it.id)} className="text-cocoa/40 hover:text-raspberry">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={agregarItemFavor}
            className="mt-3 flex items-center gap-1 text-sm font-semibold text-raspberry hover:text-raspberry-dark"
          >
            <Plus size={15} /> Agregar producto
          </button>
        </Card>

        <Card className="p-5">
          <Input
            label="Valor del domicilio (opcional, COP)"
            type="number"
            value={favorValorDom || ""}
            onChange={(e) => setFavorValorDom(Number(e.target.value) || 0)}
          />
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-bold text-cocoa">¿Cómo pagó el producto?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metodosPagoFavor.map((m) => (
              <button
                key={m.value}
                onClick={() => { setMetodoFavor(m.value); resetFavorMixto(); }}
                className={cx(
                  "rounded-xl border px-3 py-2.5 text-sm font-bold transition",
                  metodoFavor === m.value
                    ? "border-raspberry bg-raspberry text-white"
                    : "border-sand bg-white text-cocoa hover:border-raspberry"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-cocoa/50">
            {metodoFavor === "domiciliario"
              ? "Todo (producto + domicilio) se descuenta al domiciliario en efectivo."
              : metodoFavor === "mixto"
              ? "El descuento y el sobrante a entregar dependen de la combinación elegida."
              : favorValorDom > 0
              ? "El domicilio se descuenta al domiciliario. El producto es gasto de la empresa."
              : "El producto se registra como gasto de la empresa en este medio."}
          </p>

          {metodoFavor === "mixto" && (
            <div className="mt-4 space-y-3 rounded-xl border border-raspberry/20 bg-raspberry-light/20 p-3 animate-fade-up">
              <p className="text-sm font-bold text-cocoa/80">¿Qué combinación de pago fue?</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {combosMixtoFavor.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setTipoMixtoFavor(c.value);
                      setFavorValorEfectivoMixto(0);
                      setFavorValorTransferenciaMixto(0);
                      setFavorMedioTransferenciaMixto("");
                      setFavorValorAdelantado(0);
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
                      value={favorValorEfectivoMixto || ""}
                      onChange={(e) => setFavorValorEfectivoMixto(Number(e.target.value) || 0)}
                    />
                  )}
                  {comboFavorIncluye(tipoMixtoFavor, "transferencia") && (
                    <>
                      {transferenciaFavorEsAuto ? (
                        <div className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-2.5">
                          <span className="text-sm text-cocoa/70">Valor en transferencia</span>
                          <span className="font-bold text-cocoa">{formatCOP(favorValorTransferenciaCalculado)}</span>
                        </div>
                      ) : (
                        <Input
                          label="Valor en transferencia (COP)"
                          type="number"
                          value={favorValorTransferenciaMixto || ""}
                          onChange={(e) => setFavorValorTransferenciaMixto(Number(e.target.value) || 0)}
                        />
                      )}
                      <p className="text-sm font-bold text-cocoa/80">¿Por qué medio de transferencia?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {mediosTransferencia.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setFavorMedioTransferenciaMixto(m.value)}
                            className={cx(
                              "rounded-xl border px-3 py-2 text-sm font-bold transition",
                              favorMedioTransferenciaMixto === m.value
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
                      <span className="font-bold text-cocoa">{formatCOP(favorValorAdelantadoCalculado)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-cocoa/70">
              <span>Subtotal productos</span><span>{formatCOP(subtotalFavor)}</span>
            </div>
            {favorValorDom > 0 && (
              <div className="flex justify-between text-cocoa/70">
                <span>Domicilio</span><span>{formatCOP(favorValorDom)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-sand pt-2 text-lg font-black text-cocoa">
              <span>Total</span><span>{formatCOP(totalFavor)}</span>
            </div>
            {descuento > 0 && (
              <div className="mt-1 flex justify-between rounded-xl bg-raspberry-light/40 px-3 py-2 text-sm font-bold text-raspberry-dark">
                <span>Descuento al domiciliario</span><span>{formatCOP(descuento)}</span>
              </div>
            )}
            {sobranteFavor > 0 && (
              <div className="mt-1 flex justify-between rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
                <span>Sobrante de efectivo a entregar</span><span>{formatCOP(sobranteFavor)}</span>
              </div>
            )}
          </div>
          <Button className="mt-4 w-full" size="lg" disabled={!puedeRegistrarFavor || guardando} onClick={registrarFavor}>
            {guardando ? "Guardando…" : "Registrar favor"}
          </Button>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RESERVA — picker de fecha y hora (primer paso)
  // ══════════════════════════════════════════════════════════════════════
  if ((tipo === "reserva-domicilio" || tipo === "reserva-mesa") && !reservaFechaOk) {
    return (
      <div className="mx-auto max-w-sm">
        {ok && <Banner />}
        {error && <ErrorBanner mensaje={error} />}
        <div className="mb-4 flex items-center gap-2">
          <button onClick={reset} className="text-sm font-semibold text-cocoa/60 hover:text-raspberry">← Volver</button>
          <span className={cx(
            "rounded-full px-3 py-1 text-sm font-bold",
            tipo === "reserva-domicilio" ? "bg-raspberry-light text-raspberry-dark" : "bg-mint/20 text-cocoa"
          )}>
            {tipo === "reserva-domicilio" ? "Reserva Domicilio" : "Reserva Mesa"}
          </span>
        </div>
        <Card className="space-y-4 p-5">
          <p className="font-bold text-cocoa">Selecciona fecha y hora</p>
          <Input type="date" label="Fecha del pedido" min={hoy} value={fechaReserva} onChange={(e) => setFechaReserva(e.target.value)} />
          <Input type="time" label="Hora del pedido (opcional)" value={horaReserva} onChange={(e) => setHoraReserva(e.target.value)} />
          <p className="text-xs text-cocoa/50">El pedido aparecerá en Cocina el día seleccionado.</p>
          <Button className="w-full" disabled={!fechaReserva} onClick={() => setReservaFechaOk(true)}>Continuar</Button>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // FORMULARIO NORMAL — mesa, domicilio, reserva-* (fecha confirmada)
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {ok && <div className="lg:col-span-2"><Banner /></div>}
      {error && <div className="lg:col-span-2"><ErrorBanner mensaje={error} /></div>}

      {/* Columna izquierda */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className={cx(
            "rounded-full px-3 py-1 text-sm font-bold",
            esMesaTipo ? "bg-mint/20 text-cocoa" : "bg-raspberry-light text-raspberry-dark"
          )}>
            {tipo === "mesa" ? "Mesa" : tipo === "domicilio" ? "Domicilio" : tipo === "reserva-mesa" ? "Reserva Mesa" : "Reserva Domicilio"}
          </span>
          <button onClick={reset} className="text-sm font-semibold text-cocoa/60 hover:text-raspberry">Cambiar</button>
        </div>

        {(tipo === "reserva-mesa" || tipo === "reserva-domicilio") && fechaReserva && (
          <Card className="flex items-center gap-3 p-4">
            <CalendarClock size={18} className="text-raspberry" />
            <div>
              <p className="text-sm font-bold text-cocoa">{fechaReserva}</p>
              {horaReserva && <p className="text-xs text-cocoa/60">{horaReserva} h</p>}
            </div>
            <button onClick={() => setReservaFechaOk(false)} className="ml-auto text-xs text-cocoa/50 hover:text-raspberry">Cambiar fecha</button>
          </Card>
        )}

        {esMesaTipo ? (
          <Card className="p-5">
            <p className="mb-3 font-bold text-cocoa">Selecciona la mesa</p>
            {mesas.length === 0 ? (
              <p className="text-sm text-cocoa/60">No hay mesas registradas.</p>
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

      {/* Columna derecha */}
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
                      placeholder="Observación (ej: sin queso)"
                      className="w-full rounded-lg border border-sand bg-vanilla px-3 py-1.5 text-sm focus:border-raspberry focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {esDomicilioTipo && (
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
            {metodosPagoOrden.map((m) => (
              <button
                key={m.value}
                onClick={() => { setMetodo(m.value); setValorEfectivo(0); setMedioOrden(""); }}
                className={cx(
                  "rounded-xl border px-3 py-2.5 text-sm font-bold transition",
                  metodo === m.value
                    ? "border-raspberry bg-raspberry text-white"
                    : "border-sand bg-white text-cocoa hover:border-raspberry"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Sub-panel Mixto */}
          {metodo === "mixto" && (
            <div className="mt-4 space-y-3 rounded-xl border border-raspberry/20 bg-raspberry-light/20 p-3">
              <Input
                label="Valor en efectivo (COP)"
                type="number"
                value={valorEfectivo || ""}
                onChange={(e) => {
                  const v = Math.min(Number(e.target.value) || 0, total);
                  setValorEfectivo(v);
                }}
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
                        onClick={() => setMedioOrden(m.value)}
                        className={cx(
                          "rounded-xl border px-3 py-2 text-sm font-bold transition",
                          medioOrden === m.value
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
        </Card>

        <Card className="p-5">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-cocoa/70"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
            {esDomicilioTipo && valorDomicilio > 0 && (
              <div className="flex justify-between text-cocoa/70"><span>Domicilio</span><span>{formatCOP(valorDomicilio)}</span></div>
            )}
            <div className="flex justify-between border-t border-sand pt-2 text-lg font-black text-cocoa">
              <span>Total</span><span>{formatCOP(total)}</span>
            </div>
            {metodo === "mixto" && total > 0 && (
              <div className="mt-2 space-y-1 rounded-xl bg-sand/50 px-3 py-2 text-xs text-cocoa/70">
                <div className="flex justify-between"><span>Efectivo</span><span>{formatCOP(valorEfectivo)}</span></div>
                <div className="flex justify-between"><span>Transferencia</span><span>{formatCOP(valorTransferencia)}</span></div>
              </div>
            )}
          </div>
          <Button className="mt-4 w-full" size="lg" disabled={!puedeRegistrar || guardando} onClick={registrar}>
            {guardando ? "Guardando…" : "Registrar factura"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-pistachio/30 px-4 py-3 font-bold text-cocoa animate-fade-up">
      <Check size={18} /> Factura registrada correctamente.
    </div>
  );
}

function ErrorBanner({ mensaje }: { mensaje: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700 animate-fade-up">
      <CircleAlert size={18} /> No se pudo guardar: {mensaje}
    </div>
  );
}
