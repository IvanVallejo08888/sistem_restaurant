"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair, Bike, CalendarClock, Check, Clock, Volume2, VolumeX,
} from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { formatHora12, now, cx } from "@/lib/utils";
import { folio } from "@/lib/factura";
import { playDing } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Factura, Producto } from "@/types";

type TabCocina = "domicilio" | "mesa" | "reserva-domicilio" | "reserva-mesa";

const TABS_COCINA: { key: TabCocina; label: (n: number) => string; icon: React.ReactNode }[] = [
  { key: "domicilio", label: (n) => `Domicilios (${n})`, icon: <Bike size={16} /> },
  { key: "mesa", label: (n) => `Mesas (${n})`, icon: <Armchair size={16} /> },
  { key: "reserva-domicilio", label: (n) => `Res. Domicilio (${n})`, icon: <CalendarClock size={16} /> },
  { key: "reserva-mesa", label: (n) => `Res. Mesa (${n})`, icon: <CalendarClock size={16} /> },
];

const TIPO_LABEL: Record<TabCocina, string> = {
  domicilio: "Domicilio",
  mesa: "Mesa",
  "reserva-domicilio": "Res. Domicilio",
  "reserva-mesa": "Res. Mesa",
};

// ── Sombras dinámicas por categoría ──────────────────────────────────────────
const SHADOW_HELADERIA =
  "0 0 0 3px rgba(59,130,246,0.45), 0 6px 20px rgba(59,130,246,0.2)";
const SHADOW_COMIDAS =
  "0 0 0 3px rgba(251,146,60,0.45), 0 6px 20px rgba(251,146,60,0.2)";
const SHADOW_MIXTO =
  "-4px 0 8px rgba(59,130,246,0.4), 4px 0 8px rgba(251,146,60,0.4), 0 4px 14px rgba(0,0,0,0.08)";

function calcularSombra(
  items: Factura["items"],
  productos: Producto[]
): string | undefined {
  const cats = new Set(
    items
      .map((it) => productos.find((p) => p.id === it.productoId)?.categoria)
      .filter(Boolean)
  );
  const h = cats.has("heladeria");
  const c = cats.has("comidas-rapidas");
  if (h && c) return SHADOW_MIXTO;
  if (h) return SHADOW_HELADERIA;
  if (c) return SHADOW_COMIDAS;
  return undefined;
}

function nombreFactura(f: Factura) {
  return f.tipo === "mesa" || f.tipo === "reserva-mesa" ? f.mesaNombre : f.clienteNombre;
}

