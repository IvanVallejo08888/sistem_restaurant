import { ID } from "@/types";

export const uid = (): ID =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

export const now = () => new Date().toISOString();

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

// Normaliza texto para búsqueda: ignora tildes y mayúsculas.
export const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// Hora en formato 12h (es-CO)
export const formatHora12 = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// Suma minutos a una fecha ISO y devuelve hora 12h
export const horaMas = (iso: string, minutos: number) =>
  formatHora12(new Date(new Date(iso).getTime() + minutos * 60000).toISOString());

export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");
