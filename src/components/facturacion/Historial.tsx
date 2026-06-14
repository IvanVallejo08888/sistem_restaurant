"use client";
import { useMemo, useState } from "react";
import { Search, Eye, Pencil, Armchair, Bike } from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { normalize, formatCOP, formatHora12, cx } from "@/lib/utils";
import { folio, labelMetodo } from "@/lib/factura";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { CompartirFactura } from "./CompartirFactura";
import { EditarFacturaInteligente } from "./EditarFacturaInteligente";
import { Factura, TipoFactura } from "@/types";

export function Historial() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas.filter((f) => f.localId === localId));

  const [tab, setTab] = useState<TipoFactura>("mesa");
  const [q, setQ] = useState("");
  const [ver, setVer] = useState<Factura | null>(null);
  const [editar, setEditar] = useState<Factura | null>(null);

  const lista = useMemo(() => {
    const base = facturas
      .filter((f) => f.tipo === tab)
      .sort((a, b) => +new Date(b.creadoEn) - +new Date(a.creadoEn));
    if (!q) return base;
    const nq = normalize(q);
    return base.filter((f) =>
      normalize(folio(f)).includes(nq) ||
      normalize(f.clienteNombre || f.mesaNombre || "").includes(nq) ||
      normalize(f.barrio || "").includes(nq)
    );
  }, [facturas, tab, q]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["mesa", "domicilio"] as TipoFactura[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition",
                tab === t ? "bg-raspberry text-white" : "bg-sand text-cocoa/70 hover:bg-raspberry-light"
              )}
            >
              {t === "mesa" ? <Armchair size={16} /> : <Bike size={16} />}
              {t === "mesa" ? "Mesas" : "Domicilios"}
            </button>
          ))}
        </div>
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

      {lista.length === 0 ? (
        <Empty title="Sin facturas" hint="Las facturas registradas aparecerán aquí." />
      ) : (
        <div className="grid gap-3">
          {lista.map((f) => (
            <Card key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-bold text-cocoa">
                  {folio(f)} · {f.tipo === "mesa" ? f.mesaNombre : f.clienteNombre}
                </p>
                <p className="text-xs text-cocoa/60">
                  {formatHora12(f.creadoEn)} · {labelMetodo(f.metodoPago)} · {f.items.length} ítem(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-cocoa">{formatCOP(f.total)}</span>
                <Button size="sm" variant="secondary" onClick={() => setVer(f)}><Eye size={14} /> Ver</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditar(f)}><Pencil size={14} /> Editar</Button>
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
    </div>
  );
}
