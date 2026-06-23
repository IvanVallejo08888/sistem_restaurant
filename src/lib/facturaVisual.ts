// Lógica visual compartida entre las tarjetas de Cocina y Despachador:
// sombras por categoría de producto y jerarquía del título de la tarjeta.
// Única fuente de verdad para que ambas vistas se vean consistentes.
import { Factura, Producto } from "@/types";
import { folio } from "@/lib/factura";

// ── Sombras dinámicas por categoría ──────────────────────────────────────────
export const SHADOW_HELADERIA =
  "0 0 0 5px rgba(59,130,246,0.75), 0 10px 28px rgba(59,130,246,0.45)";
export const SHADOW_COMIDAS =
  "0 0 0 5px rgba(251,146,60,0.75), 0 10px 28px rgba(251,146,60,0.45)";
export const SHADOW_MIXTO =
  "-6px 0 14px rgba(59,130,246,0.65), 6px 0 14px rgba(251,146,60,0.65), 0 6px 18px rgba(0,0,0,0.15)";

export function categoriasDe(items: Factura["items"], productos: Producto[]): Set<string> {
  return new Set(
    items
      .map((it) => productos.find((p) => p.id === it.productoId)?.categoria)
      .filter(Boolean) as string[]
  );
}

export function calcularSombra(
  items: Factura["items"],
  productos: Producto[]
): string | undefined {
  const cats = categoriasDe(items, productos);
  const h = cats.has("heladeria");
  const c = cats.has("comidas-rapidas");
  if (h && c) return SHADOW_MIXTO;
  if (h) return SHADOW_HELADERIA;
  if (c) return SHADOW_COMIDAS;
  return undefined;
}

// Agrupa los items de una factura por categoría de producto. Usado por las
// secciones "Heladería" / "Comidas Rápidas" tanto en Cocina como en Despachador.
export function agruparPorCategoria(items: Factura["items"], productos: Producto[]) {
  const getCategoria = (productoId: string) =>
    productos.find((p) => p.id === productoId)?.categoria;
  const itemsHeladeria = items.filter((it) => getCategoria(it.productoId) === "heladeria");
  const itemsComidas = items.filter((it) => getCategoria(it.productoId) === "comidas-rapidas");
  const itemsOtros = items.filter((it) => !getCategoria(it.productoId));
  return { itemsHeladeria, itemsComidas, itemsOtros };
}

// "favor" nunca llega a Cocina (se filtra antes), pero sí aparece en
// Despachador, así que necesita su propio caso para no perder el nombre
// del favor en el subtítulo de la tarjeta.
function nombreFactura(f: Factura) {
  if (f.tipo === "favor") return f.nombreFavor;
  return f.tipo === "mesa" || f.tipo === "reserva-mesa" ? f.mesaNombre : f.clienteNombre;
}

// Domicilio / Reserva Domicilio: el dato grande es el barrio (campo
// independiente del modelo) y el folio (D-0002) pasa a texto pequeño al pie.
// Mesa / Reserva Mesa reciben el mismo tratamiento con el número de mesa.
// Regalo/Reserva Regalo no se tocan: folio en grande, como siempre.
export function tituloFactura(f: Factura): { grande: string; chico?: string; folioAbajo: boolean } {
  const esMesaTipo = f.tipo === "mesa" || f.tipo === "reserva-mesa";
  const esDomicilioFolioAbajo = f.tipo === "domicilio" || f.tipo === "reserva-domicilio";
  const folioAbajo = esMesaTipo || esDomicilioFolioAbajo;
  const grande = esMesaTipo
    ? f.mesaNombre || folio(f)
    : esDomicilioFolioAbajo
    ? f.barrio || f.clienteNombre || folio(f)
    : folio(f);
  const chico = esMesaTipo ? undefined : nombreFactura(f);
  return { grande, chico, folioAbajo };
}
