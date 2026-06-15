"use client";
import { useMemo, useState } from "react";
import {
  Bike, Wallet, ArrowRight, Banknote, Smartphone, Receipt, Plus, Trash2,
} from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { formatCOP, cx } from "@/lib/utils";
import { labelMetodo, metodosPago } from "@/lib/factura";
import {
  facturasDelDia, efectivoAEntregar, cajaTotal, cajaEfectivoVsTransferencia,
  gastosDelDia, totalGastos, totalGastosEfectivo,
} from "@/lib/reportes";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Confirm } from "@/components/ui/Confirm";
import { Factura, Gasto, MetodoPago } from "@/types";

export function CajeroBoard() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas);
  const gastos = useData((s) => s.gastos);
  const addGasto = useData((s) => s.addGasto);
  const removeGasto = useData((s) => s.removeGasto);
  const domiciliarios = useData((s) => s.domiciliarios.filter((d) => d.localId === localId));
  const [perfil, setPerfil] = useState<string | null>(null);

  const delDia = useMemo(() => facturasDelDia(facturas, localId), [facturas, localId]);
  const gastosHoy = useMemo(() => gastosDelDia(gastos, localId), [gastos, localId]);

  const total = cajaTotal(delDia);
  const { efectivo, transferencia, porMetodoTransferencia } = cajaEfectivoVsTransferencia(delDia);
  const gastosTotal = totalGastos(gastosHoy);
  const gastosEfectivo = totalGastosEfectivo(gastosHoy);
  const efectivoNeto = efectivo - gastosEfectivo;

  // Domiciliarios con actividad del día (al menos una factura asignada hoy)
  const conActividad = domiciliarios.filter((d) =>
    delDia.some((f) => f.domiciliarioId === d.id)
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-display text-2xl font-semibold text-cocoa">Caja del día</h2>
        <p className="mb-5 text-sm text-cocoa/60">Resumen de ingresos de hoy.</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ResumenCard icon={<Wallet size={18} />} label="Caja total" value={formatCOP(total)} tone="cocoa" />
          <ResumenCard icon={<Banknote size={18} />} label="Efectivo" value={formatCOP(efectivo)} tone="pistachio" />
          <ResumenCard icon={<Smartphone size={18} />} label="Transferencias" value={formatCOP(transferencia)} tone="mint" />
        </div>

        {Object.keys(porMetodoTransferencia).length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.entries(porMetodoTransferencia) as [MetodoPago, number][]).map(([m, v]) => (
              <div key={m} className="rounded-xl border border-sand bg-white px-3 py-2">
                <p className="text-xs text-cocoa/60">{labelMetodo(m)}</p>
                <p className="font-bold text-cocoa">{formatCOP(v)}</p>
              </div>
            ))}
          </div>
        )}

        {gastosEfectivo > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-cocoa px-5 py-4 text-white">
            <span className="flex items-center gap-2 font-bold"><Banknote size={18} /> Efectivo neto en caja</span>
            <span className="font-display text-2xl font-black">{formatCOP(efectivoNeto)}</span>
          </div>
        )}
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
              const entregar = efectivoAEntregar(suyas);
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
                      <p className="text-xs text-cocoa/60">{suyas.length} factura(s)</p>
                    </div>
                    <ArrowRight size={18} className="text-cocoa/40" />
                  </button>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-pistachio/20 px-4 py-3">
                    <span className="text-sm font-bold text-cocoa/70">Efectivo a entregar</span>
                    <span className="font-display text-lg font-black text-cocoa">{formatCOP(entregar)}</span>
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
    </div>
  );
}

function ResumenCard({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "cocoa" | "pistachio" | "mint";
}) {
  const tones: Record<typeof tone, string> = {
    cocoa: "border-cocoa bg-cocoa text-white",
    pistachio: "border-pistachio/40 bg-pistachio/20 text-cocoa",
    mint: "border-mint/40 bg-mint/20 text-cocoa",
  };
  return (
    <div className={cx("rounded-xl2 border p-4", tones[tone])}>
      <p className={cx(
        "flex items-center gap-2 text-xs font-bold uppercase tracking-wide",
        tone === "cocoa" ? "text-white/70" : "text-cocoa/50"
      )}>
        {icon} {label}
      </p>
      <p className="mt-1 font-display text-2xl font-black">{value}</p>
    </div>
  );
}

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
    setDescripcion("");
    setValor("");
    setMedioPago("efectivo");
  };

  return (
    <section>
      <h2 className="mb-1 font-display text-2xl font-semibold text-cocoa">Gastos empresariales del día</h2>
      <p className="mb-5 text-sm text-cocoa/60">Registra los gastos en los que incurre el local hoy.</p>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Descripción"
              placeholder="Ej. Compra de hielo"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="sm:w-40">
            <Input
              label="Valor"
              type="number"
              placeholder="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
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
                      aria-label="Eliminar gasto"
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

function DetalleCajero({
  facturas, nombre, onClose,
}: {
  facturas: Factura[];
  nombre: string;
  onClose: () => void;
}) {
  const entregar = efectivoAEntregar(facturas);
  return (
    <Modal open onClose={onClose} title={`Cuadre · ${nombre}`}>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-sand">
          <table className="w-full text-sm">
            <thead className="bg-sand/60 text-left text-cocoa/70">
              <tr>
                <th className="px-3 py-2 font-bold">Factura</th>
                <th className="px-3 py-2 font-bold">Pago</th>
                <th className="px-3 py-2 font-bold text-right">Productos</th>
                <th className="px-3 py-2 font-bold text-right">Domicilio</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="border-t border-sand">
                  <td className="px-3 py-2 text-cocoa">{f.clienteNombre}</td>
                  <td className="px-3 py-2">
                    <span className={cx(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      f.metodoPago === "efectivo" ? "bg-pistachio/30 text-cocoa" : "bg-mint/20 text-cocoa"
                    )}>
                      {labelMetodo(f.metodoPago)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-cocoa">{formatCOP(f.subtotal)}</td>
                  <td className="px-3 py-2 text-right text-cocoa/70">{formatCOP(f.valorDomicilio || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-cocoa/50">
          Efectivo: se suma solo el valor de productos. Transferencia: se resta el valor del domicilio.
        </p>
        <div className="flex items-center justify-between rounded-xl bg-cocoa px-5 py-4 text-white">
          <span className="flex items-center gap-2 font-bold"><Wallet size={18} /> Efectivo a entregar</span>
          <span className="font-display text-2xl font-black">{formatCOP(entregar)}</span>
        </div>
      </div>
    </Modal>
  );
}
