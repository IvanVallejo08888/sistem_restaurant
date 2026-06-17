import { Factura, ItemFactura, MetodoPago, TipoFactura, TipoMixtoFavor } from "@/types";

export const subtotalDe = (items: ItemFactura[]) =>
  items.reduce((acc, it) => acc + it.valor * it.cantidad, 0);

export const totalDe = (items: ItemFactura[], valorDomicilio = 0) =>
  subtotalDe(items) + (valorDomicilio || 0);

export type MetodoPagoEstandar = Exclude<MetodoPago, "mixto" | "domiciliario">;

// Métodos de pago estándar para gastos empresariales (sin mixto ni domiciliario)
export const metodosPago: { value: MetodoPagoEstandar; label: string; grupo: "efectivo" | "transferencia" }[] = [
  { value: "efectivo", label: "Efectivo", grupo: "efectivo" },
  { value: "nequi", label: "Nequi", grupo: "transferencia" },
  { value: "bancolombia", label: "Bancolombia", grupo: "transferencia" },
  { value: "daviplata", label: "Daviplata", grupo: "transferencia" },
  { value: "datafono", label: "Datáfono", grupo: "transferencia" },
];

// Métodos de pago para facturación de órdenes normales (mesa, domicilio, reservas — incluye Mixto)
export const metodosPagoOrden: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "daviplata", label: "Daviplata" },
  { value: "datafono", label: "Datáfono" },
  { value: "mixto", label: "Mixto" },
];

// Métodos de pago para tipo "favor" (incluye Domiciliario y Mixto)
export const metodosPagoFavor: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "daviplata", label: "Daviplata" },
  { value: "datafono", label: "Datáfono" },
  { value: "domiciliario", label: "Domiciliario" },
  { value: "mixto", label: "Mixto" },
];

// Combinaciones posibles de pago Mixto para favores.
export const combosMixtoFavor: { value: TipoMixtoFavor; label: string }[] = [
  { value: "transferencia-domiciliario", label: "Transferencia y Domiciliario" },
  { value: "efectivo-domiciliario", label: "Efectivo y Domiciliario" },
  { value: "efectivo-transferencia", label: "Efectivo y Transferencia" },
];

export const comboFavorIncluye = (
  combo: TipoMixtoFavor,
  parte: "efectivo" | "transferencia" | "domiciliario"
) => combo.split("-").includes(parte);

// Descuento al domiciliario y sobrante de efectivo a entregar, según la
// combinación de pago Mixto elegida en un favor.
// - transferencia-domiciliario: no hay efectivo de cliente; se descuenta todo
//   lo que el domiciliario adelantó más el costo del domicilio.
// - efectivo-domiciliario: el efectivo recibido cubre primero el domicilio
//   (el sobrante se entrega); además se descuenta lo adelantado.
// - efectivo-transferencia: igual a la lógica de mixto ya existente en
//   domicilios normales (el efectivo cubre el domicilio, el sobrante se entrega).
export const calcFavorMixto = (
  combo: TipoMixtoFavor,
  costoDomicilio: number,
  valorEfectivoMixto: number,
  valorAdelantado: number
): { descuento: number; sobranteEfectivo: number } => {
  if (combo === "transferencia-domiciliario") {
    return { descuento: valorAdelantado + costoDomicilio, sobranteEfectivo: 0 };
  }
  const sobranteEfectivo = Math.max(0, valorEfectivoMixto - costoDomicilio);
  if (combo === "efectivo-domiciliario") {
    return { descuento: valorAdelantado, sobranteEfectivo };
  }
  return { descuento: 0, sobranteEfectivo };
};

// Sub-medios para pago Mixto (mismo set que transferencias estándar)
export const mediosTransferencia: { value: import("@/types").MedioTransferencia; label: string }[] = [
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "daviplata", label: "Daviplata" },
  { value: "datafono", label: "Datáfono" },
];

const LABELS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi",
  bancolombia: "Bancolombia",
  daviplata: "Daviplata",
  datafono: "Datáfono",
  mixto: "Mixto",
  domiciliario: "Domiciliario",
};

export const labelMetodo = (m: MetodoPago): string => LABELS_METODO[m] ?? m;

export const esTransferencia = (m: MetodoPago) => m !== "efectivo";

const PREFIJOS: Record<TipoFactura, string> = {
  mesa: "M",
  domicilio: "D",
  favor: "F",
  "reserva-domicilio": "RD",
  "reserva-mesa": "RM",
};

export const folio = (f: Factura) =>
  `${PREFIJOS[f.tipo] ?? "?"}-${String(f.consecutivo).padStart(4, "0")}`;
