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

// ── Sombras dinámicas por categoría ──────────────────────────────────────────
const SHADOW_HELADERIA =
  "0 0 0 5px rgba(59,130,246,0.75), 0 10px 28px rgba(59,130,246,0.45)";
const SHADOW_COMIDAS =
  "0 0 0 5px rgba(251,146,60,0.75), 0 10px 28px rgba(251,146,60,0.45)";
const SHADOW_MIXTO =
  "-6px 0 14px rgba(59,130,246,0.65), 6px 0 14px rgba(251,146,60,0.65), 0 6px 18px rgba(0,0,0,0.15)";

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
  // Domicilio / Reserva Domicilio: el dato grande pasa a ser el barrio (campo
  // independiente del modelo, no se parsea de la dirección) y el folio (D-0002)
  // se reubica como texto pequeño al pie de la tarjeta. Mesa / Reserva Mesa
  // reciben el mismo tratamiento con el número de mesa. Regalo/Reserva Regalo
  // no se tocan: siguen mostrando el folio en grande como antes.
  const esDomicilioFolioAbajo = factura.tipo === "domicilio" || factura.tipo === "reserva-domicilio";
  const folioAbajo = esMesaTipo || esDomicilioFolioAbajo;
  const tituloGrande = esMesaTipo
    ? factura.mesaNombre || folio(factura)
    : esDomicilioFolioAbajo
    ? factura.barrio || factura.clienteNombre || folio(factura)
    : folio(factura);
  const subtituloChico = esMesaTipo ? undefined : nombreFactura(factura);
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
        <div className={cx(
          "rounded-xl border-2 p-3 transition",
          factura.heladeriaLista
            ? "border-blue-400 bg-blue-50"
            : "border-sand bg-sand/20"
        )}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-base font-bold text-blue-700">🍦 Heladería</p>
            <button
              onClick={() =>
                updateFactura(factura.id, { heladeriaLista: !factura.heladeriaLista })
              }
              className={cx(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold transition",
                factura.heladeriaLista
                  ? "bg-blue-500 text-white"
                  : "border border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
              )}
            >
              <Check size={13} />
              {factura.heladeriaLista ? "Lista ✓" : "Marcar lista"}
            </button>
          </div>
          <div className="space-y-0.5">
            {itemsHeladeria.map((it, i) => (
              <p key={i} className={cx("text-base text-cocoa", it.nuevo && "font-bold text-raspberry-dark")}>
                {it.cantidad}× {it.nombre}
                {it.nuevo && <span className="ml-1 text-sm font-bold text-raspberry">(NUEVO)</span>}
                {it.observacion && (
                  <span className="ml-1 text-sm italic text-cocoa/60">— {it.observacion}</span>
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
            <p className="text-base font-bold text-orange-700">🍔 Comidas Rápidas</p>
            <button
              onClick={() =>
                updateFactura(factura.id, { comidasListas: !factura.comidasListas })
              }
              className={cx(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold transition",
                factura.comidasListas
                  ? "bg-orange-500 text-white"
                  : "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
              )}
            >
              <Check size={13} />
              {factura.comidasListas ? "Listas ✓" : "Marcar listas"}
            </button>
          </div>
          <div className="space-y-0.5">
            {itemsComidas.map((it, i) => (
              <p key={i} className={cx("text-base text-cocoa", it.nuevo && "font-bold text-raspberry-dark")}>
                {it.cantidad}× {it.nombre}
                {it.nuevo && <span className="ml-1 text-sm font-bold text-raspberry">(NUEVO)</span>}
                {it.observacion && (
                  <span className="ml-1 text-sm italic text-cocoa/60">— {it.observacion}</span>
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
