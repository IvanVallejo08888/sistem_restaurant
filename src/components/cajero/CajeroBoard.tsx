"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Bike, Wallet, ArrowRight, ArrowLeftRight, Banknote, Receipt, Plus, Trash2,
  ChevronDown, TrendingUp, IceCream, Utensils, Package, LayoutGrid,
} from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { formatCOP, cx } from "@/lib/utils";
import { labelMetodo, labelMetodoFactura, metodosPago } from "@/lib/factura";
import {
  facturasDelDia, gastosDelDia,
  cajaTotalProductos, resumenMetodosVacio,
  utilidadDelDia,
  cajaMesasPorMetodo, cajaPorCategoria,
  totalGastos, totalGastosEfectivo,
  cuadreDomiciliario, ResumenMetodos,
} from "@/lib/reportes";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Confirm } from "@/components/ui/Confirm";
import { ReporteDelDiaButton } from "@/components/reportes/ReporteDelDiaButton";
import { Factura, Gasto, MetodoPago } from "@/types";

// ── Componente expandible reutilizable ────────────────────────────────────────
type ExpandCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  /** Clases de color para el contenedor (bg + border + text) */
  colorClass: string;
  children?: React.ReactNode;
};

function ExpandCard({ icon, label, value, colorClass, children }: ExpandCardProps) {
  const [open, setOpen] = useState(false);
  const hasContent = !!children;
  return (
    <div className={cx("overflow-hidden rounded-xl2 border transition-shadow", colorClass)}>
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left"
        onClick={() => hasContent && setOpen((o) => !o)}
        style={{ cursor: hasContent ? "pointer" : "default" }}
      >
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide opacity-70">
          {icon} {label}
        </p>
        <div className="flex items-center gap-2">
          <p className="font-display text-2xl font-black">{value}</p>
          {hasContent && (
            <ChevronDown
              size={16}
              className={cx("opacity-60 transition-transform duration-200", open && "rotate-180")}
            />
          )}
        </div>
      </button>
      {open && (
        <div className="border-t border-current/10 px-4 pb-4 pt-3 animate-fade-up">
          {children}
        </div>
      )}
    </div>
  );
}

// Fila de desglose dentro de un ExpandCard
function Fila({
  label, value, signo,
}: {
  label: string;
  value: number;
  signo?: "positivo" | "negativo" | "auto";
}) {
  const efectivo = signo === "auto" ? value >= 0 : signo === "positivo";
  const prefijo = signo ? (value >= 0 ? "+" : "−") : "";
  const colorCls = signo
    ? value >= 0 ? "text-emerald-600 font-bold" : "text-red-500 font-bold"
    : "font-semibold text-current";
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="opacity-70">{label}</span>
      <span className={colorCls}>
        {prefijo}{formatCOP(Math.abs(value))}
      </span>
    </div>
  );
}

const LABELS_METODO_ES: Record<keyof ResumenMetodos, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi",
  bancolombia: "Bancolombia",
  daviplata: "Daviplata",
  datafono: "Datáfono",
};

function DesgloseMétodos({ resumen, signo }: {
  resumen: ResumenMetodos;
  signo?: "positivo" | "negativo" | "auto";
}) {
  return (
    <div className="divide-y divide-current/10">
      {(Object.keys(LABELS_METODO_ES) as (keyof ResumenMetodos)[]).map((k) => (
        resumen[k] !== 0 && (
          <Fila key={k} label={LABELS_METODO_ES[k]} value={resumen[k]} signo={signo} />
        )
      ))}
    </div>
  );
}

