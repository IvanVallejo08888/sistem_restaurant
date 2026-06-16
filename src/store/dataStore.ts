import { create } from "zustand";
import {
  Local, Producto, Domiciliario, Mesa, Factura, Gasto,
} from "@/types";
import { dataService } from "@/services";

// Store de datos respaldado por la capa de servicios.
// No conoce LocalStorage ni HTTP: solo llama a dataService.
// Estrategia: actualización optimista del estado + persistencia vía servicio.

type DataState = {
  locales: Local[];
  productos: Producto[];
  domiciliarios: Domiciliario[];
  mesas: Mesa[];
  facturas: Factura[];
  gastos: Gasto[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;

  addLocal: (d: Omit<Local, "id" | "creadoEn">) => Promise<Local>;
  updateLocal: (id: string, d: Partial<Local>) => Promise<void>;
  toggleLocal: (id: string) => Promise<void>;

  addProducto: (d: Omit<Producto, "id" | "creadoEn">) => Promise<void>;
  updateProducto: (id: string, d: Partial<Producto>) => Promise<void>;
  removeProducto: (id: string) => Promise<void>;

  addDomiciliario: (d: Omit<Domiciliario, "id" | "creadoEn">) => Promise<void>;
  updateDomiciliario: (id: string, d: Partial<Domiciliario>) => Promise<void>;
  removeDomiciliario: (id: string) => Promise<void>;

  addMesa: (d: Omit<Mesa, "id" | "creadoEn">) => Promise<void>;
  updateMesa: (id: string, d: Partial<Mesa>) => Promise<void>;
  removeMesa: (id: string) => Promise<void>;

  addFactura: (d: Omit<Factura, "id" | "creadoEn" | "consecutivo">) => Promise<Factura>;
  updateFactura: (id: string, d: Partial<Factura>) => Promise<void>;
  removeFactura: (id: string) => Promise<void>;
  asignarDomiciliario: (facturaId: string, domiciliarioId: string | null) => Promise<void>;
  marcarServida: (facturaId: string, servida: boolean) => Promise<void>;

  addGasto: (d: Omit<Gasto, "id" | "creadoEn">) => Promise<void>;
  removeGasto: (id: string) => Promise<void>;
};

export const useData = create<DataState>((set, get) => ({
  locales: [],
  productos: [],
  domiciliarios: [],
  mesas: [],
  facturas: [],
  gastos: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const snap = await dataService.loadAll();
    set({ ...snap, hydrated: true });
  },

  // Recarga silenciosa: actualiza datos sin bloquear la UI ni reiniciar el estado de sesión.
  refresh: async () => {
    try {
      const snap = await dataService.loadAll();
      set(snap);
    } catch {
      // Silencioso: no interrumpe la UI si la red falla momentáneamente.
    }
  },

  addLocal: async (d) => {
    const local = await dataService.createLocal(d);
    set((s) => ({ locales: [...s.locales, local] }));
    return local;
  },
  updateLocal: async (id, d) => {
    const up = await dataService.updateLocal(id, d);
    set((s) => ({ locales: s.locales.map((x) => (x.id === id ? up : x)) }));
  },
  toggleLocal: async (id) => {
    const cur = get().locales.find((x) => x.id === id);
    if (!cur) return;
    const up = await dataService.updateLocal(id, { activo: !cur.activo });
    set((s) => ({ locales: s.locales.map((x) => (x.id === id ? up : x)) }));
  },

  addProducto: async (d) => {
    const it = await dataService.createProducto(d);
    set((s) => ({ productos: [...s.productos, it] }));
  },
  updateProducto: async (id, d) => {
    const up = await dataService.updateProducto(id, d);
    set((s) => ({ productos: s.productos.map((x) => (x.id === id ? up : x)) }));
  },
  removeProducto: async (id) => {
    await dataService.deleteProducto(id);
    set((s) => ({ productos: s.productos.filter((x) => x.id !== id) }));
  },

  addDomiciliario: async (d) => {
    const it = await dataService.createDomiciliario(d);
    set((s) => ({ domiciliarios: [...s.domiciliarios, it] }));
  },
  updateDomiciliario: async (id, d) => {
    const up = await dataService.updateDomiciliario(id, d);
    set((s) => ({ domiciliarios: s.domiciliarios.map((x) => (x.id === id ? up : x)) }));
  },
  removeDomiciliario: async (id) => {
    await dataService.deleteDomiciliario(id);
    set((s) => ({ domiciliarios: s.domiciliarios.filter((x) => x.id !== id) }));
  },

  addMesa: async (d) => {
    const it = await dataService.createMesa(d);
    set((s) => ({ mesas: [...s.mesas, it] }));
  },
  updateMesa: async (id, d) => {
    const up = await dataService.updateMesa(id, d);
    set((s) => ({ mesas: s.mesas.map((x) => (x.id === id ? up : x)) }));
  },
  removeMesa: async (id) => {
    await dataService.deleteMesa(id);
    set((s) => ({ mesas: s.mesas.filter((x) => x.id !== id) }));
  },

  addFactura: async (d) => {
    const consec = get().facturas.filter((f) => f.localId === d.localId).length + 1;
    const factura = await dataService.createFactura({ ...d, consecutivo: consec } as Omit<Factura, "id" | "creadoEn">);
    set((s) => ({ facturas: [...s.facturas, factura] }));
    return factura;
  },
  updateFactura: async (id, d) => {
    const up = await dataService.updateFactura(id, d);
    set((s) => ({ facturas: s.facturas.map((x) => (x.id === id ? up : x)) }));
  },
  removeFactura: async (id) => {
    await dataService.deleteFactura(id);
    set((s) => ({ facturas: s.facturas.filter((x) => x.id !== id) }));
  },

  asignarDomiciliario: async (facturaId, domiciliarioId) => {
    const up = await dataService.updateFactura(facturaId, { domiciliarioId: domiciliarioId ?? undefined });
    set((s) => ({ facturas: s.facturas.map((x) => (x.id === facturaId ? up : x)) }));
  },
  marcarServida: async (facturaId, servida) => {
    const up = await dataService.updateFactura(facturaId, { servida });
    set((s) => ({ facturas: s.facturas.map((x) => (x.id === facturaId ? up : x)) }));
  },

  addGasto: async (d) => {
    const it = await dataService.createGasto(d);
    set((s) => ({ gastos: [...s.gastos, it] }));
  },
  removeGasto: async (id) => {
    await dataService.deleteGasto(id);
    set((s) => ({ gastos: s.gastos.filter((x) => x.id !== id) }));
  },
}));