// ── Tarjeta individual de cocina ──────────────────────────────────────────────
function CocinaCard({ factura }: { factura: Factura }) {
  const productos = useData((s) => s.productos);
  const updateFactura = useData((s) => s.updateFactura);

  // Agrupar items por categoría
  const getCategoria = (productoId: string) =>
    productos.find((p) => p.id === productoId)?.categoria;

  const itemsHeladeria = factura.items.filter(
    (it) => getCategoria(it.productoId) === "heladeria"
  );
  const itemsComidas = factura.items.filter(
    (it) => getCategoria(it.productoId) === "comidas-rapidas"
  );
  const itemsOtros = factura.items.filter((it) => !getCategoria(it.productoId));

  const tieneHeladeria = itemsHeladeria.length > 0;
  const tieneComidas = itemsComidas.length > 0;

  // Validación: cada sección presente debe estar completada
  const heladeriaOk = !tieneHeladeria || !!factura.heladeriaLista;
  const comidasOk = !tieneComidas || !!factura.comidasListas;
  const puedeDespachar = heladeriaOk && comidasOk;

  const shadowStyle = calcularSombra(factura.items, productos);
  const esMesaTipo = factura.tipo === "mesa" || factura.tipo === "reserva-mesa";
  const tipoLabel = TIPO_LABEL[factura.tipo as TabCocina] ?? factura.tipo;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-sand/50 bg-white p-4 transition-shadow"
      style={shadowStyle ? { boxShadow: shadowStyle } : undefined}
    >
      {/* ── Cabecera ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-xl font-black text-cocoa">{folio(factura)}</p>
          <p className="text-sm font-semibold text-cocoa/70">{nombreFactura(factura)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="flex items-center gap-1 text-xs text-cocoa/50">
            <Clock size={11} /> {formatHora12(factura.creadoEn)}
          </span>
          <span className={cx(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            esMesaTipo ? "bg-mint/20 text-cocoa" : "bg-raspberry-light text-raspberry-dark"
          )}>
            {tipoLabel}
          </span>
        </div>
      </div>

      {/* ── Fecha reserva ─────────────────────────────────────────── */}
      {factura.fechaProgramada && (
        <p className="flex items-center gap-1 text-xs font-bold text-raspberry-dark">
          <CalendarClock size={12} />
          {factura.fechaProgramada}{factura.horaReserva ? ` · ${factura.horaReserva}` : ""}
        </p>
      )}

      {/* ── Dirección domicilio ───────────────────────────────────── */}
      {!esMesaTipo && factura.direccion && (
        <p className="text-xs text-cocoa/60">
          {factura.direccion}{factura.barrio ? ` · ${factura.barrio}` : ""}
        </p>
      )}

      {/* ── Sección Heladería ──────────────────────────────────────── */}
      {tieneHeladeria && (
        <div className={cx(
          "rounded-xl border-2 p-3 transition",
          factura.heladeriaLista
            ? "border-blue-400 bg-blue-50"
            : "border-sand bg-sand/20"
        )}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-blue-700">🍦 Heladería</p>
            <button
              onClick={() =>
                updateFactura(factura.id, { heladeriaLista: !factura.heladeriaLista })
              }
              className={cx(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition",
                factura.heladeriaLista
                  ? "bg-blue-500 text-white"
                  : "border border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
              )}
            >
              <Check size={11} />
              {factura.heladeriaLista ? "Lista ✓" : "Marcar lista"}
            </button>
          </div>
          <div className="space-y-0.5">
            {itemsHeladeria.map((it, i) => (
              <p key={i} className={cx("text-sm text-cocoa", it.nuevo && "font-bold text-raspberry-dark")}>
                {it.cantidad}× {it.nombre}
                {it.nuevo && <span className="ml-1 text-xs font-bold text-raspberry">(NUEVO)</span>}
                {it.observacion && (
                  <span className="ml-1 text-xs italic text-cocoa/60">— {it.observacion}</span>
                )}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Sección Comidas Rápidas ────────────────────────────────── */}
      {tieneComidas && (
        <div className={cx(
          "rounded-xl border-2 p-3 transition",
          factura.comidasListas
            ? "border-orange-400 bg-orange-50"
            : "border-sand bg-sand/20"
        )}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-orange-700">🍔 Comidas Rápidas</p>
            <button
              onClick={() =>
                updateFactura(factura.id, { comidasListas: !factura.comidasListas })
              }
              className={cx(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition",
                factura.comidasListas
                  ? "bg-orange-500 text-white"
                  : "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
              )}
            >
              <Check size={11} />
              {factura.comidasListas ? "Listas ✓" : "Marcar listas"}
            </button>
          </div>
          <div className="space-y-0.5">
            {itemsComidas.map((it, i) => (
              <p key={i} className={cx("text-sm text-cocoa", it.nuevo && "font-bold text-raspberry-dark")}>
                {it.cantidad}× {it.nombre}
                {it.nuevo && <span className="ml-1 text-xs font-bold text-raspberry">(NUEVO)</span>}
                {it.observacion && (
                  <span className="ml-1 text-xs italic text-cocoa/60">— {it.observacion}</span>
                )}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Otros items (sin categoría asignada) ──────────────────── */}
      {itemsOtros.length > 0 && (
        <div className="space-y-0.5 rounded-xl border border-sand p-3">
          {itemsOtros.map((it, i) => (
            <p key={i} className="text-sm text-cocoa/70">
              {it.cantidad}× {it.nombre}
              {it.observacion && (
                <span className="ml-1 text-xs italic text-cocoa/50">— {it.observacion}</span>
              )}
            </p>
          ))}
        </div>
      )}

      {/* ── Indicador de progreso ──────────────────────────────────── */}
      {(tieneHeladeria || tieneComidas) && (
        <div className="flex flex-wrap gap-1.5">
          {tieneHeladeria && (
            <span className={cx(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              factura.heladeriaLista
                ? "bg-blue-100 text-blue-700"
                : "bg-sand text-cocoa/50"
            )}>
              Heladería {factura.heladeriaLista ? "✓" : "○"}
            </span>
          )}
          {tieneComidas && (
            <span className={cx(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              factura.comidasListas
                ? "bg-orange-100 text-orange-700"
                : "bg-sand text-cocoa/50"
            )}>
              Comidas {factura.comidasListas ? "✓" : "○"}
            </span>
          )}
        </div>
      )}

      {/* ── Botón Despachar ────────────────────────────────────────── */}
      <Button
        className="mt-auto w-full"
        disabled={!puedeDespachar}
        onClick={() => updateFactura(factura.id, { estado: "listo" })}
      >
        <Check size={16} />
        {puedeDespachar ? "Despachar" : "Completar validaciones"}
      </Button>
    </div>
  );
}

// ── Tablero principal de Cocina ───────────────────────────────────────────────
export function CocinaBoard() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas);

  const [sonido, setSonido] = useState(true);
  const [tab, setTab] = useState<TabCocina>("domicilio");

  // Pendientes: excluye "favor" (va directo al despachador)
  // Reservas con fecha futura no aparecen hasta el día programado
  const pendientes = useMemo(() => {
    const hoy = now().slice(0, 10);
    return facturas
      .filter((f) =>
        f.localId === localId &&
        f.estado === "pendiente" &&
        f.tipo !== "favor" &&
        (!f.fechaProgramada || f.fechaProgramada <= hoy)
      )
      .sort((a, b) => +new Date(a.creadoEn) - +new Date(b.creadoEn));
  }, [facturas, localId]);

  const byTipo: Record<TabCocina, Factura[]> = useMemo(() => ({
    domicilio: pendientes.filter((f) => f.tipo === "domicilio"),
    mesa: pendientes.filter((f) => f.tipo === "mesa"),
    "reserva-domicilio": pendientes.filter((f) => f.tipo === "reserva-domicilio"),
    "reserva-mesa": pendientes.filter((f) => f.tipo === "reserva-mesa"),
  }), [pendientes]);

  const activos = byTipo[tab];

  // Detecta nuevas facturas y reproduce sonido
  const conocidas = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(pendientes.map((f) => f.id));
    if (conocidas.current === null) {
      conocidas.current = ids;
      return;
    }
    let nueva = false;
    ids.forEach((id) => { if (!conocidas.current!.has(id)) nueva = true; });
    if (nueva && sonido) playDing();
    conocidas.current = ids;
  }, [pendientes, sonido]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS_COCINA.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition",
                tab === t.key
                  ? "bg-raspberry text-white"
                  : "bg-sand text-cocoa/70 hover:bg-raspberry-light"
              )}
            >
              {t.icon}{t.label(byTipo[t.key].length)}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSonido((s) => !s)}>
          {sonido ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {sonido ? "Sonido activo" : "Silenciado"}
        </Button>
      </div>

      {activos.length === 0 ? (
        <Empty
          title="Nada en preparación"
          hint="Las nuevas facturas aparecerán aquí con un aviso sonoro."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activos.map((f) => (
            <CocinaCard key={f.id} factura={f} />
          ))}
        </div>
      )}
    </div>
  );
}
