// Implementación de DataService sobre LocalStorage (Fase 2 sin backend real).
// Simula latencia mínima y devuelve promesas, igual que haría la versión HTTP,
// para que los stores ya estén escritos de forma asíncrona.

import { DataService, Snapshot } from "./types";
import { storage } from "@/lib/storage";
import { uid, now } from "@/lib/utils";
import { Local, Producto, Domiciliario, Mesa, Factura, Gasto } from "@/types";

const KEY = "data";

const empty: Snapshot = {
  locales: [], productos: [], domiciliarios: [], mesas: [], facturas: [], gastos: [],
};

const read = (): Snapshot => ({ ...empty, ...storage.load<Snapshot>(KEY, empty) });
const write = (s: Snapshot) => storage.save(KEY, s);
const tick = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 0));

export class LocalStorageService implements DataService {
  async loadAll() {
    const s = read();
    return tick({
      ...s,
      // Excluir facturas con soft delete del estado en memoria
      facturas: s.facturas.filter((f) => !f.deletedAt),
      // Migración: productos existentes sin categoría reciben "heladeria" por defecto
      productos: s.productos.map((p) => ({
        ...p,
        categoria: p.categoria ?? ("heladeria" as const),
      })),
    });
  }

  async createLocal(d: Omit<Local, "id" | "creadoEn">) {
    const s = read();
    const item: Local = { ...d, id: uid(), creadoEn: now() };
    write({ ...s, locales: [...s.locales, item] });
    return tick(item);
  }
  async updateLocal(id: string, d: Partial<Local>) {
    const s = read();
    let updated!: Local;
    const locales = s.locales.map((x) => (x.id === id ? (updated = { ...x, ...d }) : x));
    write({ ...s, locales });
    return tick(updated);
  }
  async deleteLocal(id: string) {
    const s = read();
    write({ ...s, locales: s.locales.filter((x) => x.id !== id) });
    return tick(undefined);
  }

  async createProducto(d: Omit<Producto, "id" | "creadoEn">) {
    const s = read();
    const item: Producto = { ...d, id: uid(), creadoEn: now() };
    write({ ...s, productos: [...s.productos, item] });
    return tick(item);
  }
  async updateProducto(id: string, d: Partial<Producto>) {
    const s = read();
    let updated!: Producto;
    const productos = s.productos.map((x) => (x.id === id ? (updated = { ...x, ...d }) : x));
    write({ ...s, productos });
    return tick(updated);
  }
  async deleteProducto(id: string) {
    const s = read();
    write({ ...s, productos: s.productos.filter((x) => x.id !== id) });
    return tick(undefined);
  }

  async createDomiciliario(d: Omit<Domiciliario, "id" | "creadoEn">) {
    const s = read();
    const item: Domiciliario = { ...d, id: uid(), creadoEn: now() };
    write({ ...s, domiciliarios: [...s.domiciliarios, item] });
    return tick(item);
  }
  async updateDomiciliario(id: string, d: Partial<Domiciliario>) {
    const s = read();
    let updated!: Domiciliario;
    const domiciliarios = s.domiciliarios.map((x) => (x.id === id ? (updated = { ...x, ...d }) : x));
    write({ ...s, domiciliarios });
    return tick(updated);
  }
  async deleteDomiciliario(id: string) {
    const s = read();
    write({ ...s, domiciliarios: s.domiciliarios.filter((x) => x.id !== id) });
    return tick(undefined);
  }

  async createMesa(d: Omit<Mesa, "id" | "creadoEn">) {
    const s = read();
    const item: Mesa = { ...d, id: uid(), creadoEn: now() };
    write({ ...s, mesas: [...s.mesas, item] });
    return tick(item);
  }
  async updateMesa(id: string, d: Partial<Mesa>) {
    const s = read();
    let updated!: Mesa;
    const mesas = s.mesas.map((x) => (x.id === id ? (updated = { ...x, ...d }) : x));
    write({ ...s, mesas });
    return tick(updated);
  }
  async deleteMesa(id: string) {
    const s = read();
    write({ ...s, mesas: s.mesas.filter((x) => x.id !== id) });
    return tick(undefined);
  }

  async createFactura(d: Omit<Factura, "id" | "creadoEn">) {
    const s = read();
    const item: Factura = { ...d, id: uid(), creadoEn: now() };
    write({ ...s, facturas: [...s.facturas, item] });
    return tick(item);
  }
  async updateFactura(id: string, d: Partial<Factura>) {
    const s = read();
    let updated!: Factura;
    const facturas = s.facturas.map((x) => (x.id === id ? (updated = { ...x, ...d }) : x));
    write({ ...s, facturas });
    return tick(updated);
  }
  async deleteFactura(id: string) {
    // Soft delete: marca la factura con deletedAt en lugar de borrarla físicamente.
    // TODO: restringir por rol (admin/supervisor) cuando se implemente sistema de permisos.
    const s = read();
    const facturas = s.facturas.map((x) => (x.id === id ? { ...x, deletedAt: now() } : x));
    write({ ...s, facturas });
    return tick(undefined);
  }

  async createGasto(d: Omit<Gasto, "id" | "creadoEn">) {
    const s = read();
    const item: Gasto = { ...d, id: uid(), creadoEn: now() };
    write({ ...s, gastos: [...s.gastos, item] });
    return tick(item);
  }
  async deleteGasto(id: string) {
    const s = read();
    write({ ...s, gastos: s.gastos.filter((x) => x.id !== id) });
    return tick(undefined);
  }
}
