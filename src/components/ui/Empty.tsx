import { ReactNode } from "react";

export function Empty({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-sand bg-white/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-raspberry/60">{icon}</div>}
      <p className="font-display text-lg font-semibold text-cocoa">{title}</p>
      {hint && <p className="mt-1 text-sm text-cocoa/60">{hint}</p>}
    </div>
  );
}
