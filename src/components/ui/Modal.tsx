"use client";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

export function Modal({
  open, onClose, title, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-cocoa/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-pop rounded-xl2 bg-vanilla shadow-soft">
        <div className="flex items-center justify-between border-b border-sand px-6 py-4">
          <h3 className="font-display text-xl font-semibold text-cocoa">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-sand" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-sand px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
