// Adaptador de persistencia de bajo nivel.
// En Fase 2, este es el único archivo que se reemplaza por llamadas a API Routes.
// La interfaz pública (load/save) se mantiene igual.

const PREFIX = "antojos:";

export const storage = {
  load<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  save<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* cuota excedida u otro error: ignorar en Fase 1 */
    }
  },
};
