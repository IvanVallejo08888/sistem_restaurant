import { Factura, ItemFactura, MetodoPago, TipoFactura } from "@/types";

export const subtotalDe = (items: ItemFactura[]) =>
  items.reduce((acc, it) => acc + it.valor * it.cantidad, 0);

export const totalDe = (items: ItemFactura[], valorDomicilio = 0) =>
  subtotalDe(items) + (valorDomicilio || 0);

// Métodos de pago estándar (mesa, domicilio, reservas)
export const metodosPago: { value: MetodoPago; label: string; grupo: "efectivo" | "transferencia" }[] = [
  { value: "efectivo", label: "Efectivo", grupo: "efectivo" },
  { value: "nequi", label: "Nequi", grupo: "transferencia" },
  { value: "bancolombia", label: "Bancolombia", grupo: "transferencia" },
  { value: "daviplata", label: "Daviplata", grupo: "transferencia" },
  { value: "datafono", label: "Datáfono", grupo: "transferencia" },
];

// Métodos de pago extendidos para tipo "favor"
export const metodosPagoFavor: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "daviplata", label: "Daviplata" },
  { value: "mixto", label: "Mixto" },
  { value: "domiciliario", label: "Domiciliario" },
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
