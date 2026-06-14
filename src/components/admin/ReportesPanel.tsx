"use client";
import { useMemo, useState } from "react";
import {
  ChevronDown, ChevronUp, TrendingUp, MapPin, Phone, Package, Wallet, Armchair, Bike,
} from "lucide-react";
import { useData } from "@/store/dataStore";
import { formatCOP, cx } from "@/lib/utils";
import { labelMetodo } from "@/lib/factura";
import {
  facturasDelDia, cajaPorMetodo, cajaTotal, utilidadDia,
  rankingBarrios, rankingClientes, rankingProductos,
  ingresosMesasPorMetodo, ingresosPorDomiciliario,
} from "@/lib/reportes";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { BarChart } from "@/components/ui/BarChart";
import { MetodoPago } from "@/types";

export function ReportesPanel() {
  const locales = useData((s) => s.locales);
  const [abierto, setAbierto] = useState<string | null>(null);

  if (locales.length === 0) {
    return <Empty icon={<TrendingUp size={40} />} title="Sin locales" hint="Crea un local para ver sus reportes." />;
  }

  return (
    <div>
      <h2 className="mb-5 font-display text-2xl font-semibold text-cocoa">Reportes y estadísticas</h2>
      <div className="space-y-3">
        {locales.map((l) => (
          <Card key={l.id} className="overflow-hidden">
            <button
              onClick={() => setAbierto(abierto === l.id ? null : l.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="font-display text-lg font-semibold text-cocoa">{l.nombre}</p>
                <p className="text-xs text-cocoa/60">{l.direccion}</p>
              </div>
              {abierto === l.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {abierto === l.id && <ReporteLocal localId={l.id} />}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReporteLocal({ localId }: { localId: string }) {
  const facturas = useData((s) => s.facturas);
  const domiciliarios = useData((s) => s.domiciliarios.filter((d) => d.localId === localId));
  const [gastos, setGastos] = useState(0);
  const [cajaAbierta, setCajaAbierta] = useState(false);

  const delDia = useMemo(() => facturasDelDia(facturas, localId), [facturas, localId]);

  const total = cajaTotal(delDia);
  const utilidad = utilidadDia(delDia, gastos);
  const porMetodo = cajaPorMetodo(delDia);
  const barrios = rankingBarrios(delDia).slice(0, 6);
  const clientes = rankingClientes(delDia).slice(0, 6);
  const productos = rankingProductos(delDia);
  const masVendidos = productos.slice(0, 5);
  const menosVendidos = [...productos].reverse().slice(0, 5);
  const mesasMetodo = ingresosMesasPorMetodo(delDia);

  return (
    <div className="space-y-6 border-t border-sand bg-vanilla px-5 py-5">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ResumenCard label="Caja del día" value={formatCOP(total)} tone="raspberry" />
        <ResumenCard label="Utilidad del día" value={formatCOP(utilidad)} tone="pistachio" />
        <div className="rounded-xl2 border border-sand bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">Gastos del día</p>
          <input
            type="number"
            value={gastos || ""}
            onChange={(e) => setGastos(Number(e.target.value) || 0)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-sand bg-vanilla px-3 py-1.5 font-display text-lg font-black text-cocoa focus:border-raspberry focus:outline-none"
          />
        </div>
      </div>

      {/* Caja del día desplegable por método */}
      <div className="rounded-xl2 border border-sand bg-white">
        <button
          onClick={() => setCajaAbierta((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 font-bold text-cocoa"><Wallet size={18} className="text-raspberry" /> Caja del día por método</span>
          {cajaAbierta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {cajaAbierta && (
          <div className="border-t border-sand px-4 py-3">
            {Object.keys(porMetodo).length === 0 ? (
              <p className="text-sm text-cocoa/50">Sin movimientos hoy.</p>
            ) : (
              <div className="space-y-2">
                {(Object.entries(porMetodo) as [MetodoPago, number][]).map(([m, v]) => (
                  <div key={m} className="flex justify-between text-sm">
                    <span className="text-cocoa/70">{labelMetodo(m)}</span>
                    <span className="font-bold text-cocoa">{formatCOP(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mesas por método */}
      <Seccion icon={<Armchair size={16} />} titulo="Ingresos de mesas por método">
        {Object.keys(mesasMetodo).length === 0 ? (
          <p className="text-sm text-cocoa/50">Sin ventas de mesa hoy.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.entries(mesasMetodo) as [MetodoPago, number][]).map(([m, v]) => (
              <div key={m} className="rounded-xl bg-white p-3">
                <p className="text-xs text-cocoa/60">{labelMetodo(m)}</p>
                <p className="font-bold text-cocoa">{formatCOP(v)}</p>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      {/* Ingresos por domiciliario (sin domicilios) */}
      <Seccion icon={<Bike size={16} />} titulo="Ingresos por domiciliario">
        {domiciliarios.length === 0 ? (
          <p className="text-sm text-cocoa/50">Sin domiciliarios.</p>
        ) : (
          <div className="space-y-2">
            {domiciliarios.map((d) => {
              const ing = ingresosPorDomiciliario(delDia, d.id);
              if (ing.cantidad === 0) return null;
              return (
                <div key={d.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                  <span className="font-semibold text-cocoa">{d.nombreCompleto}</span>
                  <span className="flex gap-4 text-cocoa/70">
                    <span>Efectivo: <b className="text-cocoa">{formatCOP(ing.efectivo)}</b></span>
                    <span>Transf.: <b className="text-cocoa">{formatCOP(ing.transferencia)}</b></span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Seccion>

      {/* Rankings */}
      <Seccion icon={<MapPin size={16} />} titulo="Barrios con más pedidos">
        <BarChart data={barrios.map((b) => ({ label: b.nombre, value: b.total }))} />
      </Seccion>

      <Seccion icon={<Phone size={16} />} titulo="Clientes con más pedidos">
        <BarChart data={clientes.map((c) => ({ label: c.nombre, value: c.total }))} />
      </Seccion>

      <div className="grid gap-6 sm:grid-cols-2">
        <Seccion icon={<Package size={16} />} titulo="Más vendidos">
          <BarChart data={masVendidos.map((p) => ({ label: p.nombre, value: p.unidades }))} />
        </Seccion>
        <Seccion icon={<Package size={16} />} titulo="Menos vendidos">
          <BarChart data={menosVendidos.map((p) => ({ label: p.nombre, value: p.unidades }))} />
        </Seccion>
      </div>
    </div>
  );
}

function ResumenCard({ label, value, tone }: { label: string; value: string; tone: "raspberry" | "pistachio" }) {
  return (
    <div className={cx(
      "rounded-xl2 border p-4",
      tone === "raspberry" ? "border-raspberry-light bg-raspberry-light/30" : "border-pistachio/40 bg-pistachio/20"
    )}>
      <p className="text-xs font-bold uppercase tracking-wide text-cocoa/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-cocoa">{value}</p>
    </div>
  );
}

function Seccion({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 font-bold text-cocoa"><span className="text-raspberry">{icon}</span> {titulo}</p>
      <div className="rounded-xl2 bg-sand/40 p-4">{children}</div>
    </div>
  );
}
