"use client";
import { Factura } from "@/types";
import { formatCOP, formatHora12 } from "@/lib/utils";
import { folio, labelMetodo } from "@/lib/factura";
import { useData } from "@/store/dataStore";

// Vista de factura (recibo). En Fase 2 se exportará como PNG.
export function FacturaView({ factura }: { factura: Factura }) {
  const local = useData((s) => s.locales.find((l) => l.id === factura.localId));
  return (
    <div className="rounded-xl2 border border-sand bg-vanilla p-5">
      <div className="text-center">
        <p className="font-display text-xl font-black text-cocoa">{local?.nombre || "Heladería Antojos"}</p>
        <p className="text-xs text-cocoa/60">Factura {folio(factura)} · {formatHora12(factura.creadoEn)}</p>
      </div>
      <div className="my-3 border-t border-dashed border-sand" />
      {(factura.tipo === "mesa" || factura.tipo === "reserva-mesa") ? (
        <p className="text-sm font-semibold text-cocoa">Mesa: {factura.mesaNombre}</p>
      ) : factura.tipo === "favor" ? (
        <p className="text-sm font-semibold text-cocoa">Favor: {factura.nombreFavor}</p>
      ) : (
        <div className="text-sm text-cocoa/80">
          <p className="font-semibold text-cocoa">{factura.clienteNombre}</p>
          {factura.clienteWhatsapp && <p>{factura.clienteWhatsapp}</p>}
          <p>{factura.direccion}{factura.barrio ? ` · ${factura.barrio}` : ""}</p>
        </div>
      )}
      <div className="my-3 border-t border-dashed border-sand" />
      <div className="space-y-1.5">
        {factura.items.map((it, i) => (
          <div key={i} className="text-sm">
            <div className="flex justify-between">
              <span className="text-cocoa">{it.cantidad}× {it.nombre}</span>
              <span className="font-semibold text-cocoa">{formatCOP(it.valor * it.cantidad)}</span>
            </div>
            {it.observacion && <p className="text-xs italic text-raspberry-dark">— {it.observacion}</p>}
          </div>
        ))}
      </div>
      <div className="my-3 border-t border-dashed border-sand" />
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-cocoa/70"><span>Subtotal</span><span>{formatCOP(factura.subtotal)}</span></div>
        {!!factura.valorDomicilio && (
          <div className="flex justify-between text-cocoa/70"><span>Domicilio</span><span>{formatCOP(factura.valorDomicilio)}</span></div>
        )}
        {!!factura.valorDescuento && (
          <div className="flex justify-between text-raspberry-dark">
            <span>Descuento {factura.tipoDescuento === "porcentaje" ? `(${factura.porcentajeDescuento}%)` : "(valor fijo)"}</span>
            <span>−{formatCOP(factura.valorDescuento)}</span>
          </div>
        )}
        {!!factura.valorCostoAdicional && (
          <div className="flex justify-between text-cocoa/70">
            <span>Costo adicional {factura.tipoCostoAdicional === "porcentaje" ? `(${factura.porcentajeCostoAdicional}%)` : "(valor fijo)"}</span>
            <span>+{formatCOP(factura.valorCostoAdicional)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black text-cocoa"><span>Total</span><span>{formatCOP(factura.total)}</span></div>
        <div className="flex justify-between text-cocoa/70"><span>Pago</span><span>{labelMetodo(factura.metodoPago)}</span></div>
      </div>
    </div>
  );
}
