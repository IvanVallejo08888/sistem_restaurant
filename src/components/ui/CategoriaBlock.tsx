"use client";
import { Check } from "lucide-react";
import { cx } from "@/lib/utils";
import { Factura } from "@/types";

type Tema = "heladeria" | "comidas";

const TEMA: Record<Tema, {
  emoji: string;
  nombre: string;
  borderActivo: string;
  bgActivo: string;
  textoTitulo: string;
  botonActivo: string;
  botonInactivo: string;
  labelActivo: string;
  labelInactivo: string;
}> = {
  heladeria: {
    emoji: "🍦",
    nombre: "Heladería",
    borderActivo: "border-blue-400",
    bgActivo: "bg-blue-50",
    textoTitulo: "text-blue-700",
    botonActivo: "bg-blue-500 text-white",
    botonInactivo: "border border-blue-200 bg-white text-blue-600 hover:bg-blue-50",
    labelActivo: "Lista ✓",
    labelInactivo: "Marcar lista",
  },
  comidas: {
    emoji: "🍔",
    nombre: "Comidas Rápidas",
    borderActivo: "border-orange-400",
    bgActivo: "bg-orange-50",
    textoTitulo: "text-orange-700",
    botonActivo: "bg-orange-500 text-white",
    botonInactivo: "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50",
    labelActivo: "Listas ✓",
    labelInactivo: "Marcar listas",
  },
};

// Bloque de categoría (Heladería / Comidas Rápidas) reutilizado por Cocina y
// Despachador. En Cocina es interactivo (botón "Marcar lista"); en
// Despachador es de solo lectura: muestra un visto verde fijo, ya que para
// llegar ahí la categoría ya quedó validada en Cocina.
export function CategoriaBlock({
  tema,
  items,
  lista,
  onToggle,
}: {
  tema: Tema;
  items: Factura["items"];
  lista: boolean;
  onToggle?: () => void;
}) {
  const cfg = TEMA[tema];
  return (
    <div className={cx(
      "rounded-xl border-2 p-3 transition",
      lista ? `${cfg.borderActivo} ${cfg.bgActivo}` : "border-sand bg-sand/20"
    )}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={cx("text-base font-bold", cfg.textoTitulo)}>{cfg.emoji} {cfg.nombre}</p>
        {onToggle ? (
          <button
            onClick={onToggle}
            className={cx(
              "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold transition",
              lista ? cfg.botonActivo : cfg.botonInactivo
            )}
          >
            <Check size={13} />
            {lista ? cfg.labelActivo : cfg.labelInactivo}
          </button>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white">
            <Check size={13} /> Lista
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {items.map((it, i) => (
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
  );
}