// Card del saldo final de un domiciliario: positivo = debe entregar efectivo,
// negativo = la empresa le debe a él (los descuentos superaron lo cobrado), cero = sin transferencia.
// Exportado para reutilizarse tal cual en ReporteDelDia (debe mostrar
// exactamente el mismo saldo que "Cuadre por domiciliario" aquí abajo).
export function SaldoDomiciliarioCard({ saldo, size = "sm" }: { saldo: number; size?: "sm" | "lg" }) {
  const padding = size === "lg" ? "px-5 py-4" : "px-4 py-3";
  const valueCls = size === "lg" ? "text-2xl" : "text-lg";

  if (saldo > 0) {
    return (
      <div className={cx("flex items-center justify-between rounded-xl bg-cocoa text-white", padding)}>
        <span className="flex items-center gap-2 text-sm font-bold text-white/80">
          {size === "lg" && <Wallet size={18} />} Efectivo a entregar
        </span>
        <span className={cx("font-display font-black", valueCls)}>{formatCOP(saldo)}</span>
      </div>
    );
  }
  if (saldo < 0) {
    return (
      <div
        className={cx("flex items-center justify-between rounded-xl border border-red-300 bg-red-50", padding)}
        title="Los descuentos (envíos y favores) superaron el efectivo recibido por el domiciliario."
      >
        <span className="flex items-center gap-2 text-sm font-bold text-red-700">
          <ArrowLeftRight size={size === "lg" ? 18 : 14} /> A pagar al domiciliario
        </span>
        <span className={cx("font-display font-black text-red-700", valueCls)}>−{formatCOP(Math.abs(saldo))}</span>
      </div>
    );
  }
  return (
    <div className={cx("flex items-center justify-between rounded-xl border border-sand bg-sand/40", padding)}>
      <span className="text-sm font-bold text-cocoa/70">Saldo en cero</span>
      <span className={cx("font-display font-black text-cocoa/70", valueCls)}>{formatCOP(0)}</span>
    </div>
  );
}

