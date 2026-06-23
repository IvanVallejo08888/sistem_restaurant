"use client";
import { useMemo, useState } from "react";
import { Search, Eye, Pencil, Trash2, Armchair, Bike, Mail, Gift, CalendarClock, CalendarDays, CircleAlert } from "lucide-react";
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
import { Factura, ModoFacturacion, TipoFactura } from "@/types";

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

// Línea de título de cada tarjeta del historial: varía según el tipo de
// factura. Mesa/Reserva Mesa no se mencionan en el cambio solicitado, así
// que mantienen el formato anterior (folio · nombre) a través del "default".
function tituloHistorial(f: Factura): string {
  switch (f.tipo) {
    case "domicilio":
    case "reserva-domicilio": {
      const partes = [f.barrio, f.clienteWhatsapp].filter(Boolean);
      return partes.length ? partes.join(" · ") : `${folio(f)} · ${nombreFactura(f)}`;
    }
    case "regalo":
    case "reserva-regalo": {
      const partes = [f.contactoQuienEnvia, f.barrio].filter(Boolean);
      return partes.length ? partes.join(" · ") : `${folio(f)} · ${nombreFactura(f)}`;
    }
    case "favor":
      return `FAVOR${f.nombreFavor ? ` · ${f.nombreFavor}` : ""}`;
    default:
      return `${folio(f)} · ${nombreFactura(f)}`;
  }
}

// Búsqueda en tiempo real: el dato contra el que se compara cambia según el
// tipo de factura. Mesa/Reserva Mesa conservan el criterio anterior
// (folio, nombre y barrio) a través del "default".
function coincideBusqueda(f: Factura, nq: string): boolean {
  switch (f.tipo) {
    case "domicilio":
    case "reserva-domicilio":
      return normalize(f.clienteWhatsapp ?? "").includes(nq);
    case "regalo":
    case "reserva-regalo":
      return normalize(f.contactoQuienEnvia ?? "").includes(nq);
    case "favor":
      return normalize(f.nombreFavor ?? "").includes(nq);
    default:
      return (
        normalize(folio(f)).includes(nq) ||
        normalize(nombreFactura(f)).includes(nq) ||
        normalize(f.barrio ?? "").includes(nq)
      );
  }
}

export function Historial({ modo }: { modo: ModoFacturacion }) {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas.filter((f) => f.localId === localId));
  const removeFactura = useData((s) => s.removeFactura);

  // Mesas y para llevar: solo la pestaña Mesas. Domicilios y más: todas menos Mesas.
  const tabsFiltradas = modo === "mesas" ? TABS.filter((t) => t.tipo === "mesa") : TABS.filter((t) => t.tipo !== "mesa");
  const [tab, setTab] = useState<TipoFactura>(modo === "mesas" ? "mesa" : "domicilio");
  const [q, setQ] = useState("");
  // Por defecto el historial solo muestra las facturas de hoy; el toggle
  // permite ver el histórico completo del local cuando se necesite buscar algo más viejo.
  const [soloHoy, setSoloHoy] = useState(true);
  const [ver, setVer] = useState<Factura | null>(null);
  const [editar, setEditar] = useState<Factura | null>(null);
  const [eliminar, setEliminar] = useState<Factura | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const confirmarEliminar = async () => {
    if (!eliminar) return;
    try {
      await removeFactura(eliminar.id);
    } catch (e) {
      setErrorEliminar(e instanceof Error ? e.message : "No se pudo eliminar la factura.");
    }
  };

  // Sin búsqueda: se respeta la pestaña activa (igual que antes).
  // Con búsqueda: se ignora la pestaña y se busca entre todos los tipos
  // visibles en este modo (Domicilios y más, o solo Mesas), usando el dato
  // correcto según el tipo de cada factura (ver coincideBusqueda).
  const lista = useMemo(() => {
    const tiposPermitidos = new Set(tabsFiltradas.map((t) => t.tipo));
    const candidatas = facturas.filter(
      (f) => tiposPermitidos.has(f.tipo) && (!soloHoy || esDeHoy(f.creadoEn))
    );
    const filtradas = q
      ? candidatas.filter((f) => coincideBusqueda(f, normalize(q)))
      : candidatas.filter((f) => f.tipo === tab);
    return filtradas.sort((a, b) => +new Date(b.creadoEn) - +new Date(a.creadoEn));
  }, [facturas, tab, q, soloHoy, tabsFiltradas]);

  return (
    <div>
      {errorEliminar && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700 animate-fade-up">
          <CircleAlert size={18} /> No se pudo eliminar: {errorEliminar}
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabsFiltradas.map((t) => (
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
                  {tituloHistorial(f)}
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
                <Button size="sm" variant="danger" onClick={() => { setEliminar(f); setErrorEliminar(null); }}>
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
        onConfirm={confirmarEliminar}
        title="Eliminar factura"
        message={`¿Estás seguro de que deseas eliminar la factura ${eliminar ? folio(eliminar) : ""}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
