"use client";
import { useMemo, useState } from "react";
import {
  Armchair, Bike, Check, Clock, Users, Plus, Minus, ListMusic, Gift, CalendarClock,
} from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { formatHora12, formatCOP, cx } from "@/lib/utils";
import { folio } from "@/lib/factura";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Empty } from "@/components/ui/Empty";
import { CompartirFactura } from "@/components/facturacion/CompartirFactura";
import { Factura } from "@/types";

type Tab = "domicilios" | "mesas" | "domiciliarios";

function nombreParaDespacho(f: Factura): string {
  if (f.tipo === "favor") return f.nombreFavor ?? "Favor";
  if (f.tipo === "mesa" || f.tipo === "reserva-mesa") return f.mesaNombre ?? "";
  return f.clienteNombre ?? "";
}

export function DespachadorBoard() {
  const localId = useSession((s) => s.localId)!;
  const facturas = useData((s) => s.facturas);
  const domiciliarios = useData((s) => s.domiciliarios.filter((d) => d.localId === localId));
  const updateFactura = useData((s) => s.updateFactura);
  const marcarServida = useData((s) => s.marcarServida);
  const asignarDomiciliario = useData((s) => s.asignarDomiciliario);

  const [tab, setTab] = useState<Tab>("domicilios");
  const [detalle, setDetalle] = useState<Factura | null>(null);
  const [asignando, setAsignando] = useState<Factura | null>(null);
  const [perfil, setPerfil] = useState<string | null>(null);
  // Tras asignar domiciliario exitosamente, abre el mismo modal de "Factura
  // electrónica" reutilizado en Facturación/Historial (Compartir/Descargar PNG).
  const [facturaAsignada, setFacturaAsignada] = useState<Factura | null>(null);

  const listos = useMemo(
    () => facturas.filter((f) => f.localId === localId && f.estado === "listo"),
    [facturas, localId]
  );

  // Domicilios pendientes de asignar: incluye domicilio, favor y reserva-domicilio
  const domiciliosPend = listos.filter(
    (f) => (f.tipo === "domicilio" || f.tipo === "favor" || f.tipo === "reserva-domicilio") && !f.domiciliarioId
  );
  // Mesas: incluye mesa y reserva-mesa
  const mesasPendientes = listos.filter((f) => (f.tipo === "mesa" || f.tipo === "reserva-mesa") && !f.servida);
  const mesasServidas = listos.filter((f) => (f.tipo === "mesa" || f.tipo === "reserva-mesa") && f.servida);

  const completar = (f: Factura) => {
    updateFactura(f.id, { estado: "completado", despachado: true });
    setDetalle(null);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {([
          { k: "domicilios", label: `Domicilios (${domiciliosPend.length})`, icon: <Bike size={16} /> },
          { k: "mesas", label: `Mesas (${mesasPendientes.length})`, icon: <Armchair size={16} /> },
          { k: "domiciliarios", label: "Domiciliarios", icon: <Users size={16} /> },
        ] as { k: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cx(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition",
              tab === t.k ? "bg-raspberry text-white" : "bg-sand text-cocoa/70 hover:bg-raspberry-light"
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "domicilios" && (
        domiciliosPend.length === 0 ? (
          <Empty title="Sin domicilios por asignar" hint="Aparecerán cuando cocina los marque listos o al registrar un Favor." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domiciliosPend.map((f) => (
              <Card key={f.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <p className="font-display text-xl font-black text-cocoa">{folio(f)}</p>
                  <div className="flex items-center gap-2">
                    {f.tipo === "favor" && (
                      <span className="rounded-full bg-pistachio/30 px-2 py-0.5 text-xs font-bold text-cocoa">
                        <Gift size={10} className="inline" /> Favor
                      </span>
                    )}
                    {f.tipo === "reserva-domicilio" && (
                      <span className="rounded-full bg-raspberry-light px-2 py-0.5 text-xs font-bold text-raspberry-dark">
                        <CalendarClock size={10} className="inline" /> Reserva
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs font-bold text-cocoa/60">
                      <Clock size={13} /> {formatHora12(f.creadoEn)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 font-semibold text-cocoa">{nombreParaDespacho(f)}</p>
                {f.tipo !== "favor" && (
                  <p className="text-sm text-cocoa/60">{f.direccion}{f.barrio ? ` · ${f.barrio}` : ""}</p>
                )}
                {f.tipo === "favor" && f.descuentoDomiciliario && f.descuentoDomiciliario > 0 && (
                  <p className="mt-1 text-xs font-semibold text-raspberry-dark">
                    Descuento domiciliario: {formatCOP(f.descuentoDomiciliario)}
                  </p>
                )}
                {f.fechaProgramada && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-cocoa/60">
                    <CalendarClock size={11} /> {f.fechaProgramada}{f.horaReserva ? ` · ${f.horaReserva}` : ""}
                  </p>
                )}
                <p className="mt-2 text-sm text-cocoa/70">{formatCOP(f.total)}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => setDetalle(f)}>Detalle</Button>
                  <Button size="sm" className="flex-1" onClick={() => setAsignando(f)}><Plus size={15} /> Asignar</Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "mesas" && (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 font-display text-lg font-semibold text-cocoa">Por servir</h3>
            {mesasPendientes.length === 0 ? (
              <Empty title="Sin mesas por servir" />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mesasPendientes.map((f) => (
                  <Card key={f.id} className="flex flex-col p-5">
                    <div className="flex items-start justify-between">
                      <p className="font-display text-xl font-black text-cocoa">{folio(f)}</p>
                      <div className="flex items-center gap-2">
                        {f.tipo === "reserva-mesa" && (
                          <span className="rounded-full bg-mint/20 px-2 py-0.5 text-xs font-bold text-cocoa">
                            <CalendarClock size={10} className="inline" /> Reserva
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs font-bold text-cocoa/60">
                          <Clock size={13} /> {formatHora12(f.creadoEn)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 font-semibold text-cocoa">{f.mesaNombre}</p>
                    {f.fechaProgramada && (
                      <p className="text-xs text-cocoa/60">
                        <CalendarClock size={11} className="inline mr-1" />{f.fechaProgramada}{f.horaReserva ? ` · ${f.horaReserva}` : ""}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-cocoa/70">{f.items.length} ítem(s) · {formatCOP(f.total)}</p>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => setDetalle(f)}>Detalle</Button>
                      <Button size="sm" className="flex-1" onClick={() => marcarServida(f.id, true)}><ListMusic size={15} /> Servir</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-cocoa">
              <ListMusic size={18} className="text-raspberry" /> Ya servidas
            </h3>
            {mesasServidas.length === 0 ? (
              <Empty title="Aún no hay mesas servidas" hint="Las mesas servidas se acumulan aquí, tipo playlist." />
            ) : (
              <div className="space-y-2">
                {mesasServidas.map((f) => (
                  <Card key={f.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-bold text-cocoa">{folio(f)} · {f.mesaNombre}</p>
                      <p className="text-xs text-cocoa/60">{formatHora12(f.creadoEn)} · {formatCOP(f.total)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setDetalle(f)}>Ver</Button>
                      <Button size="sm" variant="secondary" onClick={() => marcarServida(f.id, false)}>Regresar</Button>
                      <Button size="sm" onClick={() => completar(f)}><Check size={14} /> Cerrar</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "domiciliarios" && (
        domiciliarios.length === 0 ? (
          <Empty title="Sin domiciliarios" hint="El admin debe registrarlos primero." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domiciliarios.map((d) => {
              const asignadas = listos.filter((f) => f.domiciliarioId === d.id);
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
                    <div className="min-w-0">
                      <p className="truncate font-bold text-cocoa">{d.nombreCompleto}</p>
                      <p className="text-xs text-cocoa/60">{asignadas.length} pedido(s) activo(s)</p>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        )
      )}

      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title={`Detalle ${detalle ? folio(detalle) : ""}`}
        footer={detalle && (detalle.tipo === "mesa" || detalle.tipo === "reserva-mesa") ? (
          <Button onClick={() => completar(detalle)}><Check size={16} /> Cerrar mesa</Button>
        ) : undefined}
      >
        {detalle && <CompartirFactura factura={detalle} />}
      </Modal>

      <Modal
        open={!!asignando}
        onClose={() => setAsignando(null)}
        title={`Asignar ${asignando ? folio(asignando) : ""}`}
      >
        {domiciliarios.length === 0 ? (
          <p className="text-sm text-cocoa/60">No hay domiciliarios registrados.</p>
        ) : (
          <div className="space-y-2">
            {domiciliarios.map((d) => (
              <button
                key={d.id}
                onClick={async () => {
                  if (!asignando) return;
                  const f = asignando;
                  setAsignando(null);
                  try {
                    await asignarDomiciliario(f.id, d.id);
                    setFacturaAsignada(f);
                  } catch (e) {
                    console.error("No se pudo asignar el domiciliario:", e);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-sand bg-white px-4 py-3 text-left transition hover:border-raspberry hover:bg-raspberry-light/30"
              >
                <div className="h-10 w-10 overflow-hidden rounded-xl bg-sand">
                  {d.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.fotoUrl} alt={d.nombreCompleto} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-cocoa/30"><Bike size={18} /></div>
                  )}
                </div>
                <span className="font-semibold text-cocoa">{d.nombreCompleto}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={!!facturaAsignada}
        onClose={() => setFacturaAsignada(null)}
        title="Factura electrónica"
      >
        {facturaAsignada && <CompartirFactura factura={facturaAsignada} />}
      </Modal>

      {perfil && (
        <PerfilDomiciliario
          domiciliarioId={perfil}
          facturas={listos.filter((f) => f.domiciliarioId === perfil)}
          onClose={() => setPerfil(null)}
          onRetirar={(id) => asignarDomiciliario(id, null)}
          onCompletar={(f) => completar(f)}
        />
      )}
    </div>
  );
}

function PerfilDomiciliario({
  domiciliarioId, facturas, onClose, onRetirar, onCompletar,
}: {
  domiciliarioId: string;
  facturas: Factura[];
  onClose: () => void;
  onRetirar: (facturaId: string) => void;
  onCompletar: (f: Factura) => void;
}) {
  const d = useData((s) => s.domiciliarios.find((x) => x.id === domiciliarioId));
  if (!d) return null;
  return (
    <Modal open onClose={onClose} title="Perfil del domiciliario">
      <div className="mb-4 flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-sand">
          {d.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.fotoUrl} alt={d.nombreCompleto} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-cocoa/30"><Bike size={24} /></div>
          )}
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-cocoa">{d.nombreCompleto}</p>
          <p className="text-sm text-cocoa/60">{d.whatsapp}</p>
        </div>
      </div>

      {facturas.length === 0 ? (
        <p className="py-6 text-center text-sm text-cocoa/50">Sin facturas asignadas.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-sand">
          <table className="w-full text-sm">
            <thead className="bg-sand/60 text-left text-cocoa/70">
              <tr>
                <th className="px-3 py-2 font-bold">Factura</th>
                <th className="px-3 py-2 font-bold">Total</th>
                <th className="px-3 py-2 font-bold">Desc.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="border-t border-sand">
                  <td className="px-3 py-2 text-cocoa">
                    {folio(f)}
                    {f.tipo === "favor" && <span className="ml-1 text-xs text-cocoa/50">(Favor)</span>}
                    <br />
                    <span className="text-xs text-cocoa/50">{f.barrio || f.nombreFavor || "—"}</span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-cocoa">{formatCOP(f.total)}</td>
                  <td className="px-3 py-2 text-raspberry-dark font-semibold">
                    {f.descuentoDomiciliario ? formatCOP(f.descuentoDomiciliario) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onRetirar(f.id)}
                        className="flex items-center gap-1 rounded-full bg-sand px-3 py-1 text-xs font-bold text-cocoa hover:bg-raspberry-light"
                      >
                        <Minus size={13} /> Retirar
                      </button>
                      <button
                        onClick={() => onCompletar(f)}
                        className="flex items-center gap-1 rounded-full bg-raspberry px-3 py-1 text-xs font-bold text-white"
                      >
                        <Check size={13} /> Entregado
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