// ── Board principal ───────────────────────────────────────────────────────────
export function CajeroBoard() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas);
  const gastos = useData((s) => s.gastos);
  const productos = useData((s) => s.productos);
  const addGasto = useData((s) => s.addGasto);
  const removeGasto = useData((s) => s.removeGasto);
  const domiciliarios = useData((s) => s.domiciliarios.filter((d) => d.localId === localId));
  const [perfil, setPerfil] = useState<string | null>(null);

  const delDia = useMemo(() => facturasDelDia(facturas, localId), [facturas, localId]);
  const gastosHoy = useMemo(() => gastosDelDia(gastos, localId), [gastos, localId]);

  // ── Resúmenes de caja ───────────────────────────────────────────────────────
  // Caja total: solo productos facturados (sin domicilio, sin Favores).
  const cajaProductos = useMemo(() => cajaTotalProductos(delDia), [delDia]);
  const totalCaja = cajaProductos.total;
  const gastosTotal = totalGastos(gastosHoy);
  const gastosEfectivo = totalGastosEfectivo(gastosHoy);

  const { utilidad, porMetodo: utilidadPorMetodo } = useMemo(
    () => utilidadDelDia(delDia, gastosHoy),
    [delDia, gastosHoy]
  );

  const mesasStats = useMemo(() => cajaMesasPorMetodo(delDia), [delDia]);

  const catStats = useMemo(
    () => cajaPorCategoria(delDia, productos),
    [delDia, productos]
  );

  // Domiciliarios con actividad del día
  const conActividad = domiciliarios.filter((d) => delDia.some((f) => f.domiciliarioId === d.id));
  // Total de facturas del día por domiciliario (incluye "Sin asignar"); usado
  // por la tarjeta "Total facturas". Ordenado de mayor a menor.
  const facturasPorDomiciliario = useMemo(() => {
    const acc = new Map<string, number>();
    delDia.forEach((f) => {
      const nombre = f.domiciliarioId
        ? domiciliarios.find((d) => d.id === f.domiciliarioId)?.nombreCompleto ?? "Domiciliario"
        : "Sin asignar";
      acc.set(nombre, (acc.get(nombre) ?? 0) + 1);
    });
    return [...acc.entries()].sort(([, a], [, b]) => b - a);
  }, [delDia, domiciliarios]);

  // ── Efectivo neto en caja: base de caja + efectivo de mesas + cuadres de domiciliarios ──
  const [baseCaja, setBaseCaja] = useState(0);
  const [editandoBase, setEditandoBase] = useState(false);
  // Clave por fecha en hora de Bogotá (no UTC), para que la base de caja no
  // cambie de "día" varias horas antes de la medianoche real del local.
  const claveBaseCaja = `base-caja-${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date())}`;
  useEffect(() => {
    const guardada = localStorage.getItem(claveBaseCaja);
    if (guardada) setBaseCaja(Math.round(Number(guardada) || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const guardarBaseCaja = (valor: number) => {
    const v = Math.round(valor || 0);
    setBaseCaja(v);
    localStorage.setItem(claveBaseCaja, String(v));
  };
  const domiciliariosCuadreTotal = conActividad.reduce(
    (acc, d) => acc + cuadreDomiciliario(delDia.filter((f) => f.domiciliarioId === d.id)).efectivoAEntregar,
    0
  );
  const efectivoNeto = baseCaja + mesasStats.efectivo + domiciliariosCuadreTotal;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-2xl font-semibold text-cocoa">Caja del día</h2>
        <p className="mb-5 text-sm text-cocoa/60">Resumen de ingresos de hoy.</p>

        {/* Caja total — expandible: efectivo + transferencias (solo productos, sin domicilio ni favores) */}
        <ExpandCard
          icon={<Wallet size={14} />}
          label="Caja total"
          value={formatCOP(totalCaja)}
          colorClass="border-cocoa bg-cocoa text-white"
        >
          <p className="mb-2 text-xs font-semibold opacity-60">Solo productos facturados (sin domicilio ni Favores)</p>
          <DesgloseMétodos resumen={cajaProductos} />
        </ExpandCard>

        {/* Efectivo neto en caja — base de caja + efectivo de mesas + cuadres de domiciliarios */}
        <button
          type="button"
          onClick={() => setEditandoBase(true)}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-raspberry/30 bg-raspberry-light/40 px-5 py-4 text-left transition hover:bg-raspberry-light/60"
        >
          <span className="flex items-center gap-2 font-bold text-raspberry-dark">
            <Banknote size={18} /> Efectivo neto en caja
          </span>
          <span className="font-display text-2xl font-black text-raspberry-dark">{formatCOP(efectivoNeto)}</span>
        </button>

        <Modal
          open={editandoBase}
          onClose={() => setEditandoBase(false)}
          title="Base de caja del día"
          footer={
            <Button onClick={() => setEditandoBase(false)}>Guardar</Button>
          }
        >
          <p className="mb-3 text-sm text-cocoa/60">
            Dinero inicial en caja al abrir el día. Se suma al efectivo de mesas y a los cuadres
            de domiciliarios para calcular el efectivo neto en caja.
          </p>
          <Input
            label="Base de caja (COP)"
            type="number"
            value={baseCaja || ""}
            onChange={(e) => guardarBaseCaja(Number(e.target.value) || 0)}
          />
        </Modal>

        {/* Fila de botones de detalle: Utilidad + 5 nuevos */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Utilidad del día — rosado */}
          <ExpandCard
            icon={<TrendingUp size={14} />}
            label="Utilidad del día"
            value={formatCOP(utilidad)}
            colorClass={cx(
              "border-raspberry/30 bg-raspberry-light/40 text-cocoa",
            )}
          >
            <p className="mb-2 text-xs font-semibold opacity-60">Ingresos − gastos empresariales</p>
            <DesgloseMétodos resumen={utilidadPorMetodo} signo="auto" />
            <p className="mt-2 border-t border-current/10 pt-2 text-xs opacity-60">
              El costo de los favores ya se incluye aquí como gasto empresarial (ver &ldquo;Gastos empresariales del día&rdquo;).
            </p>
          </ExpandCard>

          {/* Heladería — azul cielo */}
          <ExpandCard
            icon={<IceCream size={14} />}
            label="Heladería"
            value={formatCOP(catStats.heladeria.total)}
            colorClass="border-sky-200 bg-sky-50 text-sky-900"
          >
            <DesgloseMétodos resumen={catStats.heladeria} />
          </ExpandCard>

          {/* Comidas Rápidas — naranja */}
          <ExpandCard
            icon={<Utensils size={14} />}
            label="Comidas Rápidas"
            value={formatCOP(catStats.comidas.total)}
            colorClass="border-orange-200 bg-orange-50 text-orange-900"
          >
            <DesgloseMétodos resumen={catStats.comidas} />
          </ExpandCard>

          {/* Total facturas — lima/oliva */}
          <ExpandCard
            icon={<Package size={14} />}
            label="Total facturas"
            value={String(delDia.length)}
            colorClass="border-lime-200 bg-lime-50 text-lime-900"
          >
            <div className="divide-y divide-lime-200">
              {facturasPorDomiciliario.map(([nombre, cantidad]) => (
                <div key={nombre} className="flex items-center justify-between py-1 text-sm">
                  <span className="opacity-70">{nombre}</span>
                  <span className="font-semibold">{cantidad}</span>
                </div>
              ))}
            </div>
          </ExpandCard>

          {/* Mesas — lavanda */}
          <ExpandCard
            icon={<LayoutGrid size={14} />}
            label="Mesas"
            value={formatCOP(mesasStats.total)}
            colorClass="border-violet-200 bg-violet-50 text-violet-900"
          >
            <DesgloseMétodos resumen={mesasStats} />
          </ExpandCard>
        </div>
      </section>

      <GastosDelDia
        localId={localId}
        gastos={gastosHoy}
        total={gastosTotal}
        onAdd={addGasto}
        onRemove={removeGasto}
      />

      <section>
        <h2 className="mb-1 font-display text-2xl font-semibold text-cocoa">Cuadre por domiciliario</h2>
        <p className="mb-5 text-sm text-cocoa/60">Actividad del día de hoy.</p>

        {conActividad.length === 0 ? (
          <Empty icon={<Bike size={40} />} title="Sin actividad hoy" hint="Los domiciliarios con pedidos del día aparecerán aquí." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {conActividad.map((d) => {
              const suyas = delDia.filter((f) => f.domiciliarioId === d.id);
              const cuadre = cuadreDomiciliario(suyas);
              return (
                <Card key={d.id} className="p-5">
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => setPerfil(d.id)}>
                    <div className="h-12 w-12 overflow-hidden rounded-2xl bg-sand">
                      {d.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.fotoUrl} alt={d.nombreCompleto} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-cocoa/30"><Bike size={20} /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-cocoa">{d.nombreCompleto}</p>
                      <p className="text-xs text-cocoa/60">{cuadre.totalDomicilios} factura(s)</p>
                    </div>
                    <ArrowRight size={18} className="text-cocoa/40" />
                  </button>
                  <div className="mt-4">
                    <SaldoDomiciliarioCard saldo={cuadre.efectivoAEntregar} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {perfil && (
        <DetalleCajero
          facturas={delDia.filter((f) => f.domiciliarioId === perfil)}
          nombre={domiciliarios.find((d) => d.id === perfil)?.nombreCompleto || ""}
          onClose={() => setPerfil(null)}
        />
      )}

      <div className="flex justify-center">
        <ReporteDelDiaButton localId={localId} />
      </div>
    </div>
  );
}

// ── Gastos empresariales ──────────────────────────────────────────────────────
function GastosDelDia({
  localId, gastos, total, onAdd, onRemove,
}: {
  localId: string;
  gastos: Gasto[];
  total: number;
  onAdd: (d: Omit<Gasto, "id" | "creadoEn">) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [valor, setValor] = useState("");
  const [medioPago, setMedioPago] = useState<MetodoPago>("efectivo");
  const [borrar, setBorrar] = useState<Gasto | null>(null);

  const handleAdd = async () => {
    const monto = Number(valor);
    if (!descripcion.trim() || !monto) return;
    await onAdd({ localId, descripcion: descripcion.trim(), valor: monto, medioPago });
    setDescripcion(""); setValor(""); setMedioPago("efectivo");
  };

  return (
    <section>
      <h2 className="mb-1 font-display text-2xl font-semibold text-cocoa">Gastos empresariales del día</h2>
      <p className="mb-5 text-sm text-cocoa/60">Registra los gastos en los que incurre el local hoy.</p>
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input label="Descripción" placeholder="Ej. Compra de hielo" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="sm:w-40">
            <Input label="Valor" type="number" placeholder="0" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="sm:w-44">
            <label className="mb-1 block text-sm font-bold text-cocoa/80">Pagado con</label>
            <select
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value as MetodoPago)}
              className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-cocoa transition focus:border-raspberry focus:outline-none"
            >
              {metodosPago.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd} disabled={!descripcion.trim() || !valor}>
            <Plus size={18} /> Agregar
          </Button>
        </div>

        <div className="mt-4">
          {gastos.length === 0 ? (
            <p className="text-sm text-cocoa/50">Sin gastos registrados hoy.</p>
          ) : (
            <div className="space-y-2">
              {gastos.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl bg-sand/40 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-cocoa">
                    <Receipt size={16} className="text-raspberry" /> {g.descripcion}
                    <span className={cx(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      g.medioPago === "efectivo" ? "bg-pistachio/30 text-cocoa" : "bg-mint/20 text-cocoa"
                    )}>
                      {labelMetodo(g.medioPago)}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cocoa">{formatCOP(g.valor)}</span>
                    <button
                      onClick={() => setBorrar(g)}
                      className="rounded-full p-1.5 text-cocoa/40 hover:bg-raspberry-light hover:text-raspberry-dark"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-cocoa px-5 py-4 text-white">
          <span className="flex items-center gap-2 font-bold"><Receipt size={18} /> Total gastos del día</span>
          <span className="font-display text-2xl font-black">{formatCOP(total)}</span>
        </div>
      </Card>

      <Confirm
        open={!!borrar}
        onClose={() => setBorrar(null)}
        onConfirm={() => borrar && onRemove(borrar.id)}
        title="Eliminar gasto"
        message={`¿Eliminar el gasto "${borrar?.descripcion}"?`}
        confirmLabel="Eliminar"
      />
    </section>
  );
}

// ── Detalle de cajero por domiciliario ────────────────────────────────────────
function DetalleCajero({ facturas, nombre, onClose }: {
  facturas: Factura[];
  nombre: string;
  onClose: () => void;
}) {
  const cuadre = cuadreDomiciliario(facturas);
  return (
    <Modal open onClose={onClose} title={`Cuadre · ${nombre}`}>
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-xl border border-sand" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-sand/60 text-left text-cocoa/70">
              <tr>
                <th className="px-3 py-2 font-bold">Factura</th>
                <th className="px-3 py-2 font-bold">Pago</th>
                <th className="px-3 py-2 font-bold text-right">Productos</th>
                <th className="px-3 py-2 font-bold text-right">Domicilio</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => {
                const costoDomicilio = f.valorDomicilio ?? 0;
                return (
                  <tr key={f.id} className="border-t border-sand">
                    <td className="px-3 py-2 text-cocoa">
                      {f.tipo === "favor" ? "FAVOR" : f.clienteNombre ?? "—"}
                      <br />
                      <span className="text-xs text-cocoa/50">{f.barrio ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cx(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        f.metodoPago === "efectivo" ? "bg-pistachio/30 text-cocoa" : "bg-mint/20 text-cocoa"
                      )}>
                        {labelMetodoFactura(f)}
                      </span>
                      {f.metodoPago === "mixto" && (
                        <p className="mt-0.5 text-[11px] text-cocoa/50">
                          Efectivo {formatCOP(f.valorEfectivo ?? 0)} · Transf. {formatCOP(f.valorTransferencia ?? 0)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-cocoa">{formatCOP(f.subtotal)}</td>
                    <td className="px-3 py-2 text-right text-cocoa/70">{formatCOP(costoDomicilio)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-cocoa/50">
          Efectivo: suma solo productos. Transferencia: resta el domicilio. Mixto: el efectivo
          recibido cubre primero el costo del domicilio.
        </p>

        <SaldoDomiciliarioCard saldo={cuadre.efectivoAEntregar} size="lg" />
      </div>
    </Modal>
  );
}
