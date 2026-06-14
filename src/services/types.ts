// Contrato de la capa de servicios.
// La UI y los stores hablan SOLO con esta interfaz, nunca con LocalStorage
// ni con fetch directamente. En producción se implementa con API Routes + Neon;
// en esta fase se implementa con LocalStorage. Cambiar de una a otra NO afecta la UI.

import {
  Local, Producto, Domiciliario, Mesa, Factura,
} from "@/types";

export type Snapshot = {
  locales: Local[];
  productos: Producto[];
  domiciliarios: Domiciliario[];
  mesas: Mesa[];
  facturas: Factura[];
};

export interface DataService {
  // Carga inicial de todo el estado (en backend: GET a varios endpoints o uno agregado).
  loadAll(): Promise<Snapshot>;

  // Locales
  createLocal(d: Omit<Local, "id" | "creadoEn">): Promise<Local>;
  updateLocal(id: string, d: Partial<Local>): Promise<Local>;

  // Productos
  createProducto(d: Omit<Producto, "id" | "creadoEn">): Promise<Producto>;
  updateProducto(id: string, d: Partial<Producto>): Promise<Producto>;
  deleteProducto(id: string): Promise<void>;

  // Domiciliarios
  createDomiciliario(d: Omit<Domiciliario, "id" | "creadoEn">): Promise<Domiciliario>;
  updateDomiciliario(id: string, d: Partial<Domiciliario>): Promise<Domiciliario>;
  deleteDomiciliario(id: string): Promise<void>;

  // Mesas
  createMesa(d: Omit<Mesa, "id" | "creadoEn">): Promise<Mesa>;
  updateMesa(id: string, d: Partial<Mesa>): Promise<Mesa>;
  deleteMesa(id: string): Promise<void>;

  // Facturas
  createFactura(d: Omit<Factura, "id" | "creadoEn">): Promise<Factura>;
  updateFactura(id: string, d: Partial<Factura>): Promise<Factura>;
}
