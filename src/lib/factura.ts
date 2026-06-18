import { Factura, ItemFactura, MetodoPago, TipoAjuste, TipoFactura, TipoMixtoFavor } from "@/types";

export const subtotalDe = (items: ItemFactura[]) =>
  items.reduce((acc, it) => acc + it.valor * it.cantidad, 0);

export const totalDe = (items: ItemFactura[], valorDomicilio = 0) =>
  subtotalDe(items) + (valorDomicilio || 0);

// Opciones de "Valor fijo" / "Porcentaje" para Aplicar descuento y Costo adicional
// (mesa, domicilio, reserva-mesa, reserva-domicilio). Reutiliza el mismo estilo de
// botones que Método de pago.
export const tiposAjuste: { value: TipoAjuste; label: string }[] = [
  { value: "fijo", label: "Valor fijo" },
  { value: "porcentaje", label: "Porcentaje" },
];

// Monto en pesos de un ajuste (descuento o costo adicional) según su tipo.
// "fijo" usa el valor ingresado directo; "porcentaje" se calcula sobre `base`.
export const calcularAjuste = (tipo: TipoAjuste, valorIngresado: number, base: number) =>
  tipo === "porcentaje" ? Math.round((base * valorIngresado) / 100) : valorIngresado;

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

// Descuento al domiciliario según la combinación de pago Mixto elegida en un
// favor. En un Favor el negocio no vende nada (ver comentario en el tipo B
// más abajo): el producto se cubre aparte como gasto empresarial, así que
// este cuadre solo le importa quién puso el dinero del domicilio.
// - transferencia-domiciliario / efectivo-domiciliario: el domiciliario
//   adelantó parte (o todo) del producto de su bolsillo; se descuenta lo
//   adelantado más el costo del domicilio. El efectivo/transferencia que
//   cubre el resto del producto es ajeno a este cuadre.
// - efectivo-transferencia: ninguno de los dos pagos fue del domiciliario,
//   así que solo se descuenta el domicilio (igual que pago no-mixto).
export const calcFavorMixto = (
  combo: TipoMixtoFavor,
  costoDomicilio: number,
  valorAdelantado: number
): { descuento: number; sobranteEfectivo: number } => {
  if (combo === "transferencia-domiciliario" || combo === "efectivo-domiciliario") {
    return { descuento: valorAdelantado + costoDomicilio, sobranteEfectivo: 0 };
  }
  return { descuento: costoDomicilio, sobranteEfectivo: 0 };
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
  regalo: "G",
  "reserva-regalo": "RG",
};

// "Quien recibe" en regalo/reserva-regalo se modela con los mismos campos de
// domicilio (clienteNombre/direccion/barrio); esta utilidad evita repetir la
// condición de 4 valores en cada componente que necesita tratarlos igual.
export const esDomicilioLike = (tipo: TipoFactura) =>
  tipo === "domicilio" || tipo === "reserva-domicilio" || tipo === "regalo" || tipo === "reserva-regalo";

export const esReservaLike = (tipo: TipoFactura) =>
  tipo === "reserva-domicilio" || tipo === "reserva-mesa" || tipo === "reserva-regalo";

export const esRegaloLike = (tipo: TipoFactura) => tipo === "regalo" || tipo === "reserva-regalo";

export const folio = (f: Factura) =>
  `${PREFIJOS[f.tipo] ?? "?"}-${String(f.consecutivo).padStart(4, "0")}`;
