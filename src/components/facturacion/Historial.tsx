"use client";
import { useMemo, useState } from "react";
import { Search, Eye, Pencil, Trash2, Armchair, Bike, Mail, Gift, CalendarClock, CalendarDays } from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { normalize, formatCOP, formatHora12, cx } from "@/lib/utils";
import { folio, labelMetodo } from "@/lib/factura";
import { esDeHoy } from "@/lib/reportes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { Empty } from "@/components/ui/Empty";
import { CompartirFactura } from "./CompartirFactura";
import { EditarFacturaInteligente } from "./EditarFacturaInteligente";
import { Factura, TipoFactura } from "@/types";

const TABS: { tipo: TipoFactura; label: string; icon: React.ReactNode }[] = [
  { tipo: "mesa", label: "Mesas", icon: <Armchair size={14} /> },
  { tipo: "domicilio", label: "Domicilios", icon: <Bike size={14} /> },
  { tipo: "regalo", label: "Regalos", icon: <Gift size={14} /> },
  { tipo: "favor", label: "Favores", icon: <Mail size={14} /> },
  { tipo: "reserva-domicilio", label: "Res. Domicilio", icon: <CalendarClock size={14} /> },
  { tipo: "reserva-mesa", label: "Res. Mesa", icon: <CalendarClock size={14} /> },
  { tipo: "reserva-regalo", label: "Res. Regalo", icon: <CalendarClock size={14} /> },
];

function nombreFactura(f: Factura): string {
  if (f.tipo === "mesa" || f.tipo === "reserva-mesa") return f.mesaNombre ?? "";
  if (f.tipo === "favor") return f.nombreFavor ?? "";
  return f.clienteNombre ?? "";
}

export function Historial() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas.filter((f) => f.localId === localId));
  const removeFactura = useData((s) => s.removeFactura);

  const [tab, setTab] = useState<TipoFactura>("mesa");
  const [q, setQ] = useState("");
  // Por defecto el historial solo muestra las facturas de hoy; el toggle
  // permite ver el histórico completo del local cuando se necesite buscar algo más viejo.
  const [soloHoy, setSoloHoy] = useState(true);
  const [ver, setVer] = useState<Factura | null>(null);
  const [editar, setEditar] = useState<Factura | null>(null);
  const [eliminar, setEliminar] = useState<Factura | null>(null);

  const lista = useMemo(() => {
    const base = facturas
      .filter((f) => f.tipo === tab && (!soloHoy || esDeHoy(f.creadoEn)))
      .sort((a, b) => +new Date(b.creadoEn) - +new Date(a.creadoEn));
    if (!q) return base;
    const nq = normalize(q);
    return base.filter((f) =>
      normalize(folio(f)).includes(nq) ||
      normalize(nombreFactura(f)).includes(nq) ||
      normalize(f.barrio || "").includes(nq)
    );
  }, [facturas, tab, q, soloHoy]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.tipo}
              onClick={() => setTab(t.tipo)}
              className={cx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
                tab === t.tipo
                  ? "bg-raspberry text-white"
                  : "bg-sand text-cocoa/70 hover:bg-raspberry-light"
              )}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoloHoy((v) => !v)}
            className={cx(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
              soloHoy ? "bg-raspberry text-white" : "bg-sand text-cocoa/70 hover:bg-raspberry-light"
            )}
          >
            <CalendarDays size={14} /> {soloHoy ? "Hoy" : "Todo el historial"}
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="rounded-full border border-sand bg-white py-2 pl-9 pr-4 text-sm focus:border-raspberry focus:outline-none"
            />
          </div>
        </div>
      </div>

      {lista.length === 0 ? (
        <Empty
          title={soloHoy ? "No hay facturas registradas hoy." : "Sin facturas"}
          hint={soloHoy ? "Toca \"Hoy\" arriba para ver el historial completo." : "Las facturas registradas aparecerán aquí."}
        />
      ) : (
        <div className="grid gap-3">
          {lista.map((f) => (
            <Card key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold text-cocoa">
                  {folio(f)} · {nombreFactura(f)}
                </p>
                <p className="text-xs text-cocoa/60">
                  {formatHora12(f.creadoEn)} · {labelMetodo(f.metodoPago)} · {f.items.length} ítem(s)
                </p>
                {f.fechaProgramada && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-raspberry-light px-2 py-0.5 text-xs font-bold text-raspberry-dark">
                    <CalendarClock size={12} />
                    Reserva para {f.fechaProgramada}{f.horaReserva ? ` · ${f.horaReserva}` : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-cocoa">{formatCOP(f.total)}</span>
                <Button size="sm" variant="secondary" onClick={() => setVer(f)}>
                  <Eye size={14} /> Ver
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditar(f)}>
                  <Pencil size={14} /> Editar
                </Button>
                {/* TODO: restringir a roles admin/supervisor cuando se implemente sistema de permisos */}
                <Button size="sm" variant="danger" onClick={() => setEliminar(f)}>
                  <Trash2 size={14} /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!ver} onClose={() => setVer(null)} title="Factura electrónica">
        {ver && <CompartirFactura factura={ver} />}
      </Modal>

      {editar && (
        <EditarFacturaInteligente
          factura={editar}
          onClose={() => setEditar(null)}
        />
      )}

      <Confirm
        open={!!eliminar}
        onClose={() => setEliminar(null)}
        onConfirm={() => { if (eliminar) removeFactura(eliminar.id); }}
        title="Eliminar factura"
        message={`¿Estás seguro de que deseas eliminar la factura ${eliminar ? folio(eliminar) : ""}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
