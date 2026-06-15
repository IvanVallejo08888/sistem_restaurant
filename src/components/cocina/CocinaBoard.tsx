"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Armchair, Bike, Check, ChevronLeft, ChevronRight, Clock, Volume2, VolumeX } from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { formatHora12, horaMas, now, cx } from "@/lib/utils";
import { folio } from "@/lib/factura";
import { playDing } from "@/lib/sound";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Confirm } from "@/components/ui/Confirm";
import { Empty } from "@/components/ui/Empty";
import { Factura, TipoFactura } from "@/types";

export function CocinaBoard() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas);
  const updateFactura = useData((s) => s.updateFactura);

  const [sonido, setSonido] = useState(true);
  const [tab, setTab] = useState<TipoFactura>("domicilio");
  const [storyIdx, setStoryIdx] = useState<number | null>(null);
  const [confirmar, setConfirmar] = useState<Factura | null>(null);

  // Pendientes (no listas) del local actual.
  // Las reservas con fecha futura no aparecen hasta el día programado.
  const pendientes = useMemo(() => {
    const hoy = now().slice(0, 10);
    return facturas
      .filter((f) =>
        f.localId === localId &&
        f.estado === "pendiente" &&
        (!f.fechaProgramada || f.fechaProgramada <= hoy)
      )
      .sort((a, b) => +new Date(a.creadoEn) - +new Date(b.creadoEn));
  }, [facturas, localId]);

  const mesas = pendientes.filter((f) => f.tipo === "mesa");
  const domicilios = pendientes.filter((f) => f.tipo === "domicilio");
  const activos = tab === "mesa" ? mesas : domicilios;

  // Detecta nuevas facturas y reproduce sonido
  const conocidas = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(pendientes.map((f) => f.id));
    if (conocidas.current === null) {
      conocidas.current = ids; // primera carga: no sonar
      return;
    }
    let nueva = false;
    ids.forEach((id) => { if (!conocidas.current!.has(id)) nueva = true; });
    if (nueva && sonido) playDing();
    conocidas.current = ids;
  }, [pendientes, sonido]);

  const marcarListo = (f: Factura) => {
    updateFactura(f.id, { estado: "listo" });
    setStoryIdx(null);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["domicilio", "mesa"] as TipoFactura[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition",
                tab === t ? "bg-raspberry text-white" : "bg-sand text-cocoa/70 hover:bg-raspberry-light"
              )}
            >
              {t === "mesa" ? <Armchair size={16} /> : <Bike size={16} />}
              {t === "mesa" ? `Mesas (${mesas.length})` : `Domicilios (${domicilios.length})`}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSonido((s) => !s)}>
          {sonido ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {sonido ? "Sonido activo" : "Silenciado"}
        </Button>
      </div>

      {activos.length === 0 ? (
        <Empty title="Nada en preparación" hint="Las nuevas facturas aparecerán aquí con un aviso sonoro." />
      ) : (
        // Vista tipo "historias": miniaturas circulares
        <div className="flex flex-wrap gap-4">
          {activos.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setStoryIdx(i)}
              className="group flex w-24 flex-col items-center gap-2"
            >
              <span className="rounded-full bg-gradient-to-tr from-raspberry to-pistachio p-[3px] transition group-hover:scale-105">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-vanilla">
                  <span className="text-center">
                    <span className="block font-display text-lg font-black text-cocoa">{f.consecutivo}</span>
                    <span className="block text-[10px] font-bold text-cocoa/60">{formatHora12(f.creadoEn)}</span>
                  </span>
                </span>
              </span>
              <span className="truncate text-xs font-semibold text-cocoa/80">
                {f.tipo === "mesa" ? f.mesaNombre : f.clienteNombre}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Visor tipo historia */}
      {storyIdx !== null && activos[storyIdx] && (
        <StoryViewer
          facturas={activos}
          index={storyIdx}
          onIndex={setStoryIdx}
          onClose={() => setStoryIdx(null)}
          onListo={(f) => setConfirmar(f)}
        />
      )}

      <Confirm
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={() => confirmar && marcarListo(confirmar)}
        title="Marcar como listo"
        message={`¿Confirmas que ${confirmar ? folio(confirmar) : ""} está listo? Saldrá de cocina.`}
        confirmLabel="Sí, está listo"
      />
    </div>
  );
}

function StoryViewer({
  facturas, index, onIndex, onClose, onListo,
}: {
  facturas: Factura[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onListo: (f: Factura) => void;
}) {
  const f = facturas[index];
  const prev = () => onIndex(Math.max(0, index - 1));
  const next = () => index < facturas.length - 1 ? onIndex(index + 1) : onClose();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/70 p-4 backdrop-blur-sm">
      {/* Barras de progreso tipo historia */}
      <div className="absolute left-1/2 top-6 flex w-full max-w-md -translate-x-1/2 gap-1 px-4">
        {facturas.map((_, i) => (
          <span key={i} className={cx("h-1 flex-1 rounded-full", i <= index ? "bg-white" : "bg-white/30")} />
        ))}
      </div>

      <button onClick={prev} disabled={index === 0} className="absolute left-2 rounded-full bg-white/20 p-2 text-white disabled:opacity-30 sm:left-6">
        <ChevronLeft size={24} />
      </button>

      <Card className="w-full max-w-md animate-pop p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-black text-cocoa">{folio(f)}</p>
            <p className="text-sm font-semibold text-cocoa/70">
              {f.tipo === "mesa" ? f.mesaNombre : f.clienteNombre}
            </p>
          </div>
          <span className={cx("rounded-full px-3 py-1 text-xs font-bold", f.tipo === "mesa" ? "bg-mint/20 text-cocoa" : "bg-raspberry-light text-raspberry-dark")}>
            {f.tipo === "mesa" ? "Mesa" : "Domicilio"}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 rounded-xl bg-sand/60 px-4 py-2 text-sm font-bold text-cocoa">
          <span className="flex items-center gap-1"><Clock size={15} /> {formatHora12(f.creadoEn)}</span>
          <span className="text-cocoa/40">→</span>
          <span className="flex items-center gap-1 text-raspberry-dark">{horaMas(f.creadoEn, 30)}</span>
        </div>

        {f.tipo === "domicilio" && (
          <p className="mt-3 text-sm text-cocoa/70">{f.direccion}{f.barrio ? ` · ${f.barrio}` : ""}</p>
        )}

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
          {f.items.map((it, i) => (
            <div key={i} className={cx("rounded-xl border px-3 py-2", it.nuevo ? "border-raspberry bg-raspberry-light/40" : "border-sand")}>
              <p className="font-bold text-cocoa">
                {it.cantidad}× {it.nombre}
                {it.nuevo && <span className="ml-2 rounded-full bg-raspberry px-2 py-0.5 text-[10px] font-bold text-white">NUEVO</span>}
              </p>
              {it.observacion && <p className="text-sm italic text-raspberry-dark">— {it.observacion}</p>}
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cerrar</Button>
          <Button className="flex-1" onClick={() => onListo(f)}><Check size={18} /> Marcar listo</Button>
        </div>
      </Card>

      <button onClick={next} className="absolute right-2 rounded-full bg-white/20 p-2 text-white sm:right-6">
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
