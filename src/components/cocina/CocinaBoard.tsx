"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair, Bike, CalendarClock, Check, Clock, Volume2, VolumeX,
} from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { formatHora12, now, cx } from "@/lib/utils";
import { folio } from "@/lib/factura";
import { categoriasDe, calcularSombra, tituloFactura, agruparPorCategoria } from "@/lib/facturaVisual";
import { playDing, playGuitarra, playPiano, playSaxofon } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { CategoriaBlock } from "@/components/ui/CategoriaBlock";
import { Factura, Producto, TipoFactura } from "@/types";

type TabCocina = "domicilio" | "mesa" | "reserva-domicilio" | "reserva-mesa";

const TABS_COCINA: { key: TabCocina; label: (n: number) => string; icon: React.ReactNode }[] = [
  { key: "domicilio", label: (n) => `Domicilios (${n})`, icon: <Bike size={16} /> },
  { key: "mesa", label: (n) => `Mesas (${n})`, icon: <Armchair size={16} /> },
  { key: "reserva-domicilio", label: (n) => `Res. Domicilio (${n})`, icon: <CalendarClock size={16} /> },
  { key: "reserva-mesa", label: (n) => `Res. Mesa (${n})`, icon: <CalendarClock size={16} /> },
];

// "regalo"/"reserva-regalo" no tienen pestaña propia: se mezclan dentro de
// "domicilio"/"reserva-domicilio" (mismo flujo de cocina, sin filtro nuevo).
const TAB_DE_TIPO: Record<Exclude<TipoFactura, "favor">, TabCocina> = {
  domicilio: "domicilio",
  regalo: "domicilio",
  mesa: "mesa",
  "reserva-domicilio": "reserva-domicilio",
  "reserva-regalo": "reserva-domicilio",
  "reserva-mesa": "reserva-mesa",
};

// Etiqueta visible en la tarjeta de cada pedido (distingue "Regalo" de "Domicilio"
// aunque ambos compartan la misma pestaña/contador).
const TIPO_LABEL: Record<Exclude<TipoFactura, "favor">, string> = {
  domicilio: "Domicilio",
  mesa: "Mesa",
  "reserva-domicilio": "Res. Domicilio",
  "reserva-mesa": "Res. Mesa",
  regalo: "Regalo",
  "reserva-regalo": "Reserva Regalo",
};

// ── Sonido de aviso por categoría (independiente del tipo de factura) ───────
// categoriasDe/calcularSombra viven en @/lib/facturaVisual (fuente única,
// compartida también por Despachador).
type ClaseSonido = "heladeria" | "comidas" | "mixto" | "otro";

// "otro" cubre tanto productos sin categoría como mezclas con una tercera
// categoría distinta a heladería/comidas-rápidas; en esos casos se mantiene
// el sonido original (playDing) como fallback.
function clasificarParaSonido(items: Factura["items"], productos: Producto[]): ClaseSonido {
  const cats = categoriasDe(items, productos);
  const h = cats.has("heladeria");
  const c = cats.has("comidas-rapidas");
  const soloEstasDosCategorias =
    cats.size > 0 && [...cats].every((cat) => cat === "heladeria" || cat === "comidas-rapidas");
  if (!soloEstasDosCategorias) return "otro";
  if (h && c) return "mixto";
  if (h) return "heladeria";
  return "comidas";
}

function reproducirSonidoFactura(items: Factura["items"], productos: Producto[]) {
  switch (clasificarParaSonido(items, productos)) {
    case "heladeria":
      playGuitarra();
      break;
    case "comidas":
      playPiano();
      break;
    case "mixto":
      playSaxofon();
      break;
    default:
      playDing();
  }
}

