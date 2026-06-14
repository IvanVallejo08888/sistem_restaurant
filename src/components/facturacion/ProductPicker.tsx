"use client";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useData } from "@/store/dataStore";
import { normalize, formatCOP } from "@/lib/utils";
import { ItemFactura } from "@/types";

// Buscador inteligente: filtra ignorando tildes y mayúsculas, agrega con "+".
export function ProductPicker({
  localId, onAdd,
}: {
  localId: string;
  onAdd: (item: ItemFactura) => void;
}) {
  const productos = useData((s) => s.productos.filter((p) => p.localId === localId));
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    if (!q) return productos;
    const nq = normalize(q);
    return productos.filter((p) => normalize(p.nombre).includes(nq));
  }, [productos, q]);

  return (
    <div>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto (ignora tildes)…"
          className="w-full rounded-xl border border-sand bg-white py-2.5 pl-9 pr-4 text-sm focus:border-raspberry focus:outline-none"
        />
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin pr-1">
        {filtrados.length === 0 ? (
          <p className="py-6 text-center text-sm text-cocoa/50">Sin coincidencias.</p>
        ) : (
          filtrados.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                onAdd({ productoId: p.id, nombre: p.nombre, valor: p.valor, cantidad: 1 })
              }
              className="flex w-full items-center justify-between rounded-xl border border-sand bg-white px-4 py-2.5 text-left transition hover:border-raspberry hover:bg-raspberry-light/30"
            >
              <span className="font-semibold text-cocoa">{p.nombre}</span>
              <span className="flex items-center gap-3">
                <span className="text-sm text-raspberry-dark">{formatCOP(p.valor)}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-raspberry text-white">
                  <Plus size={16} />
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
