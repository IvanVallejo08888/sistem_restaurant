// Esqueleto de la implementación HTTP para la Fase de backend real.
// Cuando existan las API Routes (Next) respaldadas por Neon PostgreSQL,
// se completa cada método con fetch y se activa en services/index.ts.
// La firma es idéntica a LocalStorageService, por lo que la UI no cambia.

import { DataService, Snapshot } from "./types";
import { Local, Producto, Domiciliario, Mesa, Factura, Gasto, Recomendacion } from "@/types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    // Las API routes devuelven { error: string } con el mensaje real de Supabase
    // (p. ej. "columna no encontrada"); propagarlo en vez de un código HTTP genérico
    // permite mostrarlo al usuario en vez de fallar en silencio.
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `API ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export class HttpService implements DataService {
  loadAll() { return api<Snapshot>("/snapshot"); }

  createLocal(d: Omit<Local, "id" | "creadoEn">) { return api<Local>("/locales", { method: "POST", body: JSON.stringify(d) }); }
  updateLocal(id: string, d: Partial<Local>) { return api<Local>(`/locales/${id}`, { method: "PATCH", body: JSON.stringify(d) }); }
  deleteLocal(id: string) { return api<void>(`/locales/${id}`, { method: "DELETE" }); }

  createProducto(d: Omit<Producto, "id" | "creadoEn">) { return api<Producto>("/productos", { method: "POST", body: JSON.stringify(d) }); }
  updateProducto(id: string, d: Partial<Producto>) { return api<Producto>(`/productos/${id}`, { method: "PATCH", body: JSON.stringify(d) }); }
  deleteProducto(id: string) { return api<void>(`/productos/${id}`, { method: "DELETE" }); }

  createDomiciliario(d: Omit<Domiciliario, "id" | "creadoEn">) { return api<Domiciliario>("/domiciliarios", { method: "POST", body: JSON.stringify(d) }); }
  updateDomiciliario(id: string, d: Partial<Domiciliario>) { return api<Domiciliario>(`/domiciliarios/${id}`, { method: "PATCH", body: JSON.stringify(d) }); }
  deleteDomiciliario(id: string) { return api<void>(`/domiciliarios/${id}`, { method: "DELETE" }); }

  createMesa(d: Omit<Mesa, "id" | "creadoEn">) { return api<Mesa>("/mesas", { method: "POST", body: JSON.stringify(d) }); }
  updateMesa(id: string, d: Partial<Mesa>) { return api<Mesa>(`/mesas/${id}`, { method: "PATCH", body: JSON.stringify(d) }); }
  deleteMesa(id: string) { return api<void>(`/mesas/${id}`, { method: "DELETE" }); }

  createFactura(d: Omit<Factura, "id" | "creadoEn">) { return api<Factura>("/facturas", { method: "POST", body: JSON.stringify(d) }); }
  updateFactura(id: string, d: Partial<Factura>) { return api<Factura>(`/facturas/${id}`, { method: "PATCH", body: JSON.stringify(d) }); }
  deleteFactura(id: string) { return api<void>(`/facturas/${id}`, { method: "DELETE" }); }

  createGasto(d: Omit<Gasto, "id" | "creadoEn">) { return api<Gasto>("/gastos", { method: "POST", body: JSON.stringify(d) }); }
  deleteGasto(id: string) { return api<void>(`/gastos/${id}`, { method: "DELETE" }); }

  createRecomendacion(d: Omit<Recomendacion, "id" | "creadoEn">) { return api<Recomendacion>("/recomendaciones", { method: "POST", body: JSON.stringify(d) }); }
  deleteRecomendacion(id: string) { return api<void>(`/recomendaciones/${id}`, { method: "DELETE" }); }
}
