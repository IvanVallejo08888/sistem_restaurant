"use client";
import { formatCOP } from "@/lib/utils";

// Gráfico de barras horizontal ligero (SVG/CSS, sin librerías).
export function BarChart({
  data, money = false,
}: {
  data: { label: string; value: number }[];
  money?: boolean;
}) {
  if (data.length === 0) return <p className="py-4 text-sm text-cocoa/50">Sin datos.</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-cocoa/70" title={d.label}>{d.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-full bg-sand">
            <div
              className="flex h-full items-center justify-end rounded-full bg-raspberry px-2 transition-all"
              style={{ width: `${Math.max((d.value / max) * 100, 6)}%` }}
            >
              <span className="text-xs font-bold text-white">
                {money ? formatCOP(d.value) : d.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
