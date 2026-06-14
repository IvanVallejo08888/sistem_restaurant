"use client";
import { useData } from "@/store/dataStore";

// Selector de local sobre el que opera el admin (Carta/Domiciliarios/Mesas).
export function LocalSelector({
  value, onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const locales = useData((s) => s.locales);
  return (
    <div className="mb-5">
      <label className="mb-1 block text-sm font-bold text-cocoa/80">Local</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs rounded-xl border border-sand bg-white px-4 py-2.5 font-semibold text-cocoa focus:border-raspberry focus:outline-none"
      >
        <option value="">Selecciona un local…</option>
        {locales.map((l) => (
          <option key={l.id} value={l.id}>{l.nombre}</option>
        ))}
      </select>
    </div>
  );
}
