import { Factura, ItemFactura, MetodoPago } from "@/types";

export const subtotalDe = (items: ItemFactura[]) =>
  items.reduce((acc, it) => acc + it.valor * it.cantidad, 0);

export const totalDe = (items: ItemFactura[], valorDomicilio = 0) =>
  subtotalDe(items) + (valorDomicilio || 0);

export const metodosPago: { value: MetodoPago; label: string; grupo: "efectivo" | "transferencia" }[] = [
  { value: "efectivo", label: "Efectivo", grupo: "efectivo" },
  { value: "nequi", label: "Nequi", grupo: "transferencia" },
  { value: "bancolombia", label: "Bancolombia", grupo: "transferencia" },
  { value: "daviplata", label: "Daviplata", grupo: "transferencia" },
  { value: "datafono", label: "Datáfono", grupo: "transferencia" },
];

export const labelMetodo = (m: MetodoPago) =>
  metodosPago.find((x) => x.value === m)?.label ?? m;

export const esTransferencia = (m: MetodoPago) => m !== "efectivo";

// Genera el número de factura legible
export const folio = (f: Factura) =>
  `${f.tipo === "mesa" ? "M" : "D"}-${String(f.consecutivo).padStart(4, "0")}`;