// ── Tarjeta individual de cocina ──────────────────────────────────────────────
function CocinaCard({ factura }: { factura: Factura }) {
  const productos = useData((s) => s.productos);
  const updateFactura = useData((s) => s.updateFactura);

  const { itemsHeladeria, itemsComidas, itemsOtros } = agruparPorCategoria(factura.items, productos);

  const tieneHeladeria = itemsHeladeria.length > 0;
  const tieneComidas = itemsComidas.length > 0;

  // Validación: cada sección presente debe estar completada
  const heladeriaOk = !tieneHeladeria || !!factura.heladeriaLista;
  const comidasOk = !tieneComidas || !!factura.comidasListas;
  const puedeDespachar = heladeriaOk && comidasOk;

  const shadowStyle = calcularSombra(factura.items, productos);
  const esMesaTipo = factura.tipo === "mesa" || factura.tipo === "reserva-mesa";
  const esDomicilioFolioAbajo = factura.tipo === "domicilio" || factura.tipo === "reserva-domicilio";
  const { grande: tituloGrande, chico: subtituloChico, folioAbajo } = tituloFactura(factura);
  const tipoLabel = TIPO_LABEL[factura.tipo as Exclude<TipoFactura, "favor">] ?? factura.tipo;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-sand/50 bg-white p-4 transition-shadow"
      style={shadowStyle ? { boxShadow: shadowStyle } : undefined}
    >
      {/* ── Cabecera ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-black text-cocoa">{tituloGrande}</p>
          {subtituloChico && (
            <p className="text-base font-semibold text-cocoa/70">{subtituloChico}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="flex items-center gap-1 text-sm text-cocoa/50">
            <Clock size={13} /> {formatHora12(factura.creadoEn)}
          </span>
          <span className={cx(
            "rounded-full px-2 py-0.5 text-sm font-bold",
            esMesaTipo ? "bg-mint/20 text-cocoa" : "bg-raspberry-light text-raspberry-dark"
          )}>
            {tipoLabel}
          </span>
        </div>
      </div>

      {/* ── Fecha reserva ─────────────────────────────────────────── */}
      {factura.fechaProgramada && (
        <p className="flex items-center gap-1 text-sm font-bold text-raspberry-dark">
          <CalendarClock size={14} />
          {factura.fechaProgramada}{factura.horaReserva ? ` · ${factura.horaReserva}` : ""}
        </p>
      )}

      {/* ── Dirección domicilio ───────────────────────────────────── */}
      {!esMesaTipo && factura.direccion && (
        <p className="text-sm text-cocoa/60">
          {factura.direccion}
          {!esDomicilioFolioAbajo && factura.barrio ? ` · ${factura.barrio}` : ""}
        </p>
      )}

      {/* ── Sección Heladería ──────────────────────────────────────── */}
      {tieneHeladeria && (
        <CategoriaBlock
          tema="heladeria"
          items={itemsHeladeria}
          lista={!!factura.heladeriaLista}
          onToggle={() => updateFactura(factura.id, { heladeriaLista: !factura.heladeriaLista })}
        />
      )}

      {/* ── Sección Comidas Rápidas ────────────────────────────────── */}
      {tieneComidas && (
        <CategoriaBlock
          tema="comidas"
          items={itemsComidas}
          lista={!!factura.comidasListas}
          onToggle={() => updateFactura(factura.id, { comidasListas: !factura.comidasListas })}
        />
      )}

      {/* ── Otros items (sin categoría asignada) ──────────────────── */}
      {itemsOtros.length > 0 && (
        <div className="space-y-0.5 rounded-xl border border-sand p-3">
          {itemsOtros.map((it, i) => (
            <p key={i} className="text-base text-cocoa/70">
              {it.cantidad}× {it.nombre}
              {it.observacion && (
                <span className="ml-1 text-sm italic text-cocoa/50">— {it.observacion}</span>
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
              "rounded-full px-2 py-0.5 text-sm font-semibold",
              factura.heladeriaLista
                ? "bg-blue-100 text-blue-700"
                : "bg-sand text-cocoa/50"
            )}>
              Heladería {factura.heladeriaLista ? "✓" : "○"}
            </span>
          )}
          {tieneComidas && (
            <span className={cx(
              "rounded-full px-2 py-0.5 text-sm font-semibold",
              factura.comidasListas
                ? "bg-orange-100 text-orange-700"
                : "bg-sand text-cocoa/50"
            )}>
              Comidas {factura.comidasListas ? "✓" : "○"}
            </span>
          )}
        </div>
      )}

      {/* ── Folio pequeño al pie (mesa/domicilio y sus reservas) ────── */}
      {folioAbajo && (
        <p className="text-xs text-cocoa/40">{folio(factura)}</p>
      )}

      {/* ── Botón Despachar ────────────────────────────────────────── */}
      <Button
        className="mt-auto w-full"
        size="lg"
        disabled={!puedeDespachar}
        onClick={() => updateFactura(factura.id, { estado: "listo" })}
      >
        <Check size={18} />
        {puedeDespachar ? "Despachar" : "Completar validaciones"}
      </Button>
    </div>
  );
}

// ── Tablero principal de Cocina ───────────────────────────────────────────────
export function CocinaBoard() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas);
  const productos = useData((s) => s.productos);

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
    domicilio: pendientes.filter((f) => TAB_DE_TIPO[f.tipo as Exclude<TipoFactura, "favor">] === "domicilio"),
    mesa: pendientes.filter((f) => TAB_DE_TIPO[f.tipo as Exclude<TipoFactura, "favor">] === "mesa"),
    "reserva-domicilio": pendientes.filter((f) => TAB_DE_TIPO[f.tipo as Exclude<TipoFactura, "favor">] === "reserva-domicilio"),
    "reserva-mesa": pendientes.filter((f) => TAB_DE_TIPO[f.tipo as Exclude<TipoFactura, "favor">] === "reserva-mesa"),
  }), [pendientes]);

  const activos = byTipo[tab];

  // Detecta nuevas facturas y reproduce el sonido correspondiente según la
  // categoría de sus productos (guitarra/piano/saxofón/ding), sin importar
  // el tipo de factura (domicilio, mesa, regalo, favor, reservas, etc.).
  const conocidas = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(pendientes.map((f) => f.id));
    if (conocidas.current === null) {
      conocidas.current = ids;
      return;
    }
    const nuevas = pendientes.filter((f) => !conocidas.current!.has(f.id));
    if (nuevas.length > 0 && sonido) {
      nuevas.forEach((f) => reproducirSonidoFactura(f.items, productos));
    }
    conocidas.current = ids;
  }, [pendientes, sonido, productos]);

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
