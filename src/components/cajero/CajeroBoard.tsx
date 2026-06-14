"use client";
import { useMemo, useState } from "react";
import { Bike, Wallet, ArrowRight } from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { formatCOP, cx } from "@/lib/utils";
import { labelMetodo } from "@/lib/factura";
import { facturasDelDia, efectivoAEntregar } from "@/lib/reportes";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { Factura } from "@/types";

export function CajeroBoard() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas);
  const domiciliarios = useData((s) => s.domiciliarios.filter((d) => d.localId === localId));
  const [perfil, setPerfil] = useState<string | null>(null);

  const delDia = useMemo(() => facturasDelDia(facturas, localId), [facturas, localId]);

  // Domiciliarios con actividad del día (al menos una factura asignada hoy)
  const conActividad = domiciliarios.filter((d) =>
    delDia.some((f) => f.domiciliarioId === d.id)
  );

  return (
    <div>
      <h2 className="mb-1 font-display text-2xl font-semibold text-cocoa">Cuadre por domiciliario</h2>
      <p className="mb-5 text-sm text-cocoa/60">Actividad del día de hoy.</p>

      {conActividad.length === 0 ? (
        <Empty icon={<Bike size={40} />} title="Sin actividad hoy" hint="Los domiciliarios con pedidos del día aparecerán aquí." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conActividad.map((d) => {
            const suyas = delDia.filter((f) => f.domiciliarioId === d.id);
            const entregar = efectivoAEntregar(suyas);
            return (
              <Card key={d.id} className="p-5">
                <button className="flex w-full items-center gap-3 text-left" onClick={() => setPerfil(d.id)}>
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-sand">
                    {d.fotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.fotoUrl} alt={d.nombreCompleto} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-cocoa/30"><Bike size={20} /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-cocoa">{d.nombreCompleto}</p>
                    <p className="text-xs text-cocoa/60">{suyas.length} factura(s)</p>
                  </div>
                  <ArrowRight size={18} className="text-cocoa/40" />
                </button>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-pistachio/20 px-4 py-3">
                  <span className="text-sm font-bold text-cocoa/70">Efectivo a entregar</span>
                  <span className="font-display text-lg font-black text-cocoa">{formatCOP(entregar)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {perfil && (
        <DetalleCajero
          facturas={delDia.filter((f) => f.domiciliarioId === perfil)}
          nombre={domiciliarios.find((d) => d.id === perfil)?.nombreCompleto || ""}
          onClose={() => setPerfil(null)}
        />
      )}
    </div>
  );
}

function DetalleCajero({
  facturas, nombre, onClose,
}: {
  facturas: Factura[];
  nombre: string;
  onClose: () => void;
}) {
  const entregar = efectivoAEntregar(facturas);
  return (
    <Modal open onClose={onClose} title={`Cuadre · ${nombre}`}>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-sand">
          <table className="w-full text-sm">
            <thead className="bg-sand/60 text-left text-cocoa/70">
              <tr>
                <th className="px-3 py-2 font-bold">Factura</th>
                <th className="px-3 py-2 font-bold">Pago</th>
                <th className="px-3 py-2 font-bold text-right">Productos</th>
                <th className="px-3 py-2 font-bold text-right">Domicilio</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="border-t border-sand">
                  <td className="px-3 py-2 text-cocoa">{f.clienteNombre}</td>
                  <td className="px-3 py-2">
                    <span className={cx(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      f.metodoPago === "efectivo" ? "bg-pistachio/30 text-cocoa" : "bg-mint/20 text-cocoa"
                    )}>
                      {labelMetodo(f.metodoPago)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-cocoa">{formatCOP(f.subtotal)}</td>
                  <td className="px-3 py-2 text-right text-cocoa/70">{formatCOP(f.valorDomicilio || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-cocoa/50">
          Efectivo: se suma solo el valor de productos. Transferencia: se resta el valor del domicilio.
        </p>
        <div className="flex items-center justify-between rounded-xl bg-cocoa px-5 py-4 text-white">
          <span className="flex items-center gap-2 font-bold"><Wallet size={18} /> Efectivo a entregar</span>
          <span className="font-display text-2xl font-black">{formatCOP(entregar)}</span>
        </div>
      </div>
    </Modal>
  );
}
